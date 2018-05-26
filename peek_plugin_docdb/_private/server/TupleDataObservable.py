from vortex.handler.TupleDataObservableHandler import TupleDataObservableHandler

from peek_plugin_docdb._private.PluginNames import docDbFilt
from peek_plugin_docdb._private.PluginNames import docDbObservableName

from .tuple_providers.DocumentTupleProvider import DocumentTupleProvider
from peek_plugin_docdb._private.storage.DocDbDocument import DocDbDocument


def makeTupleDataObservableHandler(ormSessionCreator):
    """" Make Tuple Data Observable Handler

    This method creates the observable object, registers the tuple providers and then
    returns it.

    :param ormSessionCreator: A function that returns a SQLAlchemy session when called

    :return: An instance of :code:`TupleDataObservableHandler`

    """
    tupleObservable = TupleDataObservableHandler(
                observableName=docDbObservableName,
                additionalFilt=docDbFilt)

    # Register TupleProviders here
    tupleObservable.addTupleProvider(DocDbDocument.tupleName(),
                                     DocumentTupleProvider(ormSessionCreator))
    return tupleObservable
