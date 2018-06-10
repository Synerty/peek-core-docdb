import {Component, OnInit} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    extend,
    TupleLoader,
    VortexService
} from "@synerty/vortexjs";
import {docDbFilt, DocumentTuple} from "@peek/peek_plugin_docdb/_private";
import {Ng2BalloonMsgService} from "@synerty/ng2-balloon-msg";


@Component({
    selector: 'pl-docdb-view-document',
    templateUrl: './view-document.html'
})
export class ViewDocumentComponent extends ComponentLifecycleEventEmitter {
    // This must match the dict defined in the admin_backend handler
    private readonly filt = {
        "key": "admin.Edit.DocumentTuple"
    };

    docKey: string = '';

    doc: DocumentTuple = new DocumentTuple();

    loader: TupleLoader;

    constructor(private balloonMsg: Ng2BalloonMsgService,
                vortexService: VortexService) {
        super();

        this.loader = vortexService.createTupleLoader(this,
            () => extend({key: this.docKey}, this.filt, docDbFilt));

        this.loader.observable
            .subscribe((tuples: DocumentTuple[]) => {
                if (tuples.length == 0)
                    this.doc = new DocumentTuple();
                else
                    this.doc = tuples[0];
            });
    }


    save() {
        this.loader.save(this.doc)
            .then(() => this.balloonMsg.showSuccess("Save Successful"))
            .catch(e => this.balloonMsg.showError(e));
    }

    resetClicked() {
        this.loader.load()
            .then(() => this.balloonMsg.showSuccess("Reset Successful"))
            .catch(e => this.balloonMsg.showError(e));
    }

}