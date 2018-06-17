import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocDbPropertyTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocDbPropertyTuple";

    //  The id
    id: number;

    //  The modelSetKey of the document property
    modelSetKey: string;

    //  The name of the document property
    name: string;

    //  The title of the document property
    title: string;

    constructor() {
        super(DocDbPropertyTuple.tupleName)
    }
}