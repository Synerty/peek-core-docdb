import logging
from datetime import datetime
from typing import List

import pytz
from peek_plugin_docdb._private.server.client_handlers.ClientChunkUpdateHandler import \
    ClientChunkUpdateHandler
from peek_plugin_docdb._private.server.controller.StatusController import \
    StatusController
from peek_plugin_docdb._private.storage.DocDbCompilerQueue import DocDbCompilerQueue
from sqlalchemy import asc
from twisted.internet import task, reactor, defer
from twisted.internet.defer import inlineCallbacks
from vortex.DeferUtil import deferToThreadWrapWithLogger, vortexLogFailure

logger = logging.getLogger(__name__)


class ChunkCompilerQueueController:
    """ DocDbChunkCompilerQueueController

    Compile the disp items into the grid data

    1) Query for queue
    2) Process queue
    3) Delete from queue

    """

    ITEMS_PER_TASK = 10
    PERIOD = 1.000

    QUEUE_MAX = 20
    QUEUE_MIN = 0

    TASK_TIMEOUT = 60.0

    def __init__(self, dbSessionCreator,
                 statusController: StatusController,
                 clientChunkUpdateHandler: ClientChunkUpdateHandler):
        self._dbSessionCreator = dbSessionCreator
        self._statusController: StatusController = statusController
        self._clientChunkUpdateHandler: ClientChunkUpdateHandler = clientChunkUpdateHandler

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = -1
        self._queueCount = 0

        self._chunksInProgress = set()

    def start(self):
        self._statusController.setCompilerStatus(True, self._queueCount)
        d = self._pollLoopingCall.start(self.PERIOD, now=False)
        d.addCallbacks(self._timerCallback, self._timerErrback)

    def _timerErrback(self, failure):
        vortexLogFailure(failure, logger)
        self._statusController.setCompilerStatus(False, self._queueCount)
        self._statusController.setCompilerError(str(failure.value))

    def _timerCallback(self, _):
        self._statusController.setCompilerStatus(False, self._queueCount)

    def stop(self):
        if self._pollLoopingCall.running:
            self._pollLoopingCall.stop()

    def shutdown(self):
        self.stop()

    @inlineCallbacks
    def _poll(self):
        # We queue the grids in bursts, reducing the work we have to do.
        if self._queueCount > self.QUEUE_MIN:
            return

        # Check for queued items
        queueItems = yield self._grabQueueChunk()
        if not queueItems:
            return

        # Send the tasks to the peek worker
        for start in range(0, len(queueItems), self.ITEMS_PER_TASK):
            items = queueItems[start: start + self.ITEMS_PER_TASK]

            # If we're already processing these chunks, then return and try later
            if self._chunksInProgress & set([o.chunkKey for o in items]):
                return

            # Set the watermark
            self._lastQueueId = items[-1].id

            # This should never fail
            d = self._sendToWorker(items)
            d.addErrback(vortexLogFailure, logger)

            self._queueCount += 1
            if self._queueCount >= self.QUEUE_MAX:
                break

        yield self._dedupeQueue()

    @inlineCallbacks
    def _sendToWorker(self, items: List[DocDbCompilerQueue]):
        from peek_plugin_docdb._private.worker.tasks.ChunkCompilerTask import \
            compileDocumentChunk

        startTime = datetime.now(pytz.utc)

        # Add the chunks we're processing to the set
        self._chunksInProgress |= set([o.chunkKey for o in items])

        try:
            d = compileDocumentChunk.delay(items)
            d.addTimeout(self.TASK_TIMEOUT, reactor)

            chunkKeys = yield d
            logger.debug("Time Taken = %s" % (datetime.now(pytz.utc) - startTime))
            self._queueCount -= 1
            self._clientChunkUpdateHandler.sendChunks(chunkKeys)
            self._statusController.addToCompilerTotal(len(items))
            self._statusController.setCompilerStatus(True, self._queueCount)

            # Success, Remove the chunks from the in-progress queue
            self._chunksInProgress -= set([o.chunkKey for o in items])

        except Exception as e:
            if isinstance(e, defer.TimeoutError):
                logger.info("Retrying compile, Task has timed out.")
            else:
                logger.debug("Retrying compile : %s", str(e))

            reactor.callLater(2.0, self._sendToWorker, items)
            return

    @deferToThreadWrapWithLogger(logger)
    def _grabQueueChunk(self):
        session = self._dbSessionCreator()
        try:
            qry = (session.query(DocDbCompilerQueue)
                   .order_by(asc(DocDbCompilerQueue.id))
                   .filter(DocDbCompilerQueue.id > self._lastQueueId)
                   .yield_per(self.QUEUE_MAX)
                   .limit(self.QUEUE_MAX)
                   )

            queueItems = qry.all()
            session.expunge_all()

            # Deduplicate the values and return the ones with the lowest ID
            return list({o.chunkKey: o for o in reversed(queueItems)}.values())

        finally:
            session.close()

    @deferToThreadWrapWithLogger(logger)
    def _dedupeQueue(self):
        session = self._dbSessionCreator()
        try:
            session.execute("""
                with sq as (
                    SELECT min(id) as "minId"
                    FROM pl_docdb."DocDbChunkQueue"
                    WHERE id > %s
                    GROUP BY "modelSetId", "chunkKey"
                )
                DELETE
                FROM pl_docdb."DocDbChunkQueue"
                WHERE "id" not in (SELECT "minId" FROM sq)
            """ % self._lastQueueId)
            session.commit()
        finally:
            session.close()
