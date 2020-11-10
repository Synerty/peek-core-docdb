import { Component, ViewChild, ChangeDetectionStrategy } from "@angular/core"
import { NzContextMenuService } from "ng-zorro-antd/dropdown"
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_core_docdb/_private/services/PrivateDocDbPopupService"
import { DocDbPopupDetailI } from "@peek/peek_core_docdb"
import { BehaviorSubject } from "rxjs"

@Component({
    selector: "plugin-docdb-popup-tooltip-popup",
    templateUrl: "tooltip-popup.component.html",
    styleUrls: ["tooltip-popup.component.scss"],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipPopupComponent {
    @ViewChild("tooltipView", {static: true})
    tooltipView: any
    
    params$ = new BehaviorSubject<PopupTriggeredParams>(null)
    
    get params() {
        return this.params$.getValue()
    }
    
    set params(value) {
        this.params$.next(value)
    }
    
    constructor(
        private nzContextMenuService: NzContextMenuService,
        private popupService: PrivateDocDbPopupService,
    ) {
        this.popupService
            .showTooltipPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v))
        
        this.popupService
            .hideTooltipPopupSubject
            .subscribe(() => this.closePopup())
    }
    
    closePopup(): void {
        this.nzContextMenuService.close()
        this.params = null
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
        return this.params.details
            .filter(d => !d.showInHeader)
    }
    
    showPopup(): boolean {
        return this.params != null
    }
    
    protected openPopup(params: PopupTriggeredParams) {
        this.params = params
        this.nzContextMenuService.create(<any>{
            preventDefault: () => false,
            x: params.position.x,
            y: params.position.y
        }, this.tooltipView)
    }
}
