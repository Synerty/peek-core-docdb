import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocDbTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocDbTuple";

    //  Description of date1
    dict1 : {};

    //  Description of array1
    array1 : any[];

    //  Description of date1
    date1 : Date;

    constructor() {
        super(DocDbTuple.tupleName)
    }
}