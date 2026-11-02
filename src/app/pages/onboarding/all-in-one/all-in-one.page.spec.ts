import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AllInOnePage } from './all-in-one.page';

describe('AllInOnePage', () => {
  let component: AllInOnePage;
  let fixture: ComponentFixture<AllInOnePage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(AllInOnePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
