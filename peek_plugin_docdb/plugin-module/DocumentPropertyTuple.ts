import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "./_private/PluginNames";


@addTupleType
export class DocumentPropertyTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentPropertyTuple";

    //  The id
    id: number;

    //  The modelSetKey of the document property
    modelSetKey: string;

    //  The name of the document property
    name: string;

    //  The title of the document property
    title: string;

    constructor() {
        super(DocumentPropertyTuple.tupleName)
    }
}