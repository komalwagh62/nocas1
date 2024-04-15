import { ComponentFixture, TestBed } from '@angular/core/testing';

import { permissibleHeight } from './permissible-height.component';

describe('HomeComponent', () => {
  let component: permissibleHeight;
  let fixture: ComponentFixture<permissibleHeight>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [permissibleHeight]
    });
    fixture = TestBed.createComponent(permissibleHeight);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
