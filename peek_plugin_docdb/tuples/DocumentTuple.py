from typing import Dict

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class DocumentTuple(Tuple):
    """ Document Tuple

    This tuple is the publicly exposed Document

    """
    __tupleType__ = docDbTuplePrefix + 'DocumentTuple'

    #:  The unique key of this document
    key: str = TupleField()

    #:  The unique key of this document
    modelSetKey: str = TupleField()

    #:  The document data
    document: Dict = TupleField()
