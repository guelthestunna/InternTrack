import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SupervisorLayoutPage } from './supervisor-layout.page';

describe('SupervisorLayoutPage', () => {
  let component: SupervisorLayoutPage;
  let fixture: ComponentFixture<SupervisorLayoutPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(SupervisorLayoutPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
