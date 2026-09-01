import {
  Component,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';

import {
  EXDB,
} from '../../core/data/exercises-data';


interface ExerciseRecord {
  id: string;
  n: string;
  bp: string;
  eq: string;
  tg: string;
  mg?: string;
  sm?: string[];
  st?: string[];
  img?: string;
  gif?: string;
}


@Component({
  selector: 'app-exercise-picker',
  imports: [
    FormsModule,
  ],
  templateUrl: './exercise-picker.html',
  styleUrl: './exercise-picker.css',
})
export class ExercisePicker {

  searchTerm = '';

  selectedEquipment =
    'All Equipment';

  selectedMuscle =
    'All Muscles';

  showEquipmentMenu =
    false;

  showMuscleMenu =
    false;

  selectedExerciseIds =
    new Set<string>();


  exercises:
    ExerciseRecord[] =
    EXDB as ExerciseRecord[];


  constructor(
    private router: Router,
  ) {}


  get equipmentOptions():
    string[] {

    return [
      'All Equipment',
      ...[
        ...new Set(
          this.exercises
            .map(
              exercise =>
                exercise.eq,
            )
            .filter(Boolean),
        ),
      ].sort(),
    ];

  }


  get muscleOptions():
    string[] {

    return [
      'All Muscles',
      ...[
        ...new Set(
          this.exercises
            .map(
              exercise =>
                exercise.tg,
            )
            .filter(Boolean),
        ),
      ].sort(),
    ];

  }


  get filteredExercises():
    ExerciseRecord[] {

    const query =
      this.searchTerm
        .trim()
        .toLowerCase();


    return this.exercises.filter(
      exercise => {

        const matchesSearch =
          !query ||
          exercise.n
            .toLowerCase()
            .includes(query) ||
          exercise.bp
            .toLowerCase()
            .includes(query) ||
          exercise.tg
            .toLowerCase()
            .includes(query) ||
          exercise.eq
            .toLowerCase()
            .includes(query);


        const matchesEquipment =
          this.selectedEquipment ===
            'All Equipment' ||
          exercise.eq ===
            this.selectedEquipment;


        const matchesMuscle =
          this.selectedMuscle ===
            'All Muscles' ||
          exercise.tg ===
            this.selectedMuscle;


        return (
          matchesSearch &&
          matchesEquipment &&
          matchesMuscle
        );

      },
    );

  }


  get selectedCount(): number {

    return this
      .selectedExerciseIds
      .size;

  }


  isSelected(
    id: string,
  ): boolean {

    return this
      .selectedExerciseIds
      .has(id);

  }


  toggleExercise(
    exercise: ExerciseRecord,
  ): void {

    if (
      this.selectedExerciseIds
        .has(exercise.id)
    ) {

      this.selectedExerciseIds
        .delete(exercise.id);

      return;

    }


    this.selectedExerciseIds
      .add(exercise.id);

  }


  toggleEquipmentMenu(): void {

    this.showEquipmentMenu =
      !this.showEquipmentMenu;

    this.showMuscleMenu =
      false;

  }


  selectEquipment(
    equipment: string,
  ): void {

    this.selectedEquipment =
      equipment;

    this.showEquipmentMenu =
      false;

  }


  toggleMuscleMenu(): void {

    this.showMuscleMenu =
      !this.showMuscleMenu;

    this.showEquipmentMenu =
      false;

  }


  selectMuscle(
    muscle: string,
  ): void {

    this.selectedMuscle =
      muscle;

    this.showMuscleMenu =
      false;

  }


  cancel(): void {

    this.router.navigate([
      '/active-workout',
    ]);

  }


  addSelectedExercises(): void {

    if (
      this.selectedCount === 0
    ) {
      return;
    }


    const selected =
      this.exercises.filter(
        exercise =>
          this.selectedExerciseIds
            .has(exercise.id),
      );


    localStorage.setItem(
      'pulseos_selected_exercises',
      JSON.stringify(selected),
    );


    this.router.navigate([
      '/active-workout',
    ]);

  }

}