import { Component, NgZone, ViewChild } from "@angular/core"
import { DocDbPopupActionI, DocDbPopupTypeE } from "@peek/peek_plugin_docdb/DocDbPopupService"
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_plugin_docdb/_private/services/PrivateDocDbPopupService"
import { NzContextMenuService } from "ng-zorro-antd"
import { DocDbPopupClosedReasonE, DocDbPopupDetailI } from "@peek/peek_plugin_docdb"

@Component({
    selector: "plugin-docdb-popup-summary-popup",
    templateUrl: "summary-popup.component.html",
    styleUrls: ["summary-popup.component.scss"],
    moduleId: module.id
})
export class SummaryPopupComponent {
    @ViewChild("summaryView", {static: true}) summaryView
    
    params: PopupTriggeredParams | null = null
    modalAction: DocDbPopupActionI | null = null
    
    constructor(
        private nzContextMenuService: NzContextMenuService,
        private popupService: PrivateDocDbPopupService,
        private zone: NgZone,
    ) {
        this.popupService
            .showSummaryPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v))
        
        this.popupService
            .hideSummaryPopupSubject
            .subscribe(() => this.closePopup(DocDbPopupClosedReasonE.closedByApiCall))
    }
    
    closePopup(reason: DocDbPopupClosedReasonE): void {
        if (this.params == null) return
        this.nzContextMenuService.close()
        this.reset()
        this.popupService.hidePopupWithReason(DocDbPopupTypeE.summaryPopup, reason)
    }
    
    showDetailsPopup(): void {
        const params = this.params
        this.popupService.hidePopupWithReason(
            DocDbPopupTypeE.summaryPopup,
            DocDbPopupClosedReasonE.userDismissedPopup
        )
        this.popupService.showPopup(
            DocDbPopupTypeE.detailPopup,
            params.triggeredByPlugin,
            this.makeMouseEvent(params),
            params.modelSetKey,
            params.objectKey,
            params.options
        )
    }
    
    headerDetails(): string {
        return this.params.details
            .filter(d => d.showInHeader)
            .map(d => d.value)
            .join(", ")
    }
    
    hasBodyDetails(): boolean {
        return this.bodyDetails().length != 0
    }
    
    bodyDetails(): DocDbPopupDetailI[] {
        return this.params.details.filter(d => !d.showInHeader)
    }
    
    actionClicked(item: DocDbPopupActionI): void {
        if (item.children != null && item.children.length != 0) {
            this.nzContextMenuService.close()
            this.modalAction = item
            return
        }
        else {
            item.callback()
        }
        if (item.closeOnCallback == null || item.closeOnCallback === true)
            this.closePopup(DocDbPopupClosedReasonE.userClickedAction)
    }
    
    modalName(): string {
        if (this.modalAction == null) return null
        return this.modalAction.name || this.modalAction.tooltip
    }
    
    shouldShowModal(): boolean {
        return this.modalAction != null
    }
    
    closeModal(): void {
        this.modalAction = null
    }
    
    modalChildActions(): DocDbPopupActionI[] {
        return this.modalAction == null ? [] : this.modalAction.children
    }
    
    showPopup(): boolean {
        return this.params != null
    }
    
    protected openPopup(params: PopupTriggeredParams) {
        this.reset()
        this.params = params
        setTimeout(() => {
            this.nzContextMenuService.create(
                this.makeMouseEvent(params),
                this.summaryView
            )
        }, 100)
    }
    
    private makeMouseEvent(params: PopupTriggeredParams): MouseEvent {
        return <any>{
            preventDefault: () => false,
            x: params.position.x,
            y: params.position.y
        }
    }
    
    private reset() {
        this.params = null
        this.modalAction = null
    }
}
