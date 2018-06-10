import {Injectable} from "@angular/core";

import {Payload} from "@synerty/vortexjs";


import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {PrivateDocumentLoaderService} from "./_private/document-loader";

import {DocumentTuple} from "./DocumentTuple";


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
    getObjects(keys: string[]): Promise<DocumentTuple[]> {

        // let keywords = this.splitKeywords(keywordsString);
        // console.log(keywords);
        //
        // return this.docDbIndexLoader.getObjectIds(propertyName, keywords)
        //     .then((objectIds: number[]) => {
        //
        //         return this.documentLoader.getObjects(objectTypeId, objectIds);
        //     })

    }

}