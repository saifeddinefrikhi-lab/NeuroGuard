import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProviderReservations } from './provider-reservations';

describe('ProviderReservations', () => {
  let component: ProviderReservations;
  let fixture: ComponentFixture<ProviderReservations>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProviderReservations]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProviderReservations);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
