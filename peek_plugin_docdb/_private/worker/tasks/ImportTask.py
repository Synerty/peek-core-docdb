import json
import logging
import zlib
from collections import defaultdict
from datetime import datetime
from typing import List, Dict, Tuple, Set

import pytz
from sqlalchemy import select, bindparam
from txcelery.defer import DeferrableTask

from peek_plugin_base.worker import CeleryDbConn
from peek_plugin_docdb._private.storage.Document import Document
from peek_plugin_docdb._private.storage.DocumentCompilerQueue import \
    DocumentCompilerQueue
from peek_plugin_docdb._private.storage.DocumentRoute import DocumentRoute
from peek_plugin_docdb._private.storage.DocumentTypeTuple import \
    DocumentTypeTuple
from peek_plugin_docdb._private.storage.DocDbPropertyTuple import DocDbPropertyTuple
from peek_plugin_docdb._private.worker.CeleryApp import celeryApp
from peek_plugin_docdb._private.worker.tasks.ImportDocDbIndexTask import \
    ObjectToIndexTuple, reindexDocument
from peek_plugin_docdb._private.worker.tasks._CalcChunkKey import makeChunkKeyFromInt
from peek_plugin_docdb.tuples.ImportDocumentTuple import ImportDocumentTuple
from vortex.Payload import Payload

logger = logging.getLogger(__name__)


# We need to insert the into the following tables:
# Document - or update it's details if required
# DocDbIndex - The index of the keywords for the object
# DocumentRoute - delete old importGroupHash
# DocumentRoute - insert the new routes


@DeferrableTask
@celeryApp.task(bind=True)
def removeDocumentTask(self, importGroupHashes: List[str]) -> None:
    pass


@DeferrableTask
@celeryApp.task(bind=True)
def importDocumentTask(self, documentsEncodedPayload: bytes) -> None:
    # Decode arguments
    newDocuments: List[ImportDocumentTuple] = (
        Payload().fromEncodedPayload(documentsEncodedPayload).tuples
    )

    # Cleanup some of the input data
    for o in newDocuments:
        if not o.objectType:
            o.objectType = 'none'

        o.objectType = o.objectType.lower()

        if o.properties:
            o.properties = {k.lower(): v for k, v in o.properties.items()}

    try:
        objectTypeIdsByName = _prepareLookups(newDocuments)

        objectsToIndex, objectIdByKey, chunkKeysForQueue = _insertOrUpdateObjects(
            newDocuments, objectTypeIdsByName
        )

        _insertObjectRoutes(newDocuments, objectIdByKey)

        _packObjectJson(newDocuments, chunkKeysForQueue)

        reindexDocument(objectsToIndex)

    except Exception as e:
        logger.debug("Retrying import docDb objects, %s", e)
        raise self.retry(exc=e, countdown=3)


def _prepareLookups(newDocuments: List[ImportDocumentTuple]) -> Dict[str, int]:
    """ Check Or Insert DocDb Properties

    Make sure the docDb properties exist.

    """

    dbSession = CeleryDbConn.getDbSession()

    startTime = datetime.now(pytz.utc)

    try:

        objectTypeNames = {'none'}
        propertyNames = {'key'}

        for o in newDocuments:
            objectTypeNames.add(o.objectType)

            if o.properties:
                propertyNames.update(o.properties)

        # Prepare Properties
        dbProps = dbSession.query(DocDbPropertyTuple).all()
        propertyNames -= set([o.name for o in dbProps])

        if propertyNames:
            for newPropName in propertyNames:
                dbSession.add(DocDbPropertyTuple(name=newPropName, title=newPropName))

            dbSession.commit()

        del dbProps
        del propertyNames

        # Prepare Object Types
        dbObjectTypes = dbSession.query(DocumentTypeTuple).all()
        objectTypeNames -= set([o.name for o in dbObjectTypes])

        if not objectTypeNames:
            objectTypeIdsByName = {o.name: o.id for o in dbObjectTypes}

        else:
            for newPropName in objectTypeNames:
                dbSession.add(DocumentTypeTuple(name=newPropName, title=newPropName))

            dbSession.commit()

            dbObjectTypes = dbSession.query(DocumentTypeTuple).all()
            objectTypeIdsByName = {o.name: o.id for o in dbObjectTypes}

        logger.debug("Prepared lookups in %s", (datetime.now(pytz.utc) - startTime))

        return objectTypeIdsByName

    except Exception as e:
        dbSession.rollback()
        raise

    finally:
        dbSession.close()


