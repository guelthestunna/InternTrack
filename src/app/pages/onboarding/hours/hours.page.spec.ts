import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HoursPage } from './hours.page';

describe('HoursPage', () => {
  let component: HoursPage;
  let fixture: ComponentFixture<HoursPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(HoursPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
