import {Injectable} from "@angular/core";
import * as pako from "pako";

import {
    ComponentLifecycleEventEmitter,
    extend,
    Payload,
    PayloadEnvelope,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService,
    TupleSelector,
    TupleStorageFactoryService,
    VortexService,
    VortexStatusService
} from "@synerty/vortexjs";

import {
    docDbFilt,
    documentCacheStorageName,
    docDbTuplePrefix
} from "../PluginNames";


import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {EncodedDocumentChunkTuple} from "./EncodedDocumentChunkTuple";
import {DocumentUpdateDateTuple} from "./DocumentUpdateDateTuple";
import {DocDbResultObjectTuple} from "../../DocDbResultObjectTuple";
import {DocDbResultObjectRouteTuple} from "../../DocDbResultObjectRouteTuple";


// ----------------------------------------------------------------------------

let clientDocumentWatchUpdateFromDeviceFilt = extend(
    {'key': "clientDocumentWatchUpdateFromDevice"},
    docDbFilt
);

// ----------------------------------------------------------------------------
/** DocumentChunkTupleSelector
 *
 * This is just a short cut for the tuple selector
 */

class DocumentChunkTupleSelector extends TupleSelector {

    constructor(private chunkKey: number) {
        super(docDbTuplePrefix + "DocumentChunkTuple", {key: chunkKey});
    }

    toOrderedJsonStr(): string {
        return this.chunkKey.toString();
    }
}

// ----------------------------------------------------------------------------
/** UpdateDateTupleSelector
 *
 * This is just a short cut for the tuple selector
 */
class UpdateDateTupleSelector extends TupleSelector {
    constructor() {
        super(DocumentUpdateDateTuple.tupleName, {});
    }
}


// ----------------------------------------------------------------------------
/** hash method
 */
function objectIdChunk(objectId: number): number {
    /** Object ID Chunk

     This method creates an int from 0 to MAX, representing the hash bucket for this
     object Id.

     This is simple, and provides a reasonable distribution

     @param objectId: The ID if the object to get the chunk key for

     @return: The bucket / chunkKey where you'll find the object with this ID

     */
    if (objectId == null)
        throw new Error("keyword is None or zero length");

    // 1024 buckets
    return objectId & 1023;
}


// ----------------------------------------------------------------------------
/** Document Cache
 *
 * This class has the following responsibilities:
 *
 * 1) Maintain a local storage of the index
 *
 * 2) Return DispKey docDbs based on the index.
 *
 */
@Injectable()
export class PrivateDocumentLoaderService extends ComponentLifecycleEventEmitter {

    private index = new DocumentUpdateDateTuple();

    private _hasLoaded = false;

