import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "./PluginNames";


@addTupleType
export class ModelSetTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocDbModelSet";

    //  The unique key of this document
    id: string;

    //  The unique key of this document
    key: string;

    //  The unique key of this document
    name: string;

    constructor() {
        super(ModelSetTuple.tupleName)
    }
}