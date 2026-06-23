import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PatientReservations } from './patient-reservations';

describe('PatientReservations', () => {
  let component: PatientReservations;
  let fixture: ComponentFixture<PatientReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PatientReservations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PatientReservations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
