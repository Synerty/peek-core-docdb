import {Component, Input, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import {docDbBaseUrl} from "@peek/peek_plugin_docdb/_private";
import {TitleService} from "@synerty/peek-util";

import {
    ComponentLifecycleEventEmitter,
    TupleActionPushService,
    TupleDataObserverService,
    TupleDataOfflineObserverService,
    TupleSelector,
    VortexStatusService
} from "@synerty/vortexjs";

import {
    DocDbDocumentTypeTuple,
    DocDbPropertyTuple,
    DocDbService,
    DocPropT,
    DocumentResultI,
    DocumentTuple
} from "@peek/peek_plugin_docdb";
import {Observable} from "rxjs/Observable";
import {extend} from "@synerty/vortexjs/src/vortex/UtilMisc";


@Component({
    selector: 'plugin-docDb-result',
    templateUrl: 'view.component.web.html',
    moduleId: module.id
})
export class ViewDocComponent extends ComponentLifecycleEventEmitter implements OnInit {

    doc: DocumentTuple = new DocumentTuple();
    docProps: DocPropT[] = [];
    docTypeName: string = '';

    constructor(private route: ActivatedRoute,
                private docDbService: DocDbService,
                private vortexStatus: VortexStatusService,
                private titleService: TitleService) {
        super();

        titleService.setTitle("Loading Document ...");

    }

    ngOnInit() {

        this.route.params
            .takeUntil(this.onDestroyEvent)
            .subscribe((params: Params) => {
                let vars = {};

                if (typeof window !== 'undefined') {
                    window.location.href.replace(
                        /[?&]+([^=&]+)=([^&]*)/gi,
                        (m, key, value) => vars[key] = value
                    );
                }

                let key = params['key'] || vars['key'];
                let modelSetKey = params['modelSetKey'] || vars['modelSetKey'];

                this.docDbService.getObjects(modelSetKey, [key])
                    .then((docs: DocumentResultI) => this.loadDoc(docs[key], key));

            });

    }

    private loadDoc(doc: DocumentTuple, key: string) {
        doc = doc || new DocumentTuple();
        this.doc = doc;
        this.docTypeName = '';
        this.docProps = [];

        if (this.doc.key == null) {
            this.titleService.setTitle(`Document ${key} Not Found`);
            return;
        }

        this.titleService.setTitle(`Document ${key}`);

        this.docProps = this.docDbService.getNiceOrderedProperties(this.doc);
        this.docTypeName = this.doc.documentType.title;
    }


}