from typing import Dict

from peek_core_docdb._private.PluginNames import docDbTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class ImportDocumentTuple(Tuple):
    """Import Document Tuple

    This tuple is the publicly exposed Document

    """

    __tupleType__ = docDbTuplePrefix + "ImportDocumentTuple"

    #:  The unique key of this document
    key: str = TupleField()

    #:  The model set of this document
    modelSetKey: str = TupleField()

    #:  The document type
    documentTypeKey: str = TupleField()

    #:  The document data
    document: Dict = TupleField()

    #:  The hash of this import group
    importGroupHash: str = TupleField()

    def __repr__(self):
        s = ""
        s += f"key={self.key}\n"
        s += f"modelSetKey={self.modelSetKey}\n"
        s += f"documentTypeKey={self.documentTypeKey}\n"
        s += f"importGroupHash={self.importGroupHash}\n"
        for key, value in sorted(self.document.items(), key=lambda i: i[0]):
            s += f"prop.{key}={value}\n"
        return s
