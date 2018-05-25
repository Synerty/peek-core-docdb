from vortex.Tuple import Tuple, addTupleType, TupleField

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix


@addTupleType
class DocDbTuple(Tuple):
    """ DocDb Tuple

    This tuple is a create example of defining classes to work with our data.
    """
    __tupleType__ = docDbTuplePrefix + 'DocDbTuple'

    #:  Description of date1
    dict1 = TupleField(defaultValue=dict)

    #:  Description of date1
    array1 = TupleField(defaultValue=list)

    #:  Description of date1
    date1 = TupleField()
