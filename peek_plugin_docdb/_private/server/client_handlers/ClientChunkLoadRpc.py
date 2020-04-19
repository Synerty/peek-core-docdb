import logging
from typing import List

from vortex.rpc.RPC import vortexRPC

from peek_abstract_chunked_index.private.server.client_handlers.ACIChunkLoadRpcABC import \
    ACIChunkLoadRpcABC
from peek_plugin_base.PeekVortexUtil import peekServerName, peekClientName
from peek_plugin_docdb._private.PluginNames import docDbFilt
from peek_plugin_docdb._private.storage.DocDbEncodedChunk import DocDbEncodedChunk

logger = logging.getLogger(__name__)


class ClientChunkLoadRpc(ACIChunkLoadRpcABC):

    def makeHandlers(self):
        """ Make Handlers

        In this method we start all the RPC handlers
        start() returns an instance of it's self so we can simply yield the result
        of the start method.

        """

        yield self.loadDocumentChunks.start(funcSelf=self)
        logger.debug("RPCs started")

    # -------------
    @vortexRPC(peekServerName, acceptOnlyFromVortex=peekClientName, timeoutSeconds=60,
               additionalFilt=docDbFilt, deferToThread=True)
    def loadDocumentChunks(self, offset: int, count: int) -> List[DocDbEncodedChunk]:
        """ Update Page Loader Status

        Tell the server of the latest status of the loader

        """
        return self.ckiInitialLoadChunksBlocking(offset, count, DocDbEncodedChunk)