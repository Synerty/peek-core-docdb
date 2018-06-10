import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgModule} from "@angular/core";
import {Routes, RouterModule} from "@angular/router";
import {ViewDocumentComponent} from "./view-document/view-document";
import {EditSettingComponent} from "./edit-setting-table/edit.component";


// Import our components
import {DocDbComponent} from "./docDb.component";

// Define the routes for this Angular module
export const pluginRoutes: Routes = [
    {
        path: '',
        component: DocDbComponent
    }

];

// Define the module
@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(pluginRoutes),
        FormsModule
    ],
    exports: [],
    providers: [],
    declarations: [DocDbComponent, ViewDocumentComponent, EditSettingComponent]
})
export class DocDbModule {

}
