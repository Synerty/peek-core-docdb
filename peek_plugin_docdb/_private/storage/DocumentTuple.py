from sqlalchemy import Column
from sqlalchemy import Integer, String
from vortex.Tuple import Tuple, addTupleType

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from peek_plugin_docdb._private.storage.DeclarativeBase import DeclarativeBase


@addTupleType
class DocumentTuple(Tuple, DeclarativeBase):
    __tupleType__ = docDbTuplePrefix + 'DocumentTuple'
    __tablename__ = 'DocumentTuple'

    id = Column(Integer, primary_key=True, autoincrement=True)
    string1 = Column(String(50))
    int1 = Column(Integer)