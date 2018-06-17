import {Component, OnInit} from "@angular/core";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";
import {
    extend,
    VortexService,
    ComponentLifecycleEventEmitter,
    TupleLoader
} from "@synerty/vortexjs";
import {DocDbDocumentTypeTuple, docDbFilt} from "@peek/peek_plugin_docdb/_private";


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

    constructor(private balloonMsg: Ng2BalloonMsgService,
                vortexService: VortexService) {
        super();

        this.loader = vortexService.createTupleLoader(
            this, () => extend({}, this.filt, docDbFilt)
        );

        this.loader.observable
            .subscribe((tuples:DocDbDocumentTypeTuple[]) => this.items = tuples);
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