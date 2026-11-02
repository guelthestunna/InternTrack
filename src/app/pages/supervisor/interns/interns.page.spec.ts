import { ComponentFixture, TestBed } from '@angular/core/testing';
import { InternsPage } from './interns.page';

describe('InternsPage', () => {
  let component: InternsPage;
  let fixture: ComponentFixture<InternsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(InternsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
