import {Injectable} from "@angular/core";

import {Payload} from "@synerty/vortexjs";


import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PrivateDocumentLoaderService} from "./_private/document-loader";

import {DocumentTuple} from "./DocumentTuple";


export interface DocumentResultI {
    [key: string]: DocumentTuple
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
export class DocDbService {

    constructor(private documentLoader: PrivateDocumentLoaderService) {


    }


    /** Get Locations
     *
     * Get the objects with matching keywords from the index..
     *
     */
    getObjects(modelSetKey: string, keys: string[]): Promise<DocumentResultI> {
        return this.documentLoader.getDocuments(modelSetKey, keys);
    }

}