def _insertOrUpdateObjects(newDocuments: List[ImportDocumentTuple],
                           objectTypeIdsByName: Dict[str, int]) -> Tuple[
    List[ObjectToIndexTuple], Dict[str, int], Set[int]]:
    """ Insert or Update Objects

    1) Find objects and update them
    2) Insert object if the are missing

    """

    documentTable = Document.__table__

    startTime = datetime.now(pytz.utc)

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        objectsToIndex: Dict[int, List[ObjectToIndexTuple]] = {}
        objectIdByKey: Dict[str, int] = {}

        objectKeys = [o.key for o in newDocuments]
        chunkKeysForQueue: Set[int] = set()

        # Query existing objects
        results = list(conn.execute(select(
            columns=[documentTable.c.id, documentTable.c.key,
                     documentTable.c.chunkKey, documentTable.c.propertiesJson],
            whereclause=documentTable.c.key.in_(objectKeys)
        )))

        foundObjectByKey = {o.key: o for o in results}
        del results

        # Get the IDs that we need
        newIdGen = CeleryDbConn.prefetchDeclarativeIds(
            Document, len(newDocuments) - len(foundObjectByKey)
        )

        # Create state arrays
        inserts = []
        propUpdates = []
        objectTypeUpdates = []

        # Work out which objects have been updated or need inserting
        for importObject in newDocuments:

            existingObject = foundObjectByKey.get(importObject.key)
            importObjectTypeId = objectTypeIdsByName[importObject.objectType]

            propsWithKey = dict(key=importObject.key)

            if importObject.properties:
                if existingObject and existingObject.propertiesJson:
                    propsWithKey.update(json.loads(existingObject.propertiesJson))

                # Add the data we're importing second
                propsWithKey.update(importObject.properties)

                propsStr = json.dumps(propsWithKey, sort_keys=True)

            else:
                propsStr = None

            # Work out if we need to update the object type
            if importObject.objectType != 'None' and existingObject:
                objectTypeUpdates.append(
                    dict(b_id=existingObject.id, b_typeId=importObjectTypeId)
                )

            # Work out if we need to update the existing object or create one
            if existingObject:
                docDbIndexUpdateNeeded = propsStr and existingObject.propertiesJson != propsStr
                if docDbIndexUpdateNeeded:
                    propUpdates.append(dict(b_id=existingObject.id, b_propsStr=propsStr))

            else:
                docDbIndexUpdateNeeded = True
                id_ = next(newIdGen)
                existingObject = Document(
                    id=id_,
                    key=importObject.key,
                    objectTypeId=importObjectTypeId,
                    propertiesJson=propsStr,
                    chunkKey=makeChunkKeyFromInt(id_)
                )
                inserts.append(existingObject.tupleToSqlaBulkInsertDict())

            if docDbIndexUpdateNeeded:
                objectsToIndex[existingObject.id] = ObjectToIndexTuple(
                    id=existingObject.id,
                    key=existingObject.key,
                    props=propsWithKey
                )

            objectIdByKey[existingObject.key] = existingObject.id
            chunkKeysForQueue.add(existingObject.chunkKey)

        # Insert the DocDb Objects
        if inserts:
            conn.execute(documentTable.insert(), inserts)

        if propUpdates:
            stmt = (
                documentTable.update()
                    .where(documentTable.c.id == bindparam('b_id'))
                    .values(propertiesJson=bindparam('b_propsStr'))
            )
            conn.execute(stmt, propUpdates)

        if objectTypeUpdates:
            stmt = (
                documentTable.update()
                    .where(documentTable.c.id == bindparam('b_id'))
                    .values(objectTypeId=bindparam('b_typeId'))
            )
            conn.execute(stmt, objectTypeUpdates)

        if inserts or propUpdates or objectTypeUpdates:
            transaction.commit()
        else:
            transaction.rollback()

        logger.debug("Inserted %s updated %s ObjectToIndexTuple in %s",
                     len(inserts), len(propUpdates),
                     (datetime.now(pytz.utc) - startTime))

        return list(objectsToIndex.values()), objectIdByKey, chunkKeysForQueue

    except Exception as e:
        transaction.rollback()
        raise


    finally:
        conn.close()


