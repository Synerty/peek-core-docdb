import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocDbDocumentTypeTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocDbDocumentTypeTuple";

    //  The id
    id: number;

    //  The name of the document type
    name: string;

    //  The title of the document type
    title: string;

    constructor() {
        super(DocDbDocumentTypeTuple.tupleName)
    }
}