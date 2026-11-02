import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DtrPage } from './dtr.page';

describe('DtrPage', () => {
  let component: DtrPage;
  let fixture: ComponentFixture<DtrPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(DtrPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
