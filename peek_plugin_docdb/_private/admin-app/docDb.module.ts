import {CommonModule} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {NgModule} from "@angular/core";
import {RouterModule, Routes} from "@angular/router";
import {ViewDocumentComponent} from "./view-document/view-document";
import {EditSettingComponent} from "./edit-setting-table/edit.component";
import {StatusComponent} from "./status/status.component";
// Import our components
import {DocDbComponent} from "./docDb.component";
import {
    TupleActionPushNameService,
    TupleActionPushService,
    TupleDataObservableNameService,
    TupleDataObserverService,
    TupleDataOfflineObserverService,
    TupleOfflineStorageNameService,
    TupleOfflineStorageService
} from "@synerty/vortexjs";

import {
    docDbActionProcessorName,
    docDbFilt,
    docDbObservableName,
    docDbTupleOfflineServiceName
} from "@peek/peek_plugin_docdb/_private";


export function tupleActionPushNameServiceFactory() {
    return new TupleActionPushNameService(
        docDbActionProcessorName, docDbFilt);
}

export function tupleDataObservableNameServiceFactory() {
    return new TupleDataObservableNameService(
        docDbObservableName, docDbFilt);
}

export function tupleOfflineStorageNameServiceFactory() {
    return new TupleOfflineStorageNameService(docDbTupleOfflineServiceName);
}

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
    providers: [
        TupleActionPushService, {
            provide: TupleActionPushNameService,
            useFactory: tupleActionPushNameServiceFactory
        },
        TupleOfflineStorageService, {
            provide: TupleOfflineStorageNameService,
            useFactory: tupleOfflineStorageNameServiceFactory
        },
        TupleDataObserverService, TupleDataOfflineObserverService, {
            provide: TupleDataObservableNameService,
            useFactory: tupleDataObservableNameServiceFactory
        },
    ],
    declarations: [DocDbComponent, ViewDocumentComponent, EditSettingComponent, StatusComponent]
})
export class DocDbModule {

}
