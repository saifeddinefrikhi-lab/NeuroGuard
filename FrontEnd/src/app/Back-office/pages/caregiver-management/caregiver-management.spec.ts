import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CaregiverManagement } from './caregiver-management';

describe('CaregiverManagement', () => {
  let component: CaregiverManagement;
  let fixture: ComponentFixture<CaregiverManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CaregiverManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CaregiverManagement);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
