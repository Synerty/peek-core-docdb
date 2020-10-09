import {Component, ViewChild} from "@angular/core";
import {NzContextMenuService} from "ng-zorro-antd";

import * as $ from "jquery";
import {
    PopupTriggeredParams,
    PrivateDocDbPopupService
} from "@peek/peek_plugin_docdb/_private/services/PrivateDocDbPopupService";
import {DocDbPopupDetailI} from "@peek/peek_plugin_docdb";


@Component({
    selector: 'plugin-docdb-popup-tooltip-popup',
    templateUrl: 'tooltip-popup.component.web.html',
    styleUrls: ['tooltip-popup.component.web.scss'],
    moduleId: module.id
})
export class TooltipPopupComponent { // This is a root/global component

    @ViewChild('tooltipView', {static: true}) tooltipView;


    params: PopupTriggeredParams | null = null;

    constructor(private nzContextMenuService: NzContextMenuService,
                private popupService: PrivateDocDbPopupService) {

        this.popupService
            .showTooltipPopupSubject
            .subscribe((v: PopupTriggeredParams) => this.openPopup(v));

        this.popupService
            .hideTooltipPopupSubject
            .subscribe(() => this.closePopup());

    }


    protected openPopup(params: PopupTriggeredParams) {
        this.params = params;

        this.nzContextMenuService.create(<any>{
            preventDefault: () => false,
            x: params.position.x,
            y: params.position.y
        }, this.tooltipView);

        setTimeout(() => {
            // This is a tooltip, So make it transparent to the mouse
            $('#peek-plugin-docdb-popup-summary-mouse-events')
                .parents('.cdk-overlay-pane.nz-dropdown-panel')
                .css("pointer-events", 'none');
        }, 50);

    }

    closePopup(): void {
        this.nzContextMenuService.close();

        // Discard the integration additions
        this.params = null;
    }

    headerDetails(): string {
        return this.params.details
            .filter(d => d.showInHeader)
            .map(d => d.value)
            .join(', ');
    }

    hasBodyDetails() :boolean  {
        return this.bodyDetails().length != 0;
    }

    bodyDetails(): DocDbPopupDetailI[] {
        return this.params.details.filter(d => !d.showInHeader);
    }

    showPopup():boolean {
        return this.params != null && this.params.details.length != 0;
    }


}
