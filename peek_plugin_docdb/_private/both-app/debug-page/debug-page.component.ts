import {Component, OnInit} from "@angular/core";
import {ActivatedRoute, Params} from "@angular/router";
import { TitleService } from "@synerty/peek-plugin-base-js"

import {ComponentLifecycleEventEmitter, VortexStatusService} from "@synerty/vortexjs";

import {
    DocDbService,
    DocPropT,
    DocumentResultI,
    DocumentTuple
} from "@peek/peek_plugin_docdb";


@Component({
    selector: 'plugin-docdb-popup-debug',
    templateUrl: 'debug-page.component.web.html',
    moduleId: module.id
})
export class DocDbPopupComponent extends ComponentLifecycleEventEmitter implements OnInit {

    doc: DocumentTuple = new DocumentTuple();
    docProps: DocPropT[] = [];
    docTypeName: string = '';


    itemKey = '';

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
