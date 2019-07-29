import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {TooltipPopupComponent} from "./tooltip-popup/tooltip-popup.component";
import {NzDropDownModule} from 'ng-zorro-antd/dropdown';
import {AngularFontAwesomeModule} from "angular-font-awesome";
import {NzTableModule} from 'ng-zorro-antd/table';
import {SummaryPopupComponent} from "./summary-popup/summary-popup.component";
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import {DetailPopupComponent} from "./detail-popup/detail-popup.component";
@NgModule({
    imports: [
        CommonModule,
        NzDropDownModule,
        NzTableModule,
        NzToolTipModule,
        NzButtonModule,
        NzCardModule,
        NzMenuModule,
        NzModalModule,
        AngularFontAwesomeModule
    ],
    exports: [TooltipPopupComponent, SummaryPopupComponent, DetailPopupComponent],
    providers: [],
    declarations: [TooltipPopupComponent, SummaryPopupComponent, DetailPopupComponent]
})
export class DocDbPopupModule {
}
