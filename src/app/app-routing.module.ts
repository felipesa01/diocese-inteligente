import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { BcMainContainerComponent } from "./applications/base-cartografica/bc-main-container/bc-main-container.component";
import { CultMainComponent } from "./applications/cultura/cult-main/cult-main.component";
import { MonapMainContainerComponent } from "./applications/monitor-areas-publicas/monap-main-container/monap-main-container.component";
import { ZelaMainComponent } from "./applications/zeladoria/zela-main/zela-main.component";
import { MainContainerComponent } from "./components/main-container/main-container.component";
import { ToolboxComponent } from "./components/main-container/map/toolbox/toolbox.component";
import { AuthGuard } from "./services/auth-guard.service";
import { DioceseMainComponent } from "./applications/diocese-main/diocese-main.component";

const appRoutes: Routes = [
    {
        path: '',
        component: DioceseMainComponent,
        // canActivate: [AuthGuard]
    },
    // {
    //     path: 'map',
    //     component: MainContainerComponent,
    //     canActivate: [AuthGuard],
    // },
    // {
    //     path: 'areaspublicas',
    //     component: MonapMainContainerComponent,
    //     canActivate: [AuthGuard]
    // },
    // {
    //     path: 'zeladoria',
    //     component: ZelaMainComponent,
    //     canActivate: [AuthGuard]
    // },
    // {
    //     path: 'cultura',
    //     component: CultMainComponent,
    //     canActivate: [AuthGuard]
    // }
]

@NgModule({
  imports: [RouterModule.forRoot(appRoutes, {useHash : true})],
  exports: [RouterModule]
})
export class AppRoutingModule { }