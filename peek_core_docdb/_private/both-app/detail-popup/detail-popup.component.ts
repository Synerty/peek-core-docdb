import { Component, ViewChild } from "@angular/core"
import { DocDbPopupActionI, DocDbPopupTypeE } from "@peek/peek_core_docdb/DocDbPopupService"
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_core_docdb/_private/services/PrivateDocDbPopupService"
import { NzContextMenuService } from "ng-zorro-antd/dropdown"
import { DocDbPopupClosedReasonE, DocDbPopupDetailI } from "@peek/peek_core_docdb"

// This is a root/global component
@Component({
    selector: "plugin-docdb-popup-detail-popup",
    templateUrl: "detail-popup.component.html",
    styleUrls: ["detail-popup.component.scss"]
})
export class DetailPopupComponent {
    @ViewChild("detailView", {static: true}) detailView
    
    params: PopupTriggeredParams | null = null
    modalAction: DocDbPopupActionI | null = null
    
    constructor(
        private nzContextMenuService: NzContextMenuService,
        private popupService: PrivateDocDbPopupService,
    ) {
        this.popupService
            .showDetailPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v))
        
        this.popupService
            .hideDetailPopupSubject
            .subscribe(() => this.closePopup(DocDbPopupClosedReasonE.closedByApiCall))
    }
    
    closePopup(reason: DocDbPopupClosedReasonE): void {
        if (this.params == null) {
            return
        }
        
        this.nzContextMenuService.close()
        this.reset()
        this.popupService.hidePopupWithReason(DocDbPopupTypeE.detailPopup, reason)
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
        
        item.callback()
        
        if (
            item.closeOnCallback == null
            || item.closeOnCallback === true
        ) {
            this.closePopup(DocDbPopupClosedReasonE.userClickedAction)
        }
    }
    
    modalName(): string {
        if (this.modalAction == null) {
            return null
        }
        
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
        return (
            this.params != null
            && (this.params.details.length != 0 || this.params.actions.length != 0)
        )
    }
    
    protected openPopup(params: PopupTriggeredParams) {
        this.reset()
        this.params = params
        
        setTimeout(() => {
            this.nzContextMenuService.create(
                this.makeMouseEvent(params),
                this.detailView
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
