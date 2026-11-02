import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReportsReviewPage } from './reports-review.page';

describe('ReportsReviewPage', () => {
  let component: ReportsReviewPage;
  let fixture: ComponentFixture<ReportsReviewPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(ReportsReviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
