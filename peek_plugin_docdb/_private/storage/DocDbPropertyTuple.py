from sqlalchemy import Column, Index
from sqlalchemy import Integer, String

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from peek_plugin_docdb._private.storage.DeclarativeBase import DeclarativeBase
from vortex.Tuple import Tuple, addTupleType


@addTupleType
class DocDbPropertyTuple(Tuple, DeclarativeBase):
    __tupleType__ = docDbTuplePrefix + 'DocDbPropertyTuple'
    __tablename__ = 'DocDbProperty'

    id = Column(Integer, primary_key=True, autoincrement=True)
    modelSetKey = Column(String, nullable=False)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_DocDbProp_model_name", modelSetKey, name, unique=True),
        Index("idx_DocDbProp_model_title", modelSetKey, title, unique=True),
    )
