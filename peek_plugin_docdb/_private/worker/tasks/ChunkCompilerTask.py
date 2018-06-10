import hashlib
import json
import logging
from base64 import b64encode
from collections import defaultdict
from datetime import datetime
from typing import List, Dict

import pytz
from sqlalchemy import select
from txcelery.defer import DeferrableTask

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_docdb._private.storage.EncodedDocumentChunk import \
    EncodedDocumentChunk
from peek_plugin_docdb._private.storage.Document import Document
from peek_plugin_docdb._private.storage.DocumentCompilerQueue import \
    DocumentCompilerQueue
from peek_plugin_docdb._private.worker.CeleryApp import celeryApp
from vortex.Payload import Payload

logger = logging.getLogger(__name__)

""" DocDb Index Compiler

Compile the docDb indexes

1) Query for queue
2) Process queue
3) Delete from queue
"""


@DeferrableTask
@celeryApp.task(bind=True)
def compileDocumentChunk(self, queueItems) -> List[str]:
    """ Compile DocDb Index Task

    :param self: A celery reference to this task
    :param queueItems: An encoded payload containing the queue tuples.
    :returns: A list of grid keys that have been updated.
    """
    chunkKeys = list(set([i.chunkKey for i in queueItems]))

    queueTable = DocumentCompilerQueue.__table__
    compiledTable = EncodedDocumentChunk.__table__
    lastUpdate = datetime.now(pytz.utc).isoformat()

    startTime = datetime.now(pytz.utc)

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()
    try:

        logger.debug("Staring compile of %s queueItems in %s",
                     len(queueItems), (datetime.now(pytz.utc) - startTime))

        # Get Model Sets

        total = 0
        existingHashes = _loadExistingHashes(conn, chunkKeys)
        encKwPayloadByChunkKey = _buildIndex(chunkKeys)
        chunksToDelete = []

        inserts = []
        for chunkKey, docDbIndexChunkEncodedPayload in encKwPayloadByChunkKey.items():
            m = hashlib.sha256()
            m.update(docDbIndexChunkEncodedPayload)
            encodedHash = b64encode(m.digest()).decode()

            # Compare the hash, AND delete the chunk key
            if chunkKey in existingHashes:
                # At this point we could decide to do an update instead,
                # but inserts are quicker
                if encodedHash == existingHashes.pop(chunkKey):
                    continue

            chunksToDelete.append(chunkKey)
            inserts.append(dict(
                chunkKey=chunkKey,
                encodedData=docDbIndexChunkEncodedPayload,
                encodedHash=encodedHash,
                lastUpdate=lastUpdate))

        # Add any chnuks that we need to delete that we don't have new data for, here
        chunksToDelete.extend(list(existingHashes))

        if chunksToDelete:
            # Delete the old chunks
            conn.execute(
                compiledTable.delete(compiledTable.c.chunkKey.in_(chunksToDelete))
            )

        if inserts:
            newIdGen = CeleryDbConn.prefetchDeclarativeIds(Document, len(inserts))
            for insert in inserts:
                insert["id"] = next(newIdGen)

        transaction.commit()
        transaction = conn.begin()

        if inserts:
            conn.execute(compiledTable.insert(), inserts)

        logger.debug("Compiled %s Documents, %s missing, in %s",
                     len(inserts),
                     len(chunkKeys) - len(inserts), (datetime.now(pytz.utc) - startTime))

        total += len(inserts)

        queueItemIds = [o.id for o in queueItems]
        conn.execute(queueTable.delete(queueTable.c.id.in_(queueItemIds)))

        transaction.commit()
        logger.debug("Compiled and Committed %s EncodedDocumentChunks in %s",
                     total, (datetime.now(pytz.utc) - startTime))

        return chunkKeys

    except Exception as e:
        transaction.rollback()
        # logger.warning(e)  # Just a warning, it will retry
        logger.exception(e)
        raise self.retry(exc=e, countdown=10)

    finally:
        conn.close()


def _loadExistingHashes(conn, chunkKeys: List[str]) -> Dict[str, str]:
    compiledTable = EncodedDocumentChunk.__table__

    results = conn.execute(select(
        columns=[compiledTable.c.chunkKey, compiledTable.c.encodedHash],
        whereclause=compiledTable.c.chunkKey.in_(chunkKeys)
    )).fetchall()

    return {result[0]: result[1] for result in results}


def _buildIndex(chunkKeys) -> Dict[str, bytes]:
    session = CeleryDbConn.getDbSession()

    try:
        indexQry = (
            session.query(Document.chunkKey, Document.id, Document.packedJson)
                .filter(Document.chunkKey.in_(chunkKeys))
                .order_by(Document.id)
                .yield_per(1000)
                .all()
        )

        # Create the ChunkKey -> {id -> packedJson, id -> packedJson, ....]
        packagedJsonByObjIdByChunkKey = defaultdict(dict)

        for item in indexQry:
            packagedJsonByObjIdByChunkKey[item.chunkKey][item.id] = item.packedJson

        encPayloadByChunkKey = {}

        # Sort each bucket by the key
        for chunkKey, packedJsonById in packagedJsonByObjIdByChunkKey.items():
            tuples = json.dumps(packedJsonById, sort_keys=True)

            # Create the blob data for this index.
            # It will be docDbed by a binary sort
            encPayloadByChunkKey[chunkKey] = Payload(tuples=tuples).toEncodedPayload()

        return encPayloadByChunkKey

    finally:
        session.close()
