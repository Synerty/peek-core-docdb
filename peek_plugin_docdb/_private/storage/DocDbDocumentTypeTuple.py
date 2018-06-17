from sqlalchemy import Column, Index
from sqlalchemy import Integer, String

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from peek_plugin_docdb._private.storage.DeclarativeBase import DeclarativeBase
from vortex.Tuple import Tuple, addTupleType


@addTupleType
class DocDbDocumentTypeTuple(Tuple, DeclarativeBase):
    __tupleType__ = docDbTuplePrefix + 'DocDbDocumentTypeTuple'
    __tablename__ = 'DocDbDocumentType'

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    title = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_DocType_name", name, unique=True),
        Index("idx_DocType_title", title, unique=True),
    )
