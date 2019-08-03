import {Component, NgZone, ViewChild} from "@angular/core";

import {
    DocDbPopupActionI,
    DocDbPopupTypeE
} from "@peek/peek_plugin_docdb/DocDbPopupService";
import * as $ from "jquery";
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_plugin_docdb/_private/services/PrivateDocDbPopupService";
import {NzContextMenuService} from "ng-zorro-antd";
import {DocDbPopupClosedReasonE, DocDbPopupDetailI} from "@peek/peek_plugin_docdb";


@Component({
    selector: 'plugin-docdb-popup-summary-popup',
    templateUrl: 'summary-popup.component.web.html',
    styleUrls: ['summary-popup.component.web.scss'],
    moduleId: module.id
})
export class SummaryPopupComponent { // This is a root/global component

    @ViewChild('summaryView', {static: true}) summaryView;


    params: PopupTriggeredParams | null = null;

    modalAction: DocDbPopupActionI | null = null;


    constructor(private nzContextMenuService: NzContextMenuService,
                private popupService: PrivateDocDbPopupService,
                private zone: NgZone) {

        this.popupService
            .showSummaryPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v));

        this.popupService
            .hideSummaryPopupSubject
            .subscribe(() => this.closePopup(DocDbPopupClosedReasonE.closedByApiCall));

    }

    private makeMouseEvent(params: PopupTriggeredParams): MouseEvent {
        return <any>{
            preventDefault: () => false,
            x: params.position.x,
            y: params.position.y
        };
    }

    private reset() {
        this.params = null;
        this.modalAction = null
    }

    private startClosedCheckTimer(): void {
        if (this.params == null)
            return;

        if (!this.summaryView.open && this.modalAction == null)
            this.popupService.hidePopupWithReason(DocDbPopupTypeE.summaryPopup,
                DocDbPopupClosedReasonE.userDismissedPopup);

        setTimeout(() => this.startClosedCheckTimer(), 50);
    }

    protected openPopup(params: PopupTriggeredParams) {
        this.reset();
        this.params = params;
        this.nzContextMenuService.create(this.makeMouseEvent(params), this.summaryView);
        this.startClosedCheckTimer();
    }

    closePopup(reason: DocDbPopupClosedReasonE): void {
        if (this.params == null)
            return;

        this.nzContextMenuService.close();
        this.reset();

        this.popupService.hidePopupWithReason(DocDbPopupTypeE.summaryPopup, reason);
    }

    showDetailsPopup(): void {
        const params = this.params; // this will be reset
        this.popupService.hidePopupWithReason(DocDbPopupTypeE.summaryPopup,
            DocDbPopupClosedReasonE.userDismissedPopup);

        this.popupService
            .showPopup(
                DocDbPopupTypeE.detailPopup,
                params.triggeredByPlugin,
                this.makeMouseEvent(params),
                params.modelSetKey,
                params.objectKey,
                params.options);
    }

    headerDetails(): string {
        return this.params.details
            .filter(d => d.showInHeader)
            .map(d => d.value)
            .join(', ');
    }

    hasBodyDetails(): boolean {
        return this.bodyDetails().length != 0;
    }

    bodyDetails(): DocDbPopupDetailI[] {
        return this.params.details.filter(d => !d.showInHeader);
    }

    actionClicked(item: DocDbPopupActionI): void {
        if (item.children != null && item.children.length != 0) {
            this.nzContextMenuService.close();
            this.modalAction = item;
            return;
        } else {
            item.callback();
        }
        if (item.closeOnCallback == null || item.closeOnCallback === true)
            this.closePopup(DocDbPopupClosedReasonE.userClickedAction);
    }

    modalName(): string {
        if (this.modalAction == null)
            return null;
        return this.modalAction.name || this.modalAction.tooltip;
    }

    shouldShowModal(): boolean {
        return this.modalAction != null;
    }

    closeModal(): void {
        this.modalAction = null;
    }

    modalChildActions(): DocDbPopupActionI[] {
        return this.modalAction == null ? [] : this.modalAction.children;
    }

    modalAfterOpen(): void {
        // This is a tooltip, So make it transparent to the mouse
        $('#pl-docdb-summary-popup')
            .parents('.cdk-overlay-pane')
            .css("z-index", "1001");
    }

    showPopup(): boolean {
        return this.params != null
            && (this.params.details.length != 0 || this.params.actions.length != 0);
    }


}
