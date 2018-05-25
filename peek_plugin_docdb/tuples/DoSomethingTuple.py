from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from vortex.Tuple import Tuple, addTupleType, TupleField


@addTupleType
class DoSomethingTuple(Tuple):
    """ Do Something Tuple

    This tuple is publicly exposed and will be the result of the doSomething api call.
    """
    __tupleType__ = docDbTuplePrefix + 'DoSomethingTuple'

    #:  The result of the doSomething
    result = TupleField(defaultValue=dict)
