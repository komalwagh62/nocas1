import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersHomeComponent } from './Users/users-home/users-home.component';
import { UsersRegisterComponent } from './Users/users-register/users-register.component';
import { UsersLoginComponent } from './Users/users-login/users-login.component';
import { UsersProfileComponent } from './Users/users-profile/users-profile.component';
import { UsersPricingPlansComponent } from './Users/users-pricing-plans/users-pricing-plans.component';
// import { PermissibleHeight } from './Users/permissible-height/permissible-height.component';
import { UsersNOCASComponent } from './Users/users-nocas/users-nocas.component';
import { ForgotPasswordComponent } from './Users/forgot-password/forgot-password.component';
import { UsersrequestServiceComponent } from './Users/usersrequest-service/usersrequest-service.component';
import { PaymentReceiptComponent } from './payment-receipt/payment-receipt.component';
import { TransactionDetailsComponent } from './Users/transaction-details/transaction-details.component';
import { FooterComponent } from './Users/Shared/footer/footer.component';
import { AdminLoginComponent } from './Admin/admin-login/admin-login.component';
import { DashboardComponent } from './Admin/dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: 'UsersLogin', pathMatch: 'full' }, 
  { path: 'UsersHome', component: UsersHomeComponent },
  { path: 'UsersRegister', component: UsersRegisterComponent },
  { path: 'UsersLogin', component: UsersLoginComponent },
  { path: 'UsersProfile', component: UsersProfileComponent },
  { path: 'PricingPlans', component: UsersPricingPlansComponent },
  // {path:'permissible-height',component:PermissibleHeight},
  { path: 'C_NOCAS-MAP', component: UsersNOCASComponent },
  { path: 'forgot-pass', component: ForgotPasswordComponent },
  { path: 'request-Service', component: UsersrequestServiceComponent },
  { path: 'PaymentReceipt', component: PaymentReceiptComponent },
  { path: 'TransactionDetails', component: TransactionDetailsComponent },
  { path: 'FooterComponent', component: FooterComponent }, // Assuming FooterComponent is a separate page
  {path: 'Admin', component: AdminLoginComponent},
  {path:'AdminDashboard', component:DashboardComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
