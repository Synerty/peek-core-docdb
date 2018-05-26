import logging

from peek_plugin_base.storage.TypeDecorators import PeekLargeBinary
from peek_plugin_diagram._private.PluginNames import diagramTuplePrefix
from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql.schema import Index
from vortex.Tuple import Tuple, addTupleType

from peek_plugin_docdb._private.storage.DocDbModelSet import DocDbModelSet
from .DeclarativeBase import DeclarativeBase

logger = logging.getLogger(__name__)



@addTupleType
class DocDbChunkCompiled(Tuple, DeclarativeBase):
    __tablename__ = 'DocDbChunkCompiled'
    __tupleType__ = diagramTuplePrefix + __tablename__

    id = Column(Integer, primary_key=True, autoincrement=True)

    modelSetId = Column(Integer,
                        ForeignKey('DocDbModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(DocDbModelSet)

    chunkKey = Column(String, nullable=False)
    encodedData = Column(PeekLargeBinary, nullable=False)
    encodedHash = Column(String, nullable=False)
    lastUpdate = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_GKIndexUpdate_coordSetId", modelSetId, chunkKey, unique=False),
    )
