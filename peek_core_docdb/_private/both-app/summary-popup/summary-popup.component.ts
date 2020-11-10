import { Component, ViewChild, ChangeDetectionStrategy } from "@angular/core"
import { DocDbPopupActionI, DocDbPopupTypeE } from "@peek/peek_core_docdb/DocDbPopupService"
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_core_docdb/_private/services/PrivateDocDbPopupService"
import { NzContextMenuService } from "ng-zorro-antd/dropdown"
import { DocDbPopupClosedReasonE, DocDbPopupDetailI } from "@peek/peek_core_docdb"
import { BehaviorSubject } from "rxjs"

// This is a root/global component
@Component({
    selector: "plugin-docdb-popup-summary-popup",
    templateUrl: "summary-popup.component.html",
    styleUrls: ["summary-popup.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SummaryPopupComponent {
    @ViewChild("summaryView", {static: true})
    summaryView: any
    
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
            .showSummaryPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v))
        
        this.popupService
            .hideSummaryPopupSubject
            .subscribe(() => this.closePopup(DocDbPopupClosedReasonE.closedByApiCall))
    }
    
    closePopup(reason: DocDbPopupClosedReasonE): void {
        if (this.params == null) {
            return
        }
        
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
    
    closeModal(): void {
        this.modalAction = null
    }
    
    modalChildActions(): DocDbPopupActionI[] {
        return this.modalAction == null ? [] : this.modalAction.children
    }
    
    protected openPopup(params: PopupTriggeredParams) {
        this.reset()
        
        setTimeout(() => {
            this.params = params
            this.nzContextMenuService.create(
                this.makeMouseEvent(params),
                this.summaryView
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
    
    private reset() {
        this.params = null
        this.modalAction = null
    }
}
