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
    DocumentResultI,
    DocumentTuple
} from "@peek/peek_plugin_docdb";
import {Observable} from "rxjs/Observable";
import {extend} from "@synerty/vortexjs/src/vortex/UtilMisc";


interface PropT {
    title: string;
    value: string;
    order: number;
}

@Component({
    selector: 'plugin-docDb-result',
    templateUrl: 'view.component.web.html',
    moduleId: module.id
})
export class ViewDocComponent extends ComponentLifecycleEventEmitter implements OnInit {

    doc: DocumentTuple = new DocumentTuple();
    docProps: PropT[] = [];
    docTypeName: string = '';

    propertiesByName: { [key: string]: DocDbPropertyTuple; } = {};

    constructor(private route: ActivatedRoute,
                private docDbService: DocDbService,
                private vortexStatus: VortexStatusService,
                private tupleObserver: TupleDataOfflineObserverService,
                private titleService: TitleService) {
        super();

        titleService.setTitle("Loading Document ...");

    }

    ngOnInit() {

        let propTs = new TupleSelector(DocDbPropertyTuple.tupleName, {});
        let propObservable = this.tupleObserver
            .subscribeToTupleSelector(propTs)
            .takeUntil(this.onDestroyEvent);

        propObservable.subscribe((tuples: DocDbPropertyTuple[]) => {
            this.propertiesByName = {};

            for (let item of tuples) {
                this.propertiesByName[`${item.modelSetId}.${item.name}`] = item;
            }
        });

        let routeObservable = this.route.params
            .takeUntil(this.onDestroyEvent);


        Observable.zip(propObservable, routeObservable,
            (v1: any, params: Params) => params
        )
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

        for (let name of Object.keys(this.doc.document)) {
            let propKey = `${this.doc.modelSetId}.${name.toLowerCase()}`;
            let prop = this.propertiesByName[propKey] || new DocDbPropertyTuple();
            this.docProps.push({
                title: prop.title,
                order: prop.order,
                value: this.doc.document[name]
            });
        }
        this.docProps.sort((a, b) => a.order - b.order);

        this.docTypeName = this.doc.documentType.title;
    }


}