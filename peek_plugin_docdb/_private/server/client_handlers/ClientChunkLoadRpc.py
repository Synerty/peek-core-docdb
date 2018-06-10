import logging
from typing import List

from peek_plugin_base.PeekVortexUtil import peekServerName, peekClientName
from peek_plugin_base.storage.DbConnection import DbSessionCreator
from peek_plugin_docdb._private.PluginNames import docDbFilt
from peek_plugin_docdb._private.storage.EncodedDocDbIndexChunk import \
    EncodedDocDbIndexChunk
from peek_plugin_docdb._private.storage.EncodedDocumentChunk import \
    EncodedDocumentChunk
from vortex.rpc.RPC import vortexRPC

logger = logging.getLogger(__name__)


class ClientChunkLoadRpc:
    def __init__(self, dbSessionCreator: DbSessionCreator):
        self._dbSessionCreator = dbSessionCreator

    def makeHandlers(self):
        """ Make Handlers

        In this method we start all the RPC handlers
        start() returns an instance of it's self so we can simply yield the result
        of the start method.

        """

        yield self.loadDocDbIndexChunks.start(funcSelf=self)
        yield self.loadDocumentChunks.start(funcSelf=self)
        logger.debug("RPCs started")

    # -------------
    @vortexRPC(peekServerName, acceptOnlyFromVortex=peekClientName, timeoutSeconds=60,
               additionalFilt=docDbFilt, deferToThread=True)
    def loadDocDbIndexChunks(self, offset: int, count: int
                              ) -> List[EncodedDocDbIndexChunk]:
        """ Update Page Loader Status

        Tell the server of the latest status of the loader

        """
        session = self._dbSessionCreator()
        try:
            chunks = (session
                      .query(EncodedDocDbIndexChunk)
                      .order_by(EncodedDocDbIndexChunk.id)
                      .offset(offset)
                      .limit(count)
                      .yield_per(count))

            return list(chunks)

        finally:
            session.close()

    # -------------
    @vortexRPC(peekServerName, acceptOnlyFromVortex=peekClientName, timeoutSeconds=60,
               additionalFilt=docDbFilt, deferToThread=True)
    def loadDocumentChunks(self, offset: int, count: int
                               ) -> List[EncodedDocumentChunk]:
        """ Update Page Loader Status

        Tell the server of the latest status of the loader

        """
        session = self._dbSessionCreator()
        try:
            chunks = (session
                      .query(EncodedDocumentChunk)
                      .order_by(EncodedDocumentChunk.id)
                      .offset(offset)
                      .limit(count)
                      .yield_per(count))

            return list(chunks)

        finally:
            session.close()
