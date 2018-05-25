 import {addTupleType, Tuple, TupleActionABC} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";

@addTupleType
export class AddIntValueActionTuple extends TupleActionABC {
    static readonly tupleName = docDbTuplePrefix + "AddIntValueActionTuple";

    documentId: number;
    offset: number;

    constructor() {
        super(AddIntValueActionTuple.tupleName)
    }
}