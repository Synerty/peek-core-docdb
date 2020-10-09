import {Injectable, NgZone} from "@angular/core";
import {
    DocDbPopupActionI,
    DocDbPopupClosedReasonE,
    DocDbPopupContextI,
    DocDbPopupDetailI,
    DocDbPopupService,
    DocDbPopupTypeE,
    ObjectTriggerOptionsI,
    ObjectTriggerPositionI
} from "../../DocDbPopupService";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";

import {
    DocDbPropertyTuple,
    DocDbPropertyTypeFilterI,
    DocDbService,
    DocumentResultI
} from "@peek/peek_plugin_docdb";
import {assert, sortText} from "@synerty/vortexjs";

export class PopupTriggeredParams {

    actions: DocDbPopupActionI[] = [];
    details: DocDbPopupDetailI[] = [];

    constructor(public triggeredByPlugin: string,
                public position: ObjectTriggerPositionI,
                public modelSetKey: string,
                public objectKey: string,
                public options: ObjectTriggerOptionsI) {
    }
}


@Injectable()
export class PrivateDocDbPopupService extends DocDbPopupService {

    // Tooltip
    private tooltipPopupSubject = new Subject<DocDbPopupContextI>();
    private tooltipPopupClosedSubject = new Subject<DocDbPopupClosedReasonE>();

    showTooltipPopupSubject = new Subject<PopupTriggeredParams>();
    hideTooltipPopupSubject = new Subject<void>();

    // Summary
    private summaryPopupSubject = new Subject<DocDbPopupContextI>();
    private summaryPopupClosedSubject = new Subject<DocDbPopupClosedReasonE>();

    showSummaryPopupSubject = new Subject<PopupTriggeredParams>();
    hideSummaryPopupSubject = new Subject<void>();

    // Details
    private detailPopupSubject = new Subject<DocDbPopupContextI>();
    private detailPopupClosedSubject = new Subject<DocDbPopupClosedReasonE>();

    showDetailPopupSubject = new Subject<PopupTriggeredParams>();
    hideDetailPopupSubject = new Subject<void>();

    private readonly DATA_LOAD_LEAD_TIME_MS = 200;
    private readonly TOOLTIP_POPUP_DELAY_TIME_MS = 700;

    private shownPopup: DocDbPopupTypeE | null = null;

    constructor(private docDbService: DocDbService,
                protected zone: NgZone) {
        super();

    }

    showPopup(popupType: DocDbPopupTypeE,
              triggeredByPlugin: string,
              position: ObjectTriggerPositionI,
              modelSetKey: string,
              objectKey: string,
              options: ObjectTriggerOptionsI = {}): void {

        const params = new PopupTriggeredParams(
            triggeredByPlugin,
            position,
            modelSetKey,
            objectKey,
            Object.assign({popupDelayMs: 0}, options));

        if (popupType == DocDbPopupTypeE.tooltipPopup) {
            params.options.popupDelayMs =
                params.options.popupDelayMs || this.TOOLTIP_POPUP_DELAY_TIME_MS;

            this.triggerPopup(popupType, params,
                this.showTooltipPopupSubject,
                this.hideTooltipPopupSubject,
                this.tooltipPopupSubject,
                (prop: DocDbPropertyTuple) => prop.showOnTooltip
            );

        } else if (popupType == DocDbPopupTypeE.summaryPopup) {
            this.triggerPopup(popupType, params,
                this.showSummaryPopupSubject,
                this.hideSummaryPopupSubject,
                this.summaryPopupSubject,
                (prop: DocDbPropertyTuple) => prop.showOnSummary
            );

        } else if (popupType == DocDbPopupTypeE.detailPopup) {
            this.triggerPopup(popupType, params,
                this.showDetailPopupSubject,
                this.hideDetailPopupSubject,
                this.detailPopupSubject,
                (prop: DocDbPropertyTuple) => prop.showOnDetail
            );

        } else {
            throw new Error(`showPopup:Unhandled popup type ${popupType}`);
        }

    }

    hidePopup(popupType: DocDbPopupTypeE): void {
        this.hidePopupWithReason(popupType, DocDbPopupClosedReasonE.closedByApiCall);
    }


    hidePopupWithReason(popupType: DocDbPopupTypeE,
                        reason: DocDbPopupClosedReasonE): void {
        if (this.shownPopup != popupType)
            return;

        this.shownPopup = null;

        if (popupType == DocDbPopupTypeE.tooltipPopup) {
            this.hideTooltipPopupSubject.next();
            this.tooltipPopupClosedSubject.next(reason);

        } else if (popupType == DocDbPopupTypeE.summaryPopup) {
            this.hideSummaryPopupSubject.next();
            this.summaryPopupClosedSubject.next(reason);

        } else if (popupType == DocDbPopupTypeE.detailPopup) {
            this.hideDetailPopupSubject.next();
            this.detailPopupClosedSubject.next(reason);

        } else {
            throw new Error(`hidePopup:Unhandled popup type ${popupType}`);
        }
    }

