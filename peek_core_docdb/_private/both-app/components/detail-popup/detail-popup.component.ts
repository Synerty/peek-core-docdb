import { Component, ViewChild, ChangeDetectionStrategy } from "@angular/core"
import { DocDbPopupActionI, DocDbPopupTypeE } from "@peek/peek_core_docdb"
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_core_docdb/_private/services/PrivateDocDbPopupService"
import { NzContextMenuService } from "ng-zorro-antd/dropdown"
import { DocDbPopupClosedReasonE, DocDbPopupDetailI } from "@peek/peek_core_docdb"
import { BehaviorSubject } from "rxjs"
import { DOCDB_DETAIL_POPUP } from "@peek/peek_core_docdb/constants"

// This is a root/global component
@Component({
    selector: "plugin-docdb-popup-detail-popup",
    templateUrl: "detail-popup.component.html",
    styleUrls: ["detail-popup.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DetailPopupComponent {
    DOCDB_DETAIL_POPUP = DOCDB_DETAIL_POPUP
    
    @ViewChild("detailView", {static: true})
    detailView: any
    
    params$ = new BehaviorSubject<PopupTriggeredParams>(null)
    modalAction$ = new BehaviorSubject<DocDbPopupActionI>(null)
    
    get params() {
        return this.params$.getValue()
    }
    
    set params(value) {
        this.params$.next(value)
    }
    
    get modalAction() {
        return this.modalAction$.getValue()
    }
    
    set modalAction(value) {
        this.modalAction$.next(value)
    }
    
    constructor(
        private nzContextMenuService: NzContextMenuService,
        private popupService: PrivateDocDbPopupService,
    ) {
        this.popupService
            .showDetailPopupSubject
            .subscribe((params: PopupTriggeredParams) => this.openPopup(params))
        
        this.popupService
            .hideDetailPopupSubject
            .subscribe(() => this.closePopup())
    }
    
    closePopup(): void {
        if (!this.params) {
            return
        }
        
        this.params = null
        this.popupService.hidePopupWithReason(
            DocDbPopupTypeE.detailPopup,
            DocDbPopupClosedReasonE.closedByApiCall
        )
        this.nzContextMenuService.close()
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
            this.closePopup()
        }
    }
    
    modalName(): string {
        if (this.modalAction == null) {
            return null
        }
        
        return this.modalAction.name || this.modalAction.tooltip
    }
    
    closeModal(): void {
        this.modalAction = null
    }
    
    modalChildActions(): DocDbPopupActionI[] {
        return this.modalAction == null ? [] : this.modalAction.children
    }
    
    protected openPopup(params: PopupTriggeredParams) {
        // this.reset()

        setTimeout(() => {
            this.params = params
            this.nzContextMenuService.create(
                this.makeMouseEvent(params),
                this.detailView
            )
        }, 100)
    }
    
    private makeMouseEvent(params) {
        let x = 0
        let y = 0
        
        if (params.position.changedTouches) {
            x = params.position.changedTouches[0].clientX
            y = params.position.changedTouches[0].clientY
        }
        else {
           x = params.position.x,
           y = params.position.y
        }
        
        return <any>{
            preventDefault: () => false,
            x,
            y
        }
    }
}
