import {Injectable} from "@angular/core";

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

import {docDbCacheStorageName, docDbFilt, docDbTuplePrefix} from "../PluginNames";


import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {EncodedDocumentChunkTuple} from "./EncodedDocumentChunkTuple";
import {DocumentUpdateDateTuple} from "./DocumentUpdateDateTuple";
import {DocumentTuple} from "../../DocumentTuple";
import {DocDbTupleService} from "../DocDbTupleService";
import {DocumentTypeTuple} from "../../DocumentTypeTuple";


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

    constructor(private chunkKey: string) {
        super(docDbTuplePrefix + "DocumentChunkTuple", {key: chunkKey});
    }

    toOrderedJsonStr(): string {
        return this.chunkKey;
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
function keyChunk(modelSetKey: string, key: string): string {
    /** Object ID Chunk

     This method creates an int from 0 to MAX, representing the hash bucket for this
     object Id.

     This is simple, and provides a reasonable distribution

     @param modelSetKey: The key of the model set that the documents are in
     @param key: The key of the document to get the chunk key for

     @return: The bucket / chunkKey where you'll find the object with this ID

     */
    if (key == null || key.length == 0)
        throw new Error("key is None or zero length");

    let bucket = 0;

    for (let i = 0; i < key.length; i++) {
        bucket = ((bucket << 5) - bucket) + key.charCodeAt(i);
        bucket |= 0; // Convert to 32bit integer
    }

    bucket = bucket & 1023; // 1024 buckets

    return `${modelSetKey}.${bucket}`;
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

    private _hasServerLoaded = false;
    private _hasDocTypeLoaded = false;

    private _hasLoadedSubject = new Subject<void>();
    private storage: TupleOfflineStorageService;

    private objectTypesByIds: { [id: number]: DocumentTypeTuple } = {};

    constructor(private vortexService: VortexService,
                private vortexStatusService: VortexStatusService,
                storageFactory: TupleStorageFactoryService,
                private tupleService: DocDbTupleService) {
        super();

        let ts = new TupleSelector(DocumentTypeTuple.tupleName, {});
        this.tupleService.offlineObserver
            .subscribeToTupleSelector(ts)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: DocumentTypeTuple[]) => {
                this.objectTypesByIds = {};
                for (let item of tuples) {
                    this.objectTypesByIds[item.id] = item;
                }
                this._hasDocTypeLoaded = true;
                this._notifyReady();
            });

        this.storage = new TupleOfflineStorageService(
            storageFactory,
            new TupleOfflineStorageNameService(docDbCacheStorageName)
        );


        this.initialLoad();
    }

    isReady(): boolean {
        return this._hasServerLoaded;
    }

    isReadyObservable(): Observable<void> {
        return this._hasLoadedSubject;
    }

    private _notifyReady(): void {
        if (this._hasDocTypeLoaded && this._hasServerLoaded)
            this._hasLoadedSubject.next();
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
                        this._hasServerLoaded = true;
                        this._notifyReady();
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


    /** Ask Server For Updates
     *
     * Tell the server the state of the chunks in our index and ask if there
     * are updates.
     *
     */
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
                    this._hasServerLoaded = true;
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


    /** Get Documents
     *
     * Get the objects with matching keywords from the index..
     *
     */
    getDocuments(modelSetKey: string, keys: string[]): Promise<{ [key: string]: DocumentTuple }> {
        if (keys == null || keys.length == 0) {
            throw new Error("We've been passed a null/empty keys");
        }

        if (this.isReady())
            return this.getDocumentsWhenReady(modelSetKey, keys);

        return this.isReadyObservable()
            .toPromise()
            .then(() => this.getDocumentsWhenReady(modelSetKey, keys));
    }


    /** Get Documents When Ready
     *
     * Get the objects with matching keywords from the index..
     *
     */
    private getDocumentsWhenReady(
        modelSetKey: string, keys: string[]): Promise<{ [key: string]: DocumentTuple }> {

        let keysByChunkKey: { [key: string]: string[]; } = {};
        let chunkKeys: string[] = [];

        for (let key of keys) {
            let chunkKey: string = keyChunk(modelSetKey, key);
            if (keysByChunkKey[chunkKey] == null)
                keysByChunkKey[chunkKey] = [];
            keysByChunkKey[chunkKey].push(key);
            chunkKeys.push(chunkKey);
        }


        let promises = [];
        for (let chunkKey of chunkKeys) {
            let keysForThisChunk = keysByChunkKey[chunkKey];
            promises.push(
                this.getDocumentsForKeys(keysForThisChunk, chunkKey)
            );
        }

        return Promise.all(promises)
            .then((results: DocumentTuple[]) => {
                let objects: { [key: string]: DocumentTuple } = {};
                for (let result of  results) {
                    objects[result.key] = result;
                }
                return objects;
            });
    }


    /** Get Documents for Object ID
     *
     * Get the objects with matching keywords from the index..
     *
     */
    private getDocumentsForKeys(keys: string[],
                                chunkKey: string): Promise<DocumentTuple[]> {

        if (!this.index.updateDateByChunkKey.hasOwnProperty(chunkKey)) {
            console.log(`ObjectIDs: ${keys} doesn't appear in the index`);
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

                        let foundDocuments: DocumentTuple[] = [];

                        for (let key of keys) {
                            // Find the keyword, we're just iterating
                            if (!chunkData.hasOwnProperty(key)) {
                                console.log(
                                    `WARNING: Document ${key} is missing from index,`
                                    + ` chunkKey ${chunkKey}`
                                );
                                continue;
                            }

                            // Reconstruct the data
                            let objectProps: {} = JSON.parse(chunkData[key]);

                            // Get out the object type
                            let thisDocumentTypeId = objectProps['_dtid'];
                            delete objectProps['_dtid'];

                            // Create the new object
                            let newObject = new DocumentTuple();
                            foundDocuments.push(newObject);

                            newObject.key = key;
                            newObject.documentType =
                                this.objectTypesByIds[thisDocumentTypeId];
                            newObject.document = objectProps;

                        }

                        return foundDocuments;

                    });
            });

        return retPromise;

    }


}