    popupObservable(popupType: DocDbPopupTypeE): Observable<DocDbPopupContextI> {

        if (popupType == DocDbPopupTypeE.tooltipPopup) {
            return this.tooltipPopupSubject.asObservable();

        } else if (popupType == DocDbPopupTypeE.summaryPopup) {
            return this.summaryPopupSubject.asObservable();

        } else if (popupType == DocDbPopupTypeE.detailPopup) {
            return this.detailPopupSubject.asObservable();

        } else {
            throw new Error(`popupObservable:Unhandled popup type ${popupType}`);
        }
    }

    popupClosedObservable(popupType: DocDbPopupTypeE)
        : Observable<DocDbPopupClosedReasonE> {

        if (popupType == DocDbPopupTypeE.tooltipPopup) {
            return this.tooltipPopupClosedSubject.asObservable();

        } else if (popupType == DocDbPopupTypeE.summaryPopup) {
            return this.summaryPopupClosedSubject.asObservable();

        } else if (popupType == DocDbPopupTypeE.detailPopup) {
            return this.detailPopupClosedSubject.asObservable();

        } else {
            throw new Error(`popupObservable:Unhandled popup type ${popupType}`);
        }
    }

    private triggerPopup(popupType: DocDbPopupTypeE,
                         params: PopupTriggeredParams,
                         showTriggerSubject: Subject<PopupTriggeredParams>,
                         hideTriggerSubject: Subject<void>,
                         subject: Subject<DocDbPopupContextI>,
                         propFilter: DocDbPropertyTypeFilterI) {
        if (this.shownPopup != null)
            return;

        this.shownPopup = popupType;

        assert(params.objectKey != null, "objectKey is null");

        // Load the data XXXms before showing the popup, if we can.
        const loadDelay = params.options.popupDelayMs < this.DATA_LOAD_LEAD_TIME_MS
            ? params.options.popupDelayMs
            : params.options.popupDelayMs - this.DATA_LOAD_LEAD_TIME_MS;

        let loadCancelled = false;

        const loadTimeoutHandle = setTimeout(
            () => {

                // FIXME: This doesn't work because all the data is under pofDiagram
                // this.docDbService.getObjects(params.modelSetKey, [params.objectKey])
                this.docDbService.getObjects('pofDiagram', [params.objectKey])
                    .then((docs: DocumentResultI) => {
                        if (loadCancelled)
                            return;

                        const apiHook: DocDbPopupContextI = {
                            popupType: popupType,
                            key: params.objectKey,
                            document: null,
                            modelSetKey: params.modelSetKey,
                            triggeredByPlugin: params.triggeredByPlugin,
                            options: params.options,
                            addAction: (item: DocDbPopupActionI) => {
                                this.zone.run(() => {
                                    params.actions.push(item);
                                    params.actions = this.sortActions(params.actions);
                                });
                            },
                            addDetails: (items: DocDbPopupDetailI[]) => {
                                this.zone.run(() => {
                                    params.details.add(items);
                                    params.details = this.sortDetails(params.details);

                                });
                            }
                        };

                        const doc = docs[params.objectKey];
                        if (doc != null) {
                            apiHook.document = doc;
                            const docProps = this.docDbService
                                .getNiceOrderedProperties(doc, propFilter);
                            params.details.add(docProps);
                        }

                        // Tell any observers that we're popping up
                        // Give them a chance to add their items
                        subject.next(apiHook);

                    });
            },
            loadDelay
        );

        const popupTimeoutHandle = setTimeout(
            () => showTriggerSubject.next(params),
            params.options.popupDelayMs
        );

        hideTriggerSubject
            .first()
            .subscribe(() => {
                loadCancelled = true;
                clearTimeout(popupTimeoutHandle);
                clearTimeout(loadTimeoutHandle);
            });

    }

    private sortActions(actions: DocDbPopupActionI[]): DocDbPopupActionI[] {
        actions = sortText(actions, (action) => {
            return action.name != null
                ? action.name
                : action.tooltip != null
                    ? action.tooltip
                    : ''
        });
        for (const action of actions)
            action.children = this.sortActions(action.children || []);
        return actions;
    }

    private sortDetails(details: DocDbPopupDetailI[]): DocDbPopupDetailI[] {
        return details.sort((a, b) => {
            const ao = a.order || 0;
            const bo = b.order || 0;
            if (ao != bo)
                return ao < bo ? -1 : 1;

            const an = a.title || '';
            const bn = b.title || '';

            if (an != bn)
                return an < bn ? -1 : 1;

            const av = a.value || '';
            const bv = b.value || '';

            if (av != bv)
                return av < bv ? -1 : 1;

            return 0
        });
    }
}
