import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ActiveWorkout } from './active-workout';

describe('ActiveWorkout', () => {
  let component: ActiveWorkout;
  let fixture: ComponentFixture<ActiveWorkout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ActiveWorkout],
    }).compileComponents();

    fixture = TestBed.createComponent(ActiveWorkout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
