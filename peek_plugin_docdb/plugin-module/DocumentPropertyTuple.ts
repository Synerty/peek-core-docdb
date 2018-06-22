import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "./_private/PluginNames";


@addTupleType
export class DocumentPropertyTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentPropertyTuple";

    //  The id
    id: number;

    //  The modelSetId of the document property
    modelSetId: number;

    //  The name of the document property
    name: string;

    //  The title of the document property
    title: string;

    constructor() {
        super(DocumentPropertyTuple.tupleName)
    }
}