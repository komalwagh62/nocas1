import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { UsersSideNavComponent } from './Users/users-side-nav/users-side-nav.component';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCommonModule, MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FooterComponent } from './Users/Shared/footer/footer.component';
import { BannerComponent } from './Users/Shared/banner/banner.component';
import { UsersHomeComponent } from './Users/users-home/users-home.component';
import { UsersPricingPlansComponent } from './Users/users-pricing-plans/users-pricing-plans.component';
// import { PermissibleHeight } from './Users/permissible-height/permissible-height.component';
import { UsersEditUpdateComponent } from './Users/users-edit-update/users-edit-update.component';
import { UsersNOCASComponent } from './Users/users-nocas/users-nocas.component';
import { ForgotPasswordComponent } from './Users/forgot-password/forgot-password.component';
import { UsersrequestServiceComponent } from './Users/usersrequest-service/usersrequest-service.component';
import { MatRadioModule } from '@angular/material/radio';
import { MatGridListModule } from '@angular/material/grid-list';
import { UsersLoginComponent } from './Users/users-login/users-login.component';
import { UsersProfileComponent } from './Users/users-profile/users-profile.component';
import { UsersRegisterComponent } from './Users/users-register/users-register.component';
import { PaymentReceiptComponent } from './payment-receipt/payment-receipt.component';
import { TransactionDetailsComponent } from './Users/transaction-details/transaction-details.component';
import { MatTableModule } from '@angular/material/table';
import { AdminLoginComponent } from './Admin/admin-login/admin-login.component';
import { DashboardComponent } from './Admin/dashboard/dashboard.component';
import { MatPaginator,MatPaginatorModule } from '@angular/material/paginator';
import { DmsPipe } from './dms.pipe';

@NgModule({
  declarations: [
    AppComponent,
    UsersProfileComponent,
    UsersLoginComponent,
    UsersRegisterComponent,
    UsersSideNavComponent,
    FooterComponent,
    BannerComponent,
    UsersHomeComponent,
    UsersPricingPlansComponent,
    // PermissibleHeight,
    UsersEditUpdateComponent,
    UsersNOCASComponent,
    ForgotPasswordComponent,
    UsersrequestServiceComponent,
    PaymentReceiptComponent,
    TransactionDetailsComponent,
    AdminLoginComponent,
    DashboardComponent,
    DmsPipe,
   
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    MatTabsModule,
    MatDatepickerModule,
    MatSidenavModule,
    MatAutocompleteModule,
    MatMenuModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatCommonModule,
    MatNativeDateModule,
    MatIconModule,
    MatListModule,
    MatToolbarModule,
    FormsModule, // Import FormsModule
    ReactiveFormsModule, // Import ReactiveFormsModule
    MatCardModule,
    MatDialogModule,
    MatInputModule,
    MatSelectModule,
    HttpClientModule,
    MatFormFieldModule,
    MatDividerModule,
    MatRadioModule,
    MatGridListModule,
    MatTableModule, 
    MatPaginator,
    MatPaginatorModule,
    
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }



