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
    selector: 'plugin-docdb-popup-detail-popup',
    templateUrl: 'detail-popup.component.web.html',
    styleUrls: ['detail-popup.component.web.scss'],
    moduleId: module.id
})
export class DetailPopupComponent { // This is a root/global component

    @ViewChild('detailView', {static: true}) detailView;


    params: PopupTriggeredParams | null = null;

    modalAction: DocDbPopupActionI | null = null;


    constructor(private nzContextMenuService: NzContextMenuService,
                private popupService: PrivateDocDbPopupService,
                private zone: NgZone) {

        this.popupService
            .showDetailPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v));

        this.popupService
            .hideDetailPopupSubject
            .subscribe(() => this.closePopup(DocDbPopupClosedReasonE.closedByApiCall));

    }

    private makeMouseEvent(): MouseEvent {
        return <any>{
            preventDefault: () => false,
            x: this.params.position.x,
            y: this.params.position.y
        };
    }

    private reset() {
        this.params = null;
        this.modalAction = null
    }

    private startClosedCheckTimer(): void {
        if (this.params == null)
            return;

        if (!this.detailView.open && this.modalAction == null)
            this.popupService.hidePopupWithReason(DocDbPopupTypeE.detailPopup,
                DocDbPopupClosedReasonE.userDismissedPopup);

        setTimeout(() => this.startClosedCheckTimer(), 50);
    }

    protected openPopup(params: PopupTriggeredParams) {
        this.reset();
        this.params = params;
        this.nzContextMenuService.create(this.makeMouseEvent(), this.detailView);
        this.startClosedCheckTimer();
    }

    closePopup(reason: DocDbPopupClosedReasonE): void {
        if (this.params == null)
            return;

        this.nzContextMenuService.close();
        this.reset();

        this.popupService.hidePopupWithReason(DocDbPopupTypeE.detailPopup, reason);
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
        $('#pl-docdb-detail-popup')
            .parents('.cdk-overlay-pane')
            .css("z-index", "1001");
    }

    showPopup(): boolean {
        return this.params != null
            && (this.params.details.length != 0 || this.params.actions.length != 0);
    }


}
