import {CommonModule} from "@angular/common";
import {NgModule} from "@angular/core";
import {Routes} from "@angular/router";
import {FormsModule} from "@angular/forms";
import {FontAwesomeModule} from "@fortawesome/angular-fontawesome";
import {RouterModule} from "@angular/router";
import {DocDbPopupComponent} from "./debug-page.component";


// Define the child routes for this plugin
export const pluginRoutes: Routes = [
    {
        path: '',
        pathMatch: 'full',
        component: DocDbPopupComponent
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
    declarations: [DocDbPopupComponent]
})
export class DocDbPopupDebugModule {
}
