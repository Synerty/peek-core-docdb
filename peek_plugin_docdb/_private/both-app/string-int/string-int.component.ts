import {Component} from "@angular/core";
import {Router} from "@angular/router";
import {DocumentTuple, docDbBaseUrl} from "@peek/peek_plugin_docdb/_private";

import {
    ComponentLifecycleEventEmitter,
    TupleDataObserverService,
    TupleSelector
} from "@synerty/vortexjs";

import {TupleActionPushService} from "@synerty/vortexjs";

import {
    AddIntValueActionTuple,
    StringCapToggleActionTuple
} from "@peek/peek_plugin_docdb/_private";


@Component({
    selector: 'plugin-docdb-document',
    templateUrl: 'string-int.component.mweb.html',
    moduleId: module.id
})
export class DocumentComponent extends ComponentLifecycleEventEmitter {

    documents: Array<DocumentTuple> = [];

    constructor(private actionService: TupleActionPushService,
                private tupleDataObserver: TupleDataObserverService,
                private router: Router) {
        super();

        // Create the TupleSelector to tell the observable what data we want
        let selector = {};
        // Add any filters of the data here
        // selector["lookupName"] = "brownCowList";
        let tupleSelector = new TupleSelector(DocumentTuple.tupleName, selector);

        // Setup a subscription for the data
        let sup = tupleDataObserver.subscribeToTupleSelector(tupleSelector)
            .subscribe((tuples: DocumentTuple[]) => {
                // We've got new data, assign it to our class variable
                this.documents = tuples;
            });

        // unsubscribe when this component is destroyed
        // This is a feature of ComponentLifecycleEventEmitter
        this.onDestroyEvent.subscribe(() => sup.unsubscribe());

    }

    toggleUpperCicked(item) {
        let action = new StringCapToggleActionTuple();
        action.documentId = item.id;
        this.actionService.pushAction(action)
            .then(() => {
                alert('success');

            })
            .catch((err) => {
                alert(err);
            });
    }


    incrementCicked(item) {
        let action = new AddIntValueActionTuple();
        action.documentId = item.id;
        action.offset = 1;
        this.actionService.pushAction(action)
            .then(() => {
                alert('success');

            })
            .catch((err) => {
                alert(err);
            });
    }


    decrementCicked(item) {
        let action = new AddIntValueActionTuple();
        action.documentId = item.id;
        action.offset = -1;
        this.actionService.pushAction(action)
            .then(() => {
                alert('success');

            })
            .catch((err) => {
                alert(err);
            });
    }

    mainClicked() {
        this.router.navigate([docDbBaseUrl]);
    }

}