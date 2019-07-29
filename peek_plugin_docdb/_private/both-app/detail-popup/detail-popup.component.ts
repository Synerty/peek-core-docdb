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
            .subscribe(() => this.closePopup());

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
            this.popupService.hidePopup(DocDbPopupTypeE.detailPopup);

        setTimeout(() => this.startClosedCheckTimer(), 50);
    }

    protected openPopup(params: PopupTriggeredParams) {
        this.reset();
        this.params = params;
        this.nzContextMenuService.create(this.makeMouseEvent(), this.detailView);
        this.startClosedCheckTimer();
    }

    closePopup(): void {

        this.nzContextMenuService.close();
        this.reset();


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
