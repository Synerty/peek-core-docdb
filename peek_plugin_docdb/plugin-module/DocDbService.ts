import {Injectable} from "@angular/core";

import {
    ComponentLifecycleEventEmitter,
    Payload,
    TupleActionPushService,
    TupleDataObserverService,
    TupleDataOfflineObserverService,
    TupleSelector,
    VortexStatusService
} from "@synerty/vortexjs";

import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {DocumentResultI, PrivateDocumentLoaderService} from "./_private/document-loader";
import {DocumentTuple} from "./DocumentTuple";
import {DocDbTupleService} from "./_private";
import {DocDbPropertyTuple} from "./DocDbPropertyTuple";

export interface DocPropT {
    title: string;
    value: string;
    order: number;
}

// ----------------------------------------------------------------------------
/** LocationIndex Cache
 *
 * This class has the following responsibilities:
 *
 * 1) Maintain a local storage of the index
 *
 * 2) Return DispKey locations based on the index.
 *
 */
@Injectable()
export class DocDbService extends ComponentLifecycleEventEmitter {

    propertiesByName: { [key: string]: DocDbPropertyTuple; } = {};

    constructor(private documentLoader: PrivateDocumentLoaderService,
                private tupleService: DocDbTupleService) {
        super();


        let propTs = new TupleSelector(DocDbPropertyTuple.tupleName, {});
        this.tupleService.offlineObserver
            .subscribeToTupleSelector(propTs)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: DocDbPropertyTuple[]) => {
                this.propertiesByName = {};

                for (let item of tuples) {
                    let propKey = this._makePropKey(item.modelSetId, item.name);
                    this.propertiesByName[propKey] = item;
                }
            });

    }

    private _makePropKey(modelSetId: number, name: string): string {
        return `${modelSetId}.${name.toLowerCase()}`;
    }


    /** Get Locations
     *
     * Get the objects with matching keywords from the index..
     *
     */
    getObjects(modelSetKey: string, keys: string[]): Promise<DocumentResultI> {
        return this.documentLoader.getDocuments(modelSetKey, keys);
    }

    getNiceOrderedProperties(doc: DocumentTuple): DocPropT[] {
        let props: DocPropT[] = [];

        for (let name of Object.keys(doc.document)) {
            let propKey = this._makePropKey(doc.modelSet.id, name);
            let prop = this.propertiesByName[propKey] || new DocDbPropertyTuple();
            props.push({
                title: prop.title,
                order: prop.order,
                value: doc.document[name]
            });
        }
        props.sort((a, b) => a.order - b.order);

        return props;
    }

}