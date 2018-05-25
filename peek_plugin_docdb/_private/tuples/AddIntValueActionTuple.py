from vortex.Tuple import addTupleType, TupleField
from vortex.TupleAction import TupleActionABC

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix


@addTupleType
class AddIntValueActionTuple(TupleActionABC):
    __tupleType__ = docDbTuplePrefix + "AddIntValueActionTuple"

    documentId = TupleField()
    offset = TupleField()
