import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocumentTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentTuple";

    //  Description of date1
    id : number;

    //  Description of string1
    string1 : string;

    //  Description of int1
    int1 : number;

    constructor() {
        super(DocumentTuple.tupleName)
    }
}