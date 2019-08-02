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
from twisted.internet import task
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

    def __init__(self, dbSessionCreator,
                 statusController: StatusController,
                 clientChunkUpdateHandler: ClientChunkUpdateHandler):
        self._dbSessionCreator = dbSessionCreator
        self._statusController: StatusController = statusController
        self._clientChunkUpdateHandler: ClientChunkUpdateHandler = clientChunkUpdateHandler

        self._pollLoopingCall = task.LoopingCall(self._poll)
        self._lastQueueId = -1
        self._queueCount = 0

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
        from peek_plugin_docdb._private.worker.tasks.ChunkCompilerTask import \
            compileDocumentChunk

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

            # Set the watermark
            self._lastQueueId = items[-1].id

            d = compileDocumentChunk.delay(items)
            d.addCallback(self._pollCallback, datetime.now(pytz.utc), len(items))
            d.addErrback(self._pollErrback, datetime.now(pytz.utc))

            self._queueCount += 1
            if self._queueCount >= self.QUEUE_MAX:
                break

        yield self._dedupeQueue()

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

    def _pollCallback(self, chunkKeys: List[str], startTime, processedCount):
        self._queueCount -= 1
        logger.debug("Time Taken = %s" % (datetime.now(pytz.utc) - startTime))
        self._clientChunkUpdateHandler.sendChunks(chunkKeys)
        self._statusController.addToCompilerTotal(processedCount)
        self._statusController.setCompilerStatus(True, self._queueCount)

    def _pollErrback(self, failure, startTime):
        self._queueCount -= 1
        self._statusController.setCompilerError(str(failure.value))
        self._statusController.setCompilerStatus(True, self._queueCount)
        logger.debug("Time Taken = %s" % (datetime.now(pytz.utc) - startTime))
        vortexLogFailure(failure, logger)
