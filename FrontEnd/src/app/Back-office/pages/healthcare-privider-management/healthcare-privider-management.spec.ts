import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HealthcarePrividerManagement } from './healthcare-privider-management';

describe('HealthcarePrividerManagement', () => {
  let component: HealthcarePrividerManagement;
  let fixture: ComponentFixture<HealthcarePrividerManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HealthcarePrividerManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HealthcarePrividerManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
