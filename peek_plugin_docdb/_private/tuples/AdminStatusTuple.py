from peek_plugin_search._private.PluginNames import searchTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class AdminStatusTuple(Tuple):
    __tupleType__ = searchTuplePrefix + "AdminStatusTuple"

    documentCompilerQueueStatus: bool = TupleField(False)
    documentCompilerQueueSize: int = TupleField(0)
    documentCompilerQueueProcessedTotal: int = TupleField(0)
    documentCompilerQueueLastError: str = TupleField()
