"""Increased chunk size

Peek Plugin Database Migration Script

Revision ID: a423a783700f
Revises: c1d2d5475c64
Create Date: 2018-07-04 21:23:03.688758

"""

# revision identifiers, used by Alembic.
from sqlalchemy import MetaData
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from peek_plugin_docdb._private.worker.tasks._CalcChunkKey import makeChunkKey

revision = 'a423a783700f'
down_revision = 'c1d2d5475c64'
branch_labels = None
depends_on = None

from alembic import op

from sqlalchemy import Column
from sqlalchemy import Integer, String

__DeclarativeBase = declarative_base(metadata=MetaData(schema="pl_docdb"))


class __DocDbDocument(__DeclarativeBase):
    __tablename__ = 'DocDbDocument'

    id = Column(Integer, primary_key=True, autoincrement=True)
    modelSetId = Column(Integer)
    key = Column(String)
    chunkKey = Column(String)



def upgrade():
    bind = op.get_bind()
    session = sessionmaker()(bind=bind)



    for item in session.query(__DocDbDocument):
        item.chunkKey = makeChunkKey(item.modelSetId, item.key)

    session.commit()
    session.close()

    op.execute('TRUNCATE TABLE pl_docdb."DocDbEncodedChunkTuple" ')
    op.execute('TRUNCATE TABLE pl_docdb."DocDbChunkQueue" ')

    op.execute('''INSERT INTO pl_docdb."DocDbChunkQueue"
                            ("modelSetId", "chunkKey")
                            SELECT DISTINCT "modelSetId", "chunkKey"
                            FROM pl_docdb."DocDbDocument"
                         ''')


def downgrade():
    raise NotImplementedError("Downgrade not implemented")