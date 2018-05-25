                                       import {addTupleType, Tuple, TupleActionABC} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";

@addTupleType
export class StringCapToggleActionTuple extends TupleActionABC {
    static readonly tupleName = docDbTuplePrefix + "StringCapToggleActionTuple";

    documentId: number;

    constructor() {
        super(StringCapToggleActionTuple.tupleName)
    }
}