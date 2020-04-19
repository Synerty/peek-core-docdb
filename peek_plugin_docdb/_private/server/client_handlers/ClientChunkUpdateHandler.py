import logging
from typing import Dict

from peek_abstract_chunked_index.private.server.client_handlers.ChunkedIndexChunkUpdateHandlerABC import \
    ChunkedIndexChunkUpdateHandlerABC
from peek_abstract_chunked_index.private.tuples.ChunkedIndexEncodedChunkTupleABC import \
    ChunkedIndexEncodedChunkTupleABC
from peek_plugin_docdb._private.client.controller.DocumentCacheController import \
    clientDocumentUpdateFromServerFilt
from peek_plugin_docdb._private.storage.DocDbEncodedChunk import DocDbEncodedChunk

logger = logging.getLogger(__name__)


class ClientChunkUpdateHandler(ChunkedIndexChunkUpdateHandlerABC):
    _ChunkedTuple: ChunkedIndexEncodedChunkTupleABC = DocDbEncodedChunk
    _updateFromServerFilt: Dict = clientDocumentUpdateFromServerFilt
    _logger: logging.Logger = logger