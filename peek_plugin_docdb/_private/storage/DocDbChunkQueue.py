import logging

from sqlalchemy import Column
from sqlalchemy import ForeignKey
from sqlalchemy import Integer, String

from .DeclarativeBase import DeclarativeBase

logger = logging.getLogger(__name__)


class DocDbChunkQueue(DeclarativeBase):
    __tablename__ = 'DocDbChunkQueue'

    id = Column(Integer, primary_key=True, autoincrement=True)

    modelSetId = Column(Integer,
                        ForeignKey('DocDbModelSet.id', ondelete='CASCADE'),
                        nullable=False)

    chunkKey = Column(String, primary_key=True)