    private _hasLoadedSubject = new Subject<void>();
    private storage: TupleOfflineStorageService;

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService) {
        super();

        this.storage = new TupleOfflineStorageService(
            storageFactory,
            new TupleOfflineStorageNameService(documentCacheStorageName)
        );

        this.initialLoad();
    }

    isReady(): boolean {
        return this._hasLoaded;
    }

    isReadyObservable(): Observable<void> {
        return this._hasLoadedSubject;
    }

    /** Initial load
     *
     * Load the dates of the index buckets and ask the server if it has any updates.
     */
    private initialLoad(): void {

        this.storage.loadTuples(new UpdateDateTupleSelector())
            .then((tuples: DocumentUpdateDateTuple[]) => {
                if (tuples.length != 0) {
                    this.index = tuples[0];

                    if (this.index.initialLoadComplete) {
                        this._hasLoaded = true;
                        this._hasLoadedSubject.next();
                    }

                }

                this.setupVortexSubscriptions();
                this.askServerForUpdates();

            });

    }

    private setupVortexSubscriptions(): void {

        // Services don't have destructors, I'm not sure how to unsubscribe.
        this.vortexService.createEndpointObservable(this, clientDocumentWatchUpdateFromDeviceFilt)
            .takeUntil(this.onDestroyEvent)
            .subscribe((payloadEnvelope: PayloadEnvelope) => {
                this.processDocumentesFromServer(payloadEnvelope);
            });

        // If the vortex service comes back online, update the watch grids.
        this.vortexStatusService.isOnline
            .filter(isOnline => isOnline == true)
            .takeUntil(this.onDestroyEvent)
            .subscribe(() => this.askServerForUpdates());

    }


    //
    private askServerForUpdates() {
        // There is no point talking to the server if it's offline
        if (!this.vortexStatusService.snapshot.isOnline)
            return;

        let pl = new Payload(clientDocumentWatchUpdateFromDeviceFilt, [this.index]);
        this.vortexService.sendPayload(pl);
    }


    /** Process Documentes From Server
     *
     * Process the grids the server has sent us.
     */
    private processDocumentesFromServer(payloadEnvelope: PayloadEnvelope) {
        if (payloadEnvelope.result != null && payloadEnvelope.result != true) {
            console.log(`ERROR: ${payloadEnvelope.result}`);
            return;
        }

        if (payloadEnvelope.filt["finished"] == true) {
            this.index.initialLoadComplete = true;

            this.storage.saveTuples(new UpdateDateTupleSelector(), [this.index])
                .then(() => {
                    this._hasLoaded = true;
                    this._hasLoadedSubject.next();
                })
                .catch(err => console.log(`ERROR : ${err}`));

            return;
        }

        payloadEnvelope
            .decodePayload()
            .then((payload: Payload) => this.storeDocumentPayload(payload))
            .catch(e =>
                `DocumentCache.processDocumentesFromServer failed: ${e}`
            );

    }

    private storeDocumentPayload(payload: Payload) {

        let encodedDocumentChunkTuples: EncodedDocumentChunkTuple[] = <EncodedDocumentChunkTuple[]>payload.tuples;

        let tuplesToSave: EncodedDocumentChunkTuple[] = [];

        for (let item of encodedDocumentChunkTuples) {
            tuplesToSave.push(item);
        }


        // 2) Store the index
        this.storeDocumentChunkTuples(tuplesToSave)
            .then(() => {
                // 3) Store the update date

                for (let docDbIndex of tuplesToSave) {
                    this.index.updateDateByChunkKey[docDbIndex.chunkKey] = docDbIndex.lastUpdate;
                }

                return this.storage.saveTuples(
                    new UpdateDateTupleSelector(), [this.index]
                );

            })
            .catch(e => console.log(
                `DocumentCache.storeDocumentPayload: ${e}`));

    }

    /** Store Index Bucket
     * Stores the index bucket in the local db.
     */
    private storeDocumentChunkTuples(encodedDocumentChunkTuples: EncodedDocumentChunkTuple[]): Promise<void> {
        let retPromise: any;
        retPromise = this.storage.transaction(true)
            .then((tx) => {

                let promises = [];

                for (let encodedDocumentChunkTuple of encodedDocumentChunkTuples) {
                    promises.push(
                        tx.saveTuplesEncoded(
                            new DocumentChunkTupleSelector(encodedDocumentChunkTuple.chunkKey),
                            encodedDocumentChunkTuple.encodedData
                        )
                    );
                }

                return Promise.all(promises)
                    .then(() => tx.close());
            });
        return retPromise;
    }


    /** Get Objects
     *
     * Get the objects with matching keywords from the index..
     *
     */
    getObjects(objectTypeId: number | null, objectIds: number[]): Promise<DocDbResultObjectTuple[]> {
        if (objectIds == null || objectIds.length == 0) {
            throw new Error("We've been passed a null/empty keywords");
        }

        if (this.isReady())
            return this.getObjectsWhenReady(objectTypeId, objectIds);

        return this.isReadyObservable()
            .toPromise()
            .then(() => this.getObjectsWhenReady(objectTypeId, objectIds));
    }


    /** Get Objects When Ready
     *
     * Get the objects with matching keywords from the index..
     *
     */
    private getObjectsWhenReady(objectTypeId: number | null, objectIds: number[]): Promise<DocDbResultObjectTuple[]> {

        let objectIdsByChunkKey: { [key: number]: number[]; } = {};
        let chunkKeys: number[] = [];

        for (let objectId of objectIds) {
            let chunkKey: number = objectIdChunk(objectId);
            if (objectIdsByChunkKey[chunkKey] == null)
                objectIdsByChunkKey[chunkKey] = [];
            objectIdsByChunkKey[chunkKey].push(objectId);
            chunkKeys.push(chunkKey);
        }


        let promises = [];
        for (let chunkKey of chunkKeys) {
            let objectIds = objectIdsByChunkKey[chunkKey];
            promises.push(
                this.getObjectsForObjectIds(objectTypeId, objectIds, chunkKey)
            );
        }

        return Promise.all(promises)
            .then((results: DocDbResultObjectTuple[][]) => {
                let objects: DocDbResultObjectTuple[] = [];
                for (let result of  results) {
                    objects.add(result);
                }
                return objects;
            });
    }


    /** Get Objects for Object ID
     *
     * Get the objects with matching keywords from the index..
     *
     */
    private getObjectsForObjectIds(objectTypeId: number | null,
                                   objectIds: number[],
                                   chunkKey: number): Promise<DocDbResultObjectTuple[]> {

        if (!this.index.updateDateByChunkKey.hasOwnProperty(chunkKey)) {
            console.log(`ObjectIDs: ${objectIds} doesn't appear in the index`);
            return Promise.resolve([]);
        }

        let retPromise: any;
        retPromise = this.storage.loadTuplesEncoded(new DocumentChunkTupleSelector(chunkKey))
            .then((vortexMsg: string) => {
                if (vortexMsg == null) {
                    return [];
                }


                return Payload.fromEncodedPayload(vortexMsg)
                    .then((payload: Payload) => JSON.parse(<any>payload.tuples))
                    .then((chunkData: { [key: number]: string; }) => {

                        let foundObjects: DocDbResultObjectTuple[] = [];

                        for (let objectId of objectIds) {
                            // Find the keyword, we're just iterating
                            if (!chunkData.hasOwnProperty(objectId)) {
                                console.log(
                                    `WARNING: ObjectID ${objectId} is missing from index,`
                                    + ` chunkKey ${chunkKey}`
                                );
                                continue;
                            }

                            // Reconstruct the data
                            let objectProps: {} = JSON.parse(chunkData[objectId]);

                            // Get out the object type
                            let thisObjectTypeId = objectProps['_otid_'];
                            delete objectProps['_otid_'];

                            // If the property is set, then make sure it matches
                            if (objectTypeId != null && objectTypeId != thisObjectTypeId)
                                continue;

                            // Get out the routes
                            let routes: string[][] = objectProps['_r_'];
                            delete objectProps['_r_'];

                            // Get out the key
                            let objectKey: string = objectProps['key'];
                            delete objectProps['key'];

                            // Create the new object
                            let newObject = new DocDbResultObjectTuple();
                            foundObjects.push(newObject);

                            newObject.id = objectId;
                            newObject.key = objectKey;
                            newObject.objectTypeId = thisObjectTypeId;
                            newObject.properties = objectProps;

                            for (let route of routes) {
                                let newRoute = new DocDbResultObjectRouteTuple();
                                newObject.routes.push(newRoute);

                                newRoute.path = route[0];
                                newRoute.title = route[1];
                            }
                        }

                        return foundObjects;

                    });
            });

        return retPromise;

    }


}