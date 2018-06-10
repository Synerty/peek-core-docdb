from typing import Dict

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from vortex.Tuple import addTupleType, TupleField, Tuple


@addTupleType
class DocumentUpdateDateTuple(Tuple):
    """ DocDb Object Update Date Tuple

    This tuple represents the state of the chunks in the cache.
    Each chunkKey has a lastUpdateDate as a string, this is used for offline caching
    all the chunks.
    """
    __tupleType__ = docDbTuplePrefix + "DocumentUpdateDateTuple"

    initialLoadComplete: bool = TupleField()
    updateDateByChunkKey: Dict[str, str] = TupleField({})
