import {Component, OnInit} from "@angular/core";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {
    ComponentLifecycleEventEmitter,
    extend,
    TupleLoader,
    VortexService,
    TupleSelector,
    TupleDataObserverService
} from "@synerty/vortexjs";
import {docDbFilt, ModelSetTuple} from "@peek/peek_plugin_docdb/_private";
import {DocDbDocumentTypeTuple} from "@peek/peek_plugin_docdb";


@Component({
    selector: 'pl-docdb-edit-object-type',
    templateUrl: './edit.component.html'
})
export class EditDocumentTypeComponent extends ComponentLifecycleEventEmitter {
    // This must match the dict defined in the admin_backend handler
    private readonly filt = {
        "key": "admin.Edit.DocDbDocumentTypeTuple"
    };

    items: DocDbDocumentTypeTuple[] = [];

    loader: TupleLoader;
    modelSetById: { [key: number]: ModelSetTuple } = {};

    constructor(private balloonMsg: Ng2BalloonMsgService,
                vortexService: VortexService,
                private tupleObserver: TupleDataObserverService) {
        super();

        this.loader = vortexService.createTupleLoader(
            this, () => extend({}, this.filt, docDbFilt)
        );

        this.loader.observable
            .subscribe((tuples: DocDbDocumentTypeTuple[]) => this.items = tuples);

        let ts = new TupleSelector(ModelSetTuple.tupleName, {});
        this.tupleObserver.subscribeToTupleSelector(ts)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: ModelSetTuple[]) => {
                this.modelSetById = {};
                for (let tuple of tuples) {
                    this.modelSetById[tuple.id] = tuple;
                }
            });
    }

    modelSetTitle(tuple: DocDbDocumentTypeTuple): string {
        let modelSet = this.modelSetById[tuple.modelSetId];
        return modelSet == null ? "" : modelSet.name;
    }

    save() {
        this.loader.save()
            .then(() => this.balloonMsg.showSuccess("Save Successful"))
            .catch(e => this.balloonMsg.showError(e));
    }

    resetClicked() {
        this.loader.load()
            .then(() => this.balloonMsg.showSuccess("Reset Successful"))
            .catch(e => this.balloonMsg.showError(e));
    }


}