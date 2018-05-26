import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocumentTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentTuple";

    //  The unique ID of this document (database generated)
    id: number;

    //  The unique key of this document
    key: string;

    // The document data
    document: {};

    constructor() {
        super(DocumentTuple.tupleName)
    }
}