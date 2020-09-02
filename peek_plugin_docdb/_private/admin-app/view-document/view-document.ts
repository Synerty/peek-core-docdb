import {Component} from "@angular/core";
import {
    ComponentLifecycleEventEmitter,
    extend,
    TupleLoader,
    VortexService
} from "@synerty/vortexjs";
import {docDbFilt} from "@peek/peek_plugin_docdb/_private";
import {DocumentTuple} from "@peek/peek_plugin_docdb";
import { BalloonMsgService } from "@synerty/peek-plugin-base-js"


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
    modelSetKey: string = '';

    doc: any = {};

    loader: TupleLoader;

    constructor(private balloonMsg: BalloonMsgService,
                vortexService: VortexService) {
        super();

        this.loader = vortexService.createTupleLoader(this,
            () => extend({
                docKey: this.docKey,
                modelSetKey: this.modelSetKey
            }, this.filt, docDbFilt));

        this.loader.observable
            .subscribe((tuples: DocumentTuple[]) => {
                if (tuples.length == 0)
                    this.doc = {};
                else
                    this.doc = tuples[0];
            });
    }

    docJson(): any {
        let doc = JSON.parse(this.doc["documentJson"]);
        for (const key of Object.keys(doc)) {
            if (key[0] == '_')
                delete doc[key];
        }
        return doc;
    }

    resetClicked() {
        this.loader.load()
            .then(() => {
                if (this.doc.key != null)
                    this.balloonMsg.showSuccess("Fetch Successful");
                else
                    this.balloonMsg.showInfo("No matching document");
            })
            .catch(e => this.balloonMsg.showError(e));
    }

}
