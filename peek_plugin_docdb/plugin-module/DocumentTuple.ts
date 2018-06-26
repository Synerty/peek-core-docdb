import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "./_private/PluginNames";
import {DocDbDocumentTypeTuple} from "./DocDbDocumentTypeTuple";


@addTupleType
export class DocumentTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentTuple";

    //  The unique key of this document
    key: string;

    // This Document Type ID
    documentType: DocDbDocumentTypeTuple = DocDbDocumentTypeTuple();

    // The document data
    document: {} = {};

    constructor() {
        super(DocumentTuple.tupleName)
    }
}