import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersEditUpdateComponent } from './users-edit-update.component';

describe('UsersEditUpdateComponent', () => {
  let component: UsersEditUpdateComponent;
  let fixture: ComponentFixture<UsersEditUpdateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UsersEditUpdateComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(UsersEditUpdateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
