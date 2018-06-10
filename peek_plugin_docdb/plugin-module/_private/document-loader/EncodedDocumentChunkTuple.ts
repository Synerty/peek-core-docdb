import {addTupleType, Tuple} from "@synerty/vortexjs";
import {docDbTuplePrefix} from "../PluginNames";


@addTupleType
export class EncodedDocumentChunkTuple extends Tuple {
    public static readonly tupleName = docDbTuplePrefix + "EncodedDocumentChunkTuple";

    chunkKey: number;
    lastUpdate: string;
    encodedData: string;

    constructor() {
        super(EncodedDocumentChunkTuple.tupleName)
    }
}
