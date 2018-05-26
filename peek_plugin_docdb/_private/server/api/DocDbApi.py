from typing import List

from twisted.internet.defer import Deferred

from peek_plugin_docdb._private.server.controller.MainController import MainController
from peek_plugin_docdb.server.DocDbApiABC import DocDbApiABC
from peek_plugin_docdb.tuples.DocumentTuple import DocumentTuple


class DocDbApi(DocDbApiABC):

    def __init__(self, mainController: MainController):
        self._mainController = mainController

    def shutdown(self):
        pass

    def createOrUpdateDocuments(self, documents: List[DocumentTuple]) -> Deferred:
        pass

    def deleteDocuments(self, keys: List[str]) -> Deferred:
        pass