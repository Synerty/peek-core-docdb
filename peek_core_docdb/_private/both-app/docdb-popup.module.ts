import { CommonModule } from "@angular/common"
import { HttpClientModule } from "@angular/common/http"
import { NgModule } from "@angular/core"
import { TooltipPopupComponent } from "./tooltip-popup/tooltip-popup.component"
import { NzDropDownModule } from "ng-zorro-antd/dropdown"
import { NzIconModule } from "ng-zorro-antd/icon"
import { NzTableModule } from "ng-zorro-antd/table"
import { SummaryPopupComponent } from "./summary-popup/summary-popup.component"
import { NzToolTipModule } from "ng-zorro-antd/tooltip"
import { NzButtonModule } from "ng-zorro-antd/button"
import { NzCardModule } from "ng-zorro-antd/card"
import { NzMenuModule } from "ng-zorro-antd/menu"
import { NzModalModule } from "ng-zorro-antd/modal"
import { DetailPopupComponent } from "./detail-popup/detail-popup.component"

@NgModule({
    declarations: [
        TooltipPopupComponent,
        SummaryPopupComponent,
        DetailPopupComponent,
    ],
    imports: [
        CommonModule,
        HttpClientModule,
        NzDropDownModule,
        NzTableModule,
        NzToolTipModule,
        NzButtonModule,
        NzCardModule,
        NzMenuModule,
        NzModalModule,
        NzIconModule,
    ],
    exports: [
        TooltipPopupComponent,
        SummaryPopupComponent,
        DetailPopupComponent,
    ],
})
export class DocDbPopupModule {
}
