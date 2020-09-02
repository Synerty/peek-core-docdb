import {Component, OnInit} from "@angular/core";
import { BalloonMsgService } from "@synerty/peek-plugin-base-js"
import {
    ComponentLifecycleEventEmitter,
    extend,
    TupleDataObserverService,
    TupleLoader,
    TupleSelector,
    VortexService
} from "@synerty/vortexjs";
import {DocDbModelSetTuple, DocDbPropertyTuple} from "@peek/peek_plugin_docdb";
import {docDbFilt} from "@peek/peek_plugin_docdb/_private";


@Component({
    selector: 'pl-docdb-edit-property',
    templateUrl: './edit.component.html'
})
export class EditPropertyComponent extends ComponentLifecycleEventEmitter {
    // This must match the dict defined in the admin_backend handler
    private readonly filt = {
        "key": "admin.Edit.DocDbPropertyTuple"
    };

    items: DocDbPropertyTuple[] = [];

    loader: TupleLoader;
    modelSetById: { [key: number]: DocDbModelSetTuple } = {};

    constructor(private balloonMsg: BalloonMsgService,
                vortexService: VortexService,
                private tupleObserver: TupleDataObserverService) {
        super();

        this.loader = vortexService.createTupleLoader(
            this, () => extend({}, this.filt, docDbFilt)
        );

        this.loader.observable
            .subscribe((tuples: DocDbPropertyTuple[]) => this.items = tuples);

        let ts = new TupleSelector(DocDbModelSetTuple.tupleName, {});
        this.tupleObserver.subscribeToTupleSelector(ts)
            .takeUntil(this.onDestroyEvent)
            .subscribe((tuples: DocDbModelSetTuple[]) => {
                this.modelSetById = {};
                for (let tuple of tuples) {
                    this.modelSetById[tuple.id] = tuple;
                }
            });
    }

    modelSetTitle(tuple: DocDbPropertyTuple): string {
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
