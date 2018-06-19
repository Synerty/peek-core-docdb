import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "./_private/PluginNames";


@addTupleType
export class DocumentTypeTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentTypeTuple";

    //  The id
    id: number;

    //  The name of the document type
    name: string;

    //  The title of the document type
    title: string;

    constructor() {
        super(DocumentTypeTuple.tupleName)
    }
}