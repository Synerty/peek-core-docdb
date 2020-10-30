"""Added showInHeader

Peek Plugin Database Migration Script

Revision ID: 6c94c040e18c
Revises: 931b88db3117
Create Date: 2019-07-30 13:55:15.386606

"""

# revision identifiers, used by Alembic.
revision = '6c94c040e18c'
down_revision = '931b88db3117'
branch_labels = None
depends_on = None

import sqlalchemy as sa
from alembic import op


def upgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column('DocDbProperty',
                  sa.Column('showInHeader', sa.Boolean(),
                            nullable=False, server_default='0'),
                  schema='core_docdb')

    op.execute(''' UPDATE "core_docdb"."DocDbProperty" SET "showInHeader" = false ''')

    op.alter_column('DocDbProperty', 'showInHeader',
                    type_=sa.Boolean(), nullable=False,
                    schema='core_docdb')

    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column('DocDbProperty', 'showInHeader', schema='core_docdb')
    # ### end Alembic commands ###
