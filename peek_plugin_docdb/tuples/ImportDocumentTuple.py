from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from peek_plugin_docdb.tuples.DocumentTuple import DocumentTuple
from vortex.Tuple import addTupleType, TupleField


@addTupleType
class ImportDocumentTuple(DocumentTuple):
    """ Document Tuple

    This tuple is the publicly exposed Document

    """
    __tupleType__ = docDbTuplePrefix + 'ImportDocumentTuple'

    #:  The hash of this import group
    importGroupHash: str = TupleField()
