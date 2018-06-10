import logging

from twisted.internet.defer import inlineCallbacks

from peek_plugin_docdb._private.worker.tasks.ImportTask import importTask

logger = logging.getLogger(__name__)


class ImportController:
    def __init__(self):
        pass

    def shutdown(self):
        pass

    @inlineCallbacks
    def importDocuments(self, modelSetKey: str, documentsEncodedPayload: bytes):
        yield importTask.delay(modelSetKey, documentsEncodedPayload)
