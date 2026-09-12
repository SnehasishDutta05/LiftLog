import {
  Component,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  Router,
} from '@angular/router';


interface MealSection {
  name: string;
  icon: string;
  targetCalories: number;
  eatenCalories: number;
}


@Component({
  selector: 'app-healthify',

  imports: [
    FormsModule,
  ],

  templateUrl:
    './healthify.html',

  styleUrl:
    './healthify.css',
})
export class Healthify {


  /* =====================================================
     DAILY CALORIE DATA
  ===================================================== */

  calorieGoal =
    Number(
      localStorage.getItem(
        'pulseos_calorie_goal',
      ),
    ) || 2000;


  caloriesEaten = 0;


  protein = 0;

  carbs = 0;

  fats = 0;


  /* =====================================================
     CALORIE GOAL MODAL
  ===================================================== */

  showGoalModal = false;


  calorieGoalInput =
    this.calorieGoal;


  /* =====================================================
     MEALS
  ===================================================== */

  meals: MealSection[] = [

    {
      name: 'Breakfast',
      icon: '☀️',
      targetCalories: 500,
      eatenCalories: 0,
    },

    {
      name: 'Morning Snack',
      icon: '🍃',
      targetCalories: 250,
      eatenCalories: 0,
    },

    {
      name: 'Lunch',
      icon: '🍴',
      targetCalories: 600,
      eatenCalories: 0,
    },

    {
      name: 'Evening Snack',
      icon: '🍎',
      targetCalories: 250,
      eatenCalories: 0,
    },

    {
      name: 'Dinner',
      icon: '🌙',
      targetCalories: 400,
      eatenCalories: 0,
    },

  ];


  constructor(
    private router: Router,
  ) {}


  /* =====================================================
     CALORIES LEFT
  ===================================================== */

  get caloriesLeft(): number {

    return Math.max(
      0,
      this.calorieGoal -
      this.caloriesEaten,
    );

  }


  /* =====================================================
     CALORIE RING PROGRESS
  ===================================================== */

  get calorieProgress(): number {

    if (
      this.calorieGoal <= 0
    ) {

      return 0;

    }


    const percentage =
      (
        this.caloriesEaten /
        this.calorieGoal
      ) * 100;


    return Math.min(
      100,
      Math.max(
        0,
        percentage,
      ),
    );

  }


  /* =====================================================
     TODAY DATE
  ===================================================== */

  get todayLabel(): string {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      },
    ).format(
      new Date(),
    );

  }


  /* =====================================================
     CALORIE GOAL
  ===================================================== */

  openGoalModal(): void {

    this.calorieGoalInput =
      this.calorieGoal;


    this.showGoalModal =
      true;

  }


  closeGoalModal(): void {

    this.showGoalModal =
      false;

  }


  saveCalorieGoal(): void {

    const newGoal =
      Number(
        this.calorieGoalInput,
      );


    if (
      !Number.isFinite(newGoal) ||
      newGoal < 500 ||
      newGoal > 10000
    ) {

      window.alert(
        'Enter a calorie goal between 500 and 10,000 calories.',
      );


      return;

    }


    this.calorieGoal =
      Math.round(
        newGoal,
      );


    localStorage.setItem(
      'pulseos_calorie_goal',

      String(
        this.calorieGoal,
      ),
    );


    this.closeGoalModal();

  }


  /* =====================================================
     FOOD

     FoodData Central search comes next.
  ===================================================== */

  addFood(
    meal: MealSection,
  ): void {

    console.log(
      `Add food to ${meal.name}`,
    );

  }


  /* =====================================================
     SETTINGS
  ===================================================== */

  openSettings(): void {

    window.alert(
      'Nutrition settings will be connected next.',
    );

  }


  /* =====================================================
     NAVIGATION
  ===================================================== */

  goToWorkouts(): void {

    this.router.navigate([
      '/dashboard',
    ]);

  }


  goToHealthify(): void {

    this.router.navigate([
      '/healthify',
    ]);

  }


  goToProfile(): void {

    this.router.navigate([
      '/profile',
    ]);

  }

}