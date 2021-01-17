import { Component } from "@angular/core"
import { NgLifeCycleEvents, TupleSelector } from "@synerty/vortexjs"
import {
    DocDbTupleService,
    OfflineConfigTuple
} from "@peek/peek_core_docdb/_private"
import {
    PrivateDocumentLoaderService,
    PrivateDocumentLoaderStatusTuple
} from "@peek/peek_core_docdb/_private/document-loader"

@Component({
    selector: "peek-core-docdb-cfg",
    templateUrl: "docdb-cfg.component.web.html"
})
export class DocdbCfgComponent extends NgLifeCycleEvents {
    lastStatus: PrivateDocumentLoaderStatusTuple = new PrivateDocumentLoaderStatusTuple()
    offlineConfig: OfflineConfigTuple = new OfflineConfigTuple()
    
    private offlineTs = new TupleSelector(OfflineConfigTuple.tupleName, {})
    
    constructor(
        private documentLoader: PrivateDocumentLoaderService,
        private tupleService: DocDbTupleService
    ) {
        super()
        
        this.lastStatus = this.documentLoader.status()
        this.documentLoader.statusObservable()
            .takeUntil(this.onDestroyEvent)
            .subscribe(value => this.lastStatus = value)
        
        this.tupleService.offlineObserver
            .subscribeToTupleSelector(this.offlineTs, false, false, true)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: OfflineConfigTuple[]) => {
                if (tuples.length == 0) {
                    this.tupleService.offlineObserver.updateOfflineState(
                        this.offlineTs, [this.offlineConfig]
                    )
                    return
                }
            })
        
    }
    
    toggleOfflineMode(): void {
        this.offlineConfig.cacheChunksForOffline = !this.offlineConfig.cacheChunksForOffline
        this.tupleService.offlineObserver.updateOfflineState(
            this.offlineTs, [this.offlineConfig]
        )
    }
    
}
