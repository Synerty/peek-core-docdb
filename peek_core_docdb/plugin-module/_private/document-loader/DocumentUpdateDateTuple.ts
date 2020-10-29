import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class DocumentUpdateDateTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "DocumentUpdateDateTuple";

    // Improve performance of the JSON serialisation
    protected _rawJonableFields = ['initialLoadComplete', 'updateDateByChunkKey'];

    initialLoadComplete: boolean = false;
    updateDateByChunkKey: {} = {};

    constructor() {
        super(DocumentUpdateDateTuple.tupleName)
    }
}