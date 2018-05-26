from abc import ABCMeta, abstractmethod
from typing import List

from twisted.internet.defer import Deferred

from peek_plugin_docdb.tuples.DocumentTuple import DocumentTuple


class DocDbApiABC(metaclass=ABCMeta):

    @abstractmethod
    def createOrUpdateDocuments(self, documents:List[DocumentTuple]) -> Deferred:
        """ Create or Update Documents

        Add new documents to the document db

        :param documents: A
        :return: A deferred that fires when the creates or updates are complete

        """


    @abstractmethod
    def deleteDocuments(self, keys:List[str]) -> Deferred:
        """ Delete Documents

        Delete documents from the document db.

        :param keys: A list of keys for documents to delete
        :return: A deferred that fires when the delete is complete

        """
