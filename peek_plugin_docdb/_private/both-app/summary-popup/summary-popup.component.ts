import {Component, NgZone, ViewChild} from "@angular/core";

import {
    DocDbPopupActionI,
    DocDbPopupTypeE
} from "@peek/peek_plugin_docdb/DocDbPopupService";
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_plugin_docdb/_private/services/PrivateDocDbPopupService";
import {NzContextMenuService} from "ng-zorro-antd";


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
            .subscribe(() => this.closePopup());

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
            this.popupService.hidePopup(DocDbPopupTypeE.summaryPopup);

        setTimeout(() => this.startClosedCheckTimer(), 50);
    }

    protected openPopup(params: PopupTriggeredParams) {
        this.reset();
        this.params = params;
        this.nzContextMenuService.create(this.makeMouseEvent(params), this.summaryView);
        this.startClosedCheckTimer();
    }

    closePopup(): void {

        this.nzContextMenuService.close();
        this.reset();


    }

    showDetailsPopup(): void {
        const params = this.params; // this will be reset
        this.popupService.hidePopup(DocDbPopupTypeE.summaryPopup);
        this.popupService
            .showPopup(
                DocDbPopupTypeE.detailPopup,
                params.triggeredByPlugin,
                this.makeMouseEvent(params),
                params.modelSetKey,
                params.objectKey,
                params.options);
    }

    actionClicked(item: DocDbPopupActionI): void {
        if (item.children != null && item.children.length != 0) {
            this.nzContextMenuService.close();
            this.modalAction = item;
            return;
        } else {
            item.callback();
        }
        if (item.closeOnCallback)
            this.closePopup();
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


}
