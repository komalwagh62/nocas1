import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UsersHomeComponent } from './Users/users-home/users-home.component';
import { UsersRegisterComponent } from './Users/users-register/users-register.component';
import { UsersLoginComponent } from './Users/users-login/users-login.component';
import { UsersProfileComponent } from './Users/users-profile/users-profile.component';
import { UsersPricingPlansComponent } from './Users/users-pricing-plans/users-pricing-plans.component';
import { UsersNOCASComponent } from './Users/users-nocas/users-nocas.component';
import { ForgotPasswordComponent } from './Users/forgot-password/forgot-password.component';
import { UsersrequestServiceComponent } from './Users/usersrequest-service/usersrequest-service.component';
import { TransactionDetailsComponent } from './Users/transaction-details/transaction-details.component';
import { FooterComponent } from './Users/Shared/footer/footer.component';
import { FormsModule } from '@angular/forms';

const routes: Routes = [
  { path: '', redirectTo: 'UsersLogin', pathMatch: 'full' }, 
  { path: 'UsersHome', component: UsersHomeComponent },
  { path: 'UsersRegister', component: UsersRegisterComponent },
  { path: 'UsersLogin', component: UsersLoginComponent },
  { path: 'UsersProfile', component: UsersProfileComponent },
  { path: 'PricingPlans', component: UsersPricingPlansComponent },
  { path: 'C_NOCAS-MAP', component: UsersNOCASComponent },
  { path: 'forgot-pass', component: ForgotPasswordComponent },
  { path: 'request-Service', component: UsersrequestServiceComponent },
  { path: 'TransactionDetails', component: TransactionDetailsComponent },
  { path: 'FooterComponent', component: FooterComponent },
];
@NgModule({
  imports: [RouterModule.forRoot(routes),FormsModule],
  exports: [RouterModule]
})
export class AppRoutingModule { }
