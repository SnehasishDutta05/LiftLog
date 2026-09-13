import {
  Component,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  Router,
} from '@angular/router';

import {
  FoodDetails,
  FoodSearchItem,
  FoodServing,
  NutritionService,
  NutritionGoals,
  DietLogItem,
  DietLogMeal,
  DietLogRequest,
  DietLogRequestItem,
  DietLogResponse,
} from '../../services/nutrition.service';


interface MealSection {
  name: string;

  icon: string;

  targetCalories: number;

  eatenCalories: number;

  items: DietLogItem[];
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
export class Healthify
implements OnInit {


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
     CURRENT DIET LOG
  ===================================================== */

  currentLog:
    DietLogResponse | null =
    null;


  /* =====================================================
     API STATE
  ===================================================== */

  isLoadingNutrition =
    false;


  nutritionLoadError =
    false;


  isSavingFood =
    false;


  foodSaveError =
    '';


  /* =====================================================
     CALORIE GOAL MODAL
  ===================================================== */

  showGoalModal =
    false;


  calorieGoalInput =
    this.calorieGoal;


  /* =====================================================
     FOOD SEARCH
  ===================================================== */

  showFoodSearch =
    false;


  selectedMeal:
    MealSection | null =
    null;


  foodSearchQuery =
    '';


  foodSearchResults:
    FoodSearchItem[] =
    [];


  foodSearchLoading =
    false;


  foodSearchError =
    '';


  foodSearchPage =
    1;


  foodSearchTotal =
    0;


  readonly foodSearchPageSize =
    20;


  /* =====================================================
     FOOD DETAILS
  ===================================================== */

  selectedFood:
    FoodDetails | null =
    null;


  selectedServing:
    FoodServing | null =
    null;


  foodDetailsLoading =
    false;


  /* =====================================================
     MEALS
  ===================================================== */

  meals: MealSection[] = [

    {
      name: 'Breakfast',
      icon: '☀️',
      targetCalories: 500,
      eatenCalories: 0,
      items: [],
    },

    {
      name: 'Morning Snack',
      icon: '🍃',
      targetCalories: 250,
      eatenCalories: 0,
      items: [],
    },

    {
      name: 'Lunch',
      icon: '🍴',
      targetCalories: 600,
      eatenCalories: 0,
      items: [],
    },

    {
      name: 'Evening Snack',
      icon: '🍎',
      targetCalories: 250,
      eatenCalories: 0,
      items: [],
    },

    {
      name: 'Dinner',
      icon: '🌙',
      targetCalories: 400,
      eatenCalories: 0,
      items: [],
    },

  ];


  constructor(
    private router:
      Router,

    private nutritionService:
      NutritionService,
  ) {}


  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {

    this.loadNutritionData();

  }


  /* =====================================================
     LOAD NUTRITION
  ===================================================== */

  private loadNutritionData(): void {

    this.isLoadingNutrition =
      true;


    this.nutritionLoadError =
      false;


    this.loadGoals();

    this.loadLogs();

  }


  /* =====================================================
     LOAD GOALS
  ===================================================== */

  private loadGoals(): void {

    this.nutritionService
      .getGoals()
      .subscribe({

        next: (
          response:
            NutritionGoals,
        ) => {

          const calories =
            this.safeNumber(
              response.calories,
            );


          if (
            calories > 0
          ) {

            this.calorieGoal =
              calories;


            this.calorieGoalInput =
              calories;


            localStorage.setItem(
              'pulseos_calorie_goal',
              String(
                calories,
              ),
            );

          }

        },

        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to load nutrition goals:',
            error,
          );

        },

      });

  }


  /* =====================================================
     LOAD LOGS
  ===================================================== */

  private loadLogs(): void {

    this.nutritionService
      .getLogs(
        this.todayApiDate,
      )
      .subscribe({

        next: (
          response:
            DietLogResponse,
        ) => {

          this.currentLog =
            response;


          this.applyDietLog(
            response,
          );


          this.isLoadingNutrition =
            false;

        },

        error: (
          error:
            HttpErrorResponse,
        ) => {

          /*
           * No log for today is a completely valid
           * state for a new day.
           */
          if (
            error.status === 404
          ) {

            this.currentLog =
              null;


            this.resetNutritionForEmptyDay();


            this.isLoadingNutrition =
              false;


            return;

          }


          console.error(
            'Unable to load diet log:',
            error,
          );


          this.nutritionLoadError =
            true;


          this.isLoadingNutrition =
            false;

        },

      });

  }


  /* =====================================================
     APPLY LOG
  ===================================================== */

  private applyDietLog(
    log: DietLogResponse,
  ): void {

    this.caloriesEaten = 0;

    this.protein = 0;

    this.carbs = 0;

    this.fats = 0;


    this.resetMeals();


    if (
      !log ||
      !Array.isArray(
        log.meals,
      )
    ) {

      return;

    }


    log.meals.forEach(
      (
        meal:
          DietLogMeal,
      ) => {

        const nutrition =
          meal.nutrition;


        if (
          nutrition
        ) {

          this.caloriesEaten +=
            this.safeNumber(
              nutrition.calories,
            );


          this.protein +=
            this.safeNumber(
              nutrition.protein_g,
            );


          this.carbs +=
            this.safeNumber(
              nutrition.carbs_g,
            );


          this.fats +=
            this.safeNumber(
              nutrition.fat_g,
            );

        }


        const mealSection =
          this.findMealSection(
            meal.meal_name,
          );


        if (
          mealSection
        ) {

          mealSection.eatenCalories =
            this.safeNumber(
              meal.nutrition
                ?.calories,
            );


          mealSection.items =
            Array.isArray(
              meal.items,
            )
              ? meal.items
              : [];

        }

      },
    );


    this.caloriesEaten =
      Math.round(
        this.caloriesEaten,
      );


    this.protein =
      this.roundMacro(
        this.protein,
      );


    this.carbs =
      this.roundMacro(
        this.carbs,
      );


    this.fats =
      this.roundMacro(
        this.fats,
      );

  }


  /* =====================================================
     RESET
  ===================================================== */

  private resetNutritionForEmptyDay(): void {

    this.caloriesEaten = 0;

    this.protein = 0;

    this.carbs = 0;

    this.fats = 0;


    this.resetMeals();

  }


  private resetMeals(): void {

    this.meals.forEach(
      meal => {

        meal.eatenCalories =
          0;


        meal.items =
          [];

      },
    );

  }


  /* =====================================================
     NUMBER HELPERS
  ===================================================== */

  private safeNumber(
    value: unknown,
  ): number {

    const parsed =
      Number(
        value,
      );


    if (
      !Number.isFinite(
        parsed,
      )
    ) {

      return 0;

    }


    return parsed;

  }


  private roundMacro(
    value: number,
  ): number {

    return Math.round(
      value * 10,
    ) / 10;

  }


  /* =====================================================
     MEAL MAPPING
  ===================================================== */

  private normalizeMealName(
    mealName: string,
  ): string {

    return String(
      mealName ?? '',
    )
      .trim()
      .toLowerCase()
      .replace(
        /[_-]+/g,
        ' ',
      );

  }


  private findMealSection(
    mealName: string,
  ):
    MealSection |
    undefined {

    const normalized =
      this.normalizeMealName(
        mealName,
      );


    if (
      normalized ===
      'breakfast'
    ) {

      return this.meals[0];

    }


    if (
      normalized ===
        'morning snack' ||
      normalized ===
        'morning snacks' ||
      normalized ===
        'snack'
    ) {

      return this.meals[1];

    }


    if (
      normalized ===
      'lunch'
    ) {

      return this.meals[2];

    }


    if (
      normalized ===
        'evening snack' ||
      normalized ===
        'evening snacks'
    ) {

      return this.meals[3];

    }


    if (
      normalized ===
      'dinner'
    ) {

      return this.meals[4];

    }


    return undefined;

  }


  /* =====================================================
     DATE
  ===================================================== */

  private get todayApiDate():
    string {

    const today =
      new Date();


    const year =
      today.getFullYear();


    const month =
      String(
        today.getMonth() + 1,
      )
        .padStart(
          2,
          '0',
        );


    const day =
      String(
        today.getDate(),
      )
        .padStart(
          2,
          '0',
        );


    return `${year}-${month}-${day}`;

  }


  get todayLabel(): string {

    return new Intl.DateTimeFormat(
      'en-US',
      {
        weekday:
          'short',

        day:
          'numeric',

        month:
          'short',

        year:
          'numeric',
      },
    ).format(
      new Date(),
    );

  }


  /* =====================================================
     CALORIES
  ===================================================== */

  get caloriesLeft(): number {

    return Math.max(
      0,

      this.safeNumber(
        this.calorieGoal,
      ) -

      this.safeNumber(
        this.caloriesEaten,
      ),
    );

  }


  get calorieProgress(): number {

    const goal =
      this.safeNumber(
        this.calorieGoal,
      );


    const eaten =
      this.safeNumber(
        this.caloriesEaten,
      );


    if (
      goal <= 0
    ) {

      return 0;

    }


    return Math.min(
      100,

      Math.max(
        0,

        (
          eaten /
          goal
        ) * 100,
      ),
    );

  }


  /* =====================================================
     GOAL MODAL
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
      !Number.isFinite(
        newGoal,
      ) ||
      newGoal < 500 ||
      newGoal > 10000
    ) {

      window.alert(
        'Enter a calorie goal between 500 and 10,000 calories.',
      );


      return;

    }


    const roundedGoal =
      Math.round(
        newGoal,
      );


    this.nutritionService
      .getGoals()
      .subscribe({

        next: (
          currentGoals:
            NutritionGoals,
        ) => {

          const payload:
            NutritionGoals = {

            calories:
              roundedGoal,

            protein_g:
              this.safeNumber(
                currentGoals.protein_g,
              ),

            carbs_g:
              this.safeNumber(
                currentGoals.carbs_g,
              ),

            fat_g:
              this.safeNumber(
                currentGoals.fat_g,
              ),

          };


          this.updateNutritionGoals(
            payload,
          );

        },

        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to read nutrition goals:',
            error,
          );


          window.alert(
            'Unable to update your calorie goal right now.',
          );

        },

      });

  }


  private updateNutritionGoals(
    payload:
      NutritionGoals,
  ): void {

    this.nutritionService
      .updateGoals(
        payload,
      )
      .subscribe({

        next: (
          response:
            NutritionGoals,
        ) => {

          const savedGoal =
            this.safeNumber(
              response.calories,
            );


          this.calorieGoal =
            savedGoal > 0
              ? savedGoal
              : payload.calories;


          this.calorieGoalInput =
            this.calorieGoal;


          localStorage.setItem(
            'pulseos_calorie_goal',
            String(
              this.calorieGoal,
            ),
          );


          this.closeGoalModal();

        },

        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to update nutrition goals:',
            error,
          );


          window.alert(
            'Unable to update your calorie goal right now.',
          );

        },

      });

  }


  /* =====================================================
     OPEN FOOD SEARCH
  ===================================================== */

  addFood(
    meal: MealSection,
  ): void {

    this.selectedMeal =
      meal;


    this.showFoodSearch =
      true;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.foodSearchQuery =
      '';


    this.foodSearchPage =
      1;


    this.foodSearchResults =
      [];


    this.foodSearchError =
      '';


    this.foodSaveError =
      '';


    this.loadFoods();

  }


  /* =====================================================
     CLOSE FOOD SEARCH
  ===================================================== */

  closeFoodSearch(): void {

    if (
      this.isSavingFood
    ) {

      return;

    }


    this.showFoodSearch =
      false;


    this.selectedMeal =
      null;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.foodSearchQuery =
      '';


    this.foodSearchResults =
      [];


    this.foodSearchError =
      '';


    this.foodSaveError =
      '';

  }


  /* =====================================================
     SEARCH
  ===================================================== */

  searchFoods(): void {

    this.foodSearchPage =
      1;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.loadFoods();

  }


  clearFoodSearch(): void {

    this.foodSearchQuery =
      '';


    this.foodSearchPage =
      1;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.loadFoods();

  }


  private loadFoods(): void {

    this.foodSearchLoading =
      true;


    this.foodSearchError =
      '';


    this.nutritionService
      .searchFoods(
        this.foodSearchQuery,
        this.foodSearchPage,
        this.foodSearchPageSize,
      )
      .subscribe({

        next: (
          response,
        ) => {

          this.foodSearchResults =
            response.items ?? [];


          this.foodSearchTotal =
            response.pagination
              ?.total ?? 0;


          this.foodSearchLoading =
            false;

        },

        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to search foods:',
            error,
          );


          this.foodSearchResults =
            [];


          this.foodSearchError =
            'Unable to load foods right now.';


          this.foodSearchLoading =
            false;

        },

      });

  }


  /* =====================================================
     FOOD PAGINATION
  ===================================================== */

  get canGoToPreviousFoodPage():
    boolean {

    return (
      this.foodSearchPage >
      1
    );

  }


  get canGoToNextFoodPage():
    boolean {

    return (
      this.foodSearchPage *
      this.foodSearchPageSize
    ) < this.foodSearchTotal;

  }


  previousFoodPage(): void {

    if (
      !this.canGoToPreviousFoodPage
    ) {

      return;

    }


    this.foodSearchPage -=
      1;


    this.loadFoods();

  }


  nextFoodPage(): void {

    if (
      !this.canGoToNextFoodPage
    ) {

      return;

    }


    this.foodSearchPage +=
      1;


    this.loadFoods();

  }


  /* =====================================================
     FOOD DETAILS
  ===================================================== */

  selectFood(
    food:
      FoodSearchItem,
  ): void {

    this.foodDetailsLoading =
      true;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.foodSaveError =
      '';


    this.nutritionService
      .getFoodDetails(
        food.food_id,
      )
      .subscribe({

        next: (
          response:
            FoodDetails,
        ) => {

          this.selectedFood =
            response;


          this.foodDetailsLoading =
            false;

        },

        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to load food details:',
            error,
          );


          this.foodDetailsLoading =
            false;


          this.foodSearchError =
            'Unable to load this food.';

        },

      });

  }


  backToFoodResults(): void {

    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.foodSaveError =
      '';

  }


  /* =====================================================
     SELECT SERVING
  ===================================================== */

  selectServing(
    serving:
      FoodServing,
  ): void {

    this.selectedServing =
      serving;


    this.foodSaveError =
      '';

  }


  isServingSelected(
    serving:
      FoodServing,
  ): boolean {

    return (
      this.selectedServing
        ?.serving_id ===
      serving.serving_id
    );

  }


  /* =====================================================
     ADD FOOD TO DIET LOG
  ===================================================== */

  addSelectedFoodToMeal(): void {

    if (
      !this.selectedMeal ||
      !this.selectedFood ||
      !this.selectedServing ||
      this.isSavingFood
    ) {

      return;

    }


    this.isSavingFood =
      true;


    this.foodSaveError =
      '';


    const newItem:
      DietLogRequestItem = {

      food_id:
        this.selectedFood.food_id,

      custom_food_id:
        null,

      serving_id:
        this.selectedServing.serving_id,

      quantity_g:
        this.safeNumber(
          this.selectedServing.quantity_g,
        ),

    };


    const payload =
      this.buildDietLogPayload(
        newItem,
      );


    if (
      this.currentLog
    ) {

      this.nutritionService
        .updateLog(
          this.currentLog.log_id,
          payload,
        )
        .subscribe({

          next: (
            response:
              DietLogResponse,
          ) => {

            this.handleFoodSaved(
              response,
            );

          },

          error: (
            error:
              HttpErrorResponse,
          ) => {

            this.handleFoodSaveError(
              error,
            );

          },

        });


      return;

    }


    this.nutritionService
      .createLog(
        payload,
      )
      .subscribe({

        next: (
          response:
            DietLogResponse,
        ) => {

          this.handleFoodSaved(
            response,
          );

        },

        error: (
          error:
            HttpErrorResponse,
        ) => {

          this.handleFoodSaveError(
            error,
          );

        },

      });

  }


  /* =====================================================
     BUILD LOG PAYLOAD

     PATCH replaces all meals on the backend.

     Therefore we MUST preserve every existing item and
     append the new item to the selected meal.
  ===================================================== */

  private buildDietLogPayload(
    newItem:
      DietLogRequestItem,
  ):
    DietLogRequest {

    const meals =
      this.currentLog
        ?.meals ?? [];


    const requestMeals =
      meals.map(
        meal => ({

          meal_type:
            meal.meal_name,

          items:
            meal.items.map(
              item =>
                this.convertExistingItemToRequest(
                  item,
                ),
            ),

        }),
      );


    const selectedMealName =
      this.selectedMeal
        ?.name ?? '';


    const selectedNormalized =
      this.normalizeMealName(
        selectedMealName,
      );


    const existingMeal =
      requestMeals.find(
        meal =>
          this.normalizeMealName(
            meal.meal_type,
          ) ===
          selectedNormalized,
      );


    if (
      existingMeal
    ) {

      existingMeal.items.push(
        newItem,
      );

    }
    else {

      requestMeals.push({

        meal_type:
          selectedMealName,

        items: [
          newItem,
        ],

      });

    }


    return {

      date:
        this.todayApiDate,

      meals:
        requestMeals,

    };

  }


  private convertExistingItemToRequest(
    item:
      DietLogItem,
  ):
    DietLogRequestItem {

    return {

      food_id:
        item.food_id,

      custom_food_id:
        item.custom_food_id,

      serving_id:
        item.serving_id,

      quantity_g:
        this.safeNumber(
          item.quantity_g,
        ),

    };

  }


  /* =====================================================
     FOOD SAVE SUCCESS
  ===================================================== */

  private handleFoodSaved(
    response:
      DietLogResponse,
  ): void {

    this.currentLog =
      response;


    this.applyDietLog(
      response,
    );


    this.isSavingFood =
      false;


    this.closeFoodSearch();

  }


  /* =====================================================
     FOOD SAVE ERROR
  ===================================================== */

  private handleFoodSaveError(
    error:
      HttpErrorResponse,
  ): void {

    console.error(
      'Unable to save food:',
      error,
    );


    this.isSavingFood =
      false;


    if (
      error.status === 422
    ) {

      console.error(
        'Diet log validation details:',
        error.error?.detail,
      );


      this.foodSaveError =
        'This food could not be added. Please try another serving.';


      return;

    }


    if (
      error.status === 401
    ) {

      this.foodSaveError =
        'Your session could not be verified. Please try again.';


      return;

    }


    if (
      error.status === 0
    ) {

      this.foodSaveError =
        'Unable to connect to PulseOS.';


      return;

    }


    this.foodSaveError =
      'Unable to add this food right now.';

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