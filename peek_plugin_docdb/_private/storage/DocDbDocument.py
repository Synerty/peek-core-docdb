from sqlalchemy import Column, Index, ForeignKey
from sqlalchemy import Integer, String
from sqlalchemy.orm import relationship
from vortex.Tuple import Tuple, addTupleType

from peek_plugin_docdb._private.PluginNames import docDbTuplePrefix
from peek_plugin_docdb._private.storage.DeclarativeBase import DeclarativeBase
from peek_plugin_docdb._private.storage.DocDbModelSet import DocDbModelSet


@addTupleType
class DocDbDocument(Tuple, DeclarativeBase):
    __tupleType__ = docDbTuplePrefix + 'DocDbDocumentTable'
    __tablename__ = 'DocDbDocument'

    #:  The unique ID of this document (database generated)
    id = Column(Integer, primary_key=True, autoincrement=True)

    #:  The model set for this document
    modelSetId = Column(Integer,
                        ForeignKey('DocDbModelSet.id', ondelete='CASCADE'),
                        nullable=False)
    modelSet = relationship(DocDbModelSet)

    #:  The unique key of this document
    key = Column(String, nullable=False)

    #:  The chunk that this document fits into
    chunkKey = Column(String, nullable=False)

    #:  The document data
    document = Column(String, nullable=False)

    __table_args__ = (
        Index("idx_Document_key", modelSetId, key, unique=True),
        Index("idx_Document_gridKey", chunkKey, unique=False),
    )
