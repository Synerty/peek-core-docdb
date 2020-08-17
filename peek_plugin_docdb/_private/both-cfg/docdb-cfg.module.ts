import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {Routes} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
// Import the default route component
import {DocdbCfgComponent} from "./docdb-cfg.component";
// Import global modules, for example, the canvas extensions.


// Define the child routes for this plugin
export const pluginRoutes: Routes = [
    // {
    //     path: 'showDiagram',
    //     component: DocdbCfgComponent
    // },
    {
        path: '',
        pathMatch: 'full',
        component: DocdbCfgComponent
    }

];

// Define the root module for this plugin.
// This module is loaded by the lazy loader, what ever this defines is what is started.
// When it first loads, it will look up the routs and then select the component to load.
@NgModule({
    imports: [
        CommonModule,
        RouterModule.forChild(pluginRoutes),
        FormsModule,
        FontAwesomeModule,
    ],
    exports: [],
    providers: [],
    declarations: [DocdbCfgComponent]
})
export class DocDBCfgModule { }