def _insertObjectRoutes(newDocuments: List[ImportDocumentTuple],
                        objectIdByKey: Dict[str, int]):
    """ Insert Object Routes

    1) Drop all routes with matching importGroupHash

    2) Insert the new routes

    :param newDocuments:
    :param objectIdByKey:
    :return:
    """

    documentRoute = DocumentRoute.__table__

    startTime = datetime.now(pytz.utc)

    engine = CeleryDbConn.getDbEngine()
    conn = engine.connect()
    transaction = conn.begin()

    try:
        importHashSet = set()
        inserts = []

        for importObject in newDocuments:
            for importRoute in importObject.routes:
                importHashSet.add(importRoute.importGroupHash)
                inserts.append(dict(
                    objectId=objectIdByKey[importObject.key],
                    importGroupHash=importRoute.importGroupHash,
                    routeTitle=importRoute.routeTitle,
                    routePath=importRoute.routePath
                ))

        if importHashSet:
            conn.execute(
                documentRoute
                    .delete()
                    .where(documentRoute.c.importGroupHash.in_(list(importHashSet)))
            )

        # Insert the DocDb Object routes
        if inserts:
            conn.execute(documentRoute.insert(), inserts)

        if importHashSet or inserts:
            transaction.commit()
        else:
            transaction.rollback()

        logger.debug("Inserted %s DocumentRoute in %s",
                     len(inserts),
                     (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        transaction.rollback()
        raise


    finally:
        conn.close()


def _packObjectJson(newDocuments: List[ImportDocumentTuple],
                    chunkKeysForQueue: Set[int]):
    """ Pack Object Json

    1) Create JSON and update object.

    Doing this takes longer to bulk load, but quicker to make incremental changes

    :param newDocuments:
    :param chunkKeysForQueue:
    :return:
    """

    documentTable = Document.__table__
    objectQueueTable = DocumentCompilerQueue.__table__
    dbSession = CeleryDbConn.getDbSession()

    startTime = datetime.now(pytz.utc)

    try:

        indexQry = (
            dbSession.query(Document.id, Document.propertiesJson,
                            Document.objectTypeId,
                            DocumentRoute.routeTitle, DocumentRoute.routePath)
                .join(DocumentRoute, Document.id == DocumentRoute.objectId)
                .filter(Document.chunkKey.in_(chunkKeysForQueue))
                .filter(Document.propertiesJson != None)
                .filter(DocumentRoute.routePath != None)
                .order_by(Document.id, DocumentRoute.routeTitle)
                .yield_per(1000)
                .all()
        )

        # I chose a simple name for this one.
        qryDict = defaultdict(list)

        for item in indexQry:
            (
                qryDict[(item.id, item.propertiesJson, item.objectTypeId)]
                    .append([item.routeTitle, item.routePath])
            )

        packedJsonUpdates = []

        # Sort each bucket by the key
        for (id_, propertiesJson, objectTypeId), routes in qryDict.items():
            props = json.loads(propertiesJson)
            props['_r_'] = routes
            props['_otid_'] = objectTypeId
            packedJson = json.dumps(props, sort_keys=True)
            packedJsonUpdates.append(dict(b_id=id_, b_packedJson=packedJson))

        if packedJsonUpdates:
            stmt = (
                documentTable.update()
                    .where(documentTable.c.id == bindparam('b_id'))
                    .values(packedJson=bindparam('b_packedJson'))
            )
            dbSession.execute(stmt, packedJsonUpdates)

        if chunkKeysForQueue:
            dbSession.execute(
                objectQueueTable.insert(),
                [dict(chunkKey=v) for v in chunkKeysForQueue]
            )

        if packedJsonUpdates or chunkKeysForQueue:
            dbSession.commit()
        else:
            dbSession.rollback()

        logger.debug("Packed JSON for %s Documents",
                     len(newDocuments),
                     (datetime.now(pytz.utc) - startTime))

    except Exception as e:
        dbSession.rollback()
        raise


    finally:
        dbSession.close()
