import {
  ChangeDetectorRef,
  Component,
  NgZone,
  OnInit,
} from '@angular/core';

import {
  FormsModule,
} from '@angular/forms';

import {
  HttpErrorResponse,
} from '@angular/common/http';

import {
  ActivatedRoute,
  Router,
} from '@angular/router';

import {
  finalize,
} from 'rxjs';

import {
  DietLogItem,
  DietLogRequest,
  DietLogRequestItem,
  DietLogResponse,
  FoodDetails,
  FoodSearchItem,
  FoodServing,
  NutritionService,
} from '../../services/nutrition.service';


@Component({
  selector: 'app-food-picker',

  imports: [
    FormsModule,
  ],

  templateUrl:
    './food-picker.html',

  styleUrl:
    './food-picker.css',
})
export class FoodPicker
implements OnInit {


  /* =====================================================
     MEAL
  ===================================================== */

  mealName =
    'Meal';


  /* =====================================================
     FOOD SEARCH
  ===================================================== */

  searchTerm =
    '';


  foods:
    FoodSearchItem[] =
    [];


  isLoading =
    false;


  loadError =
    '';


  page =
    1;


  readonly pageSize =
    20;


  totalFoods =
    0;


  /* =====================================================
     FOOD DETAILS
  ===================================================== */

  selectedFood:
    FoodDetails | null =
    null;


  selectedServing:
    FoodServing | null =
    null;


  isLoadingDetails =
    false;


  detailsError =
    '';


  /* =====================================================
     CURRENT DIET LOG
  ===================================================== */

  currentLog:
    DietLogResponse | null =
    null;


  /* =====================================================
     SAVE
  ===================================================== */

  isSaving =
    false;


  saveError =
    '';


  /* =====================================================
     CONSTRUCTOR
  ===================================================== */

  constructor(
    private route:
      ActivatedRoute,

    private router:
      Router,

    private nutritionService:
      NutritionService,

    private changeDetector:
      ChangeDetectorRef,

    private zone:
      NgZone,
  ) {}


  /* =====================================================
     INIT
  ===================================================== */

  ngOnInit(): void {

    this.readMealFromRoute();

    this.loadCurrentLog();

    this.loadFoods();

  }


  /* =====================================================
     ROUTE
  ===================================================== */

  private readMealFromRoute(): void {

    const meal =
      this.route.snapshot
        .queryParamMap
        .get(
          'meal',
        );


    if (
      meal &&
      meal.trim()
    ) {

      this.mealName =
        meal.trim();

    }

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


  /* =====================================================
     CURRENT LOG
  ===================================================== */

  private loadCurrentLog(): void {

    this.nutritionService
      .getLogs(
        this.todayApiDate,
      )
      .subscribe({

        next: (
          response:
            DietLogResponse,
        ) => {

          this.zone.run(
            () => {

              this.currentLog =
                response;


              this.changeDetector
                .detectChanges();

            },
          );

        },


        error: (
          error:
            HttpErrorResponse,
        ) => {

          /*
           * 404 means there is simply no diet log
           * for today yet.
           */
          if (
            error.status === 404
          ) {

            this.zone.run(
              () => {

                this.currentLog =
                  null;


                this.changeDetector
                  .detectChanges();

              },
            );


            return;

          }


          console.error(
            'Unable to load current diet log:',
            error,
          );

        },

      });

  }


  /* =====================================================
     LOAD FOODS
  ===================================================== */

  private loadFoods(): void {

    this.isLoading =
      true;


    this.loadError =
      '';


    this.foods =
      [];


    this.totalFoods =
      0;


    console.log(
      'Loading foods...',
      {
        search:
          this.searchTerm,

        page:
          this.page,

        pageSize:
          this.pageSize,
      },
    );


    this.nutritionService
      .searchFoods(
        this.searchTerm,
        this.page,
        this.pageSize,
      )
      .pipe(

        finalize(
          () => {

            this.zone.run(
              () => {

                this.isLoading =
                  false;


                this.changeDetector
                  .detectChanges();

              },
            );

          },
        ),

      )
      .subscribe({

        next: (
          response,
        ) => {

          console.log(
            'Food API response:',
            response,
          );


          this.zone.run(
            () => {

              if (
                !response ||
                !Array.isArray(
                  response.items,
                )
              ) {

                console.error(
                  'Invalid food API response:',
                  response,
                );


                this.foods =
                  [];


                this.totalFoods =
                  0;


                this.loadError =
                  'The food API returned an invalid response.';


                this.changeDetector
                  .detectChanges();


                return;

              }


              this.foods =
                response.items;


              this.totalFoods =
                Number(
                  response.pagination
                    ?.total ??
                  response.items.length,
                );


              console.log(
                'Foods loaded:',
                this.foods.length,
              );


              this.changeDetector
                .detectChanges();

            },
          );

        },


        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to load foods:',
            error,
          );


          this.zone.run(
            () => {

              this.foods =
                [];


              this.totalFoods =
                0;


              this.loadError =
                'Unable to load foods right now.';


              this.changeDetector
                .detectChanges();

            },
          );

        },

      });

  }


  /* =====================================================
     SEARCH
  ===================================================== */

  searchFoods(): void {

    this.page =
      1;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.loadFoods();

  }


  clearSearch(): void {

    this.searchTerm =
      '';


    this.page =
      1;


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.loadFoods();

  }


  /* =====================================================
     PAGINATION
  ===================================================== */

  get canGoPrevious():
    boolean {

    return (
      this.page >
      1
    );

  }


  get canGoNext():
    boolean {

    return (
      this.page *
      this.pageSize
    ) < this.totalFoods;

  }


  previousPage(): void {

    if (
      !this.canGoPrevious ||
      this.isLoading
    ) {

      return;

    }


    this.page -=
      1;


    this.loadFoods();

  }


  nextPage(): void {

    if (
      !this.canGoNext ||
      this.isLoading
    ) {

      return;

    }


    this.page +=
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

    if (
      this.isLoadingDetails
    ) {

      return;

    }


    this.isLoadingDetails =
      true;


    this.detailsError =
      '';


    this.saveError =
      '';


    this.selectedFood =
      null;


    this.selectedServing =
      null;


    console.log(
      'Loading food details:',
      food.food_id,
    );


    this.nutritionService
      .getFoodDetails(
        food.food_id,
      )
      .pipe(

        finalize(
          () => {

            this.zone.run(
              () => {

                this.isLoadingDetails =
                  false;


                this.changeDetector
                  .detectChanges();

              },
            );

          },
        ),

      )
      .subscribe({

        next: (
          response:
            FoodDetails,
        ) => {

          console.log(
            'Food details response:',
            response,
          );


          this.zone.run(
            () => {

              this.selectedFood =
                response;


              if (
                Array.isArray(
                  response.servings,
                ) &&
                response.servings.length ===
                  1
              ) {

                this.selectedServing =
                  response.servings[0];

              }


              this.changeDetector
                .detectChanges();

            },
          );

        },


        error: (
          error:
            unknown,
        ) => {

          console.error(
            'Unable to load food details:',
            error,
          );


          this.zone.run(
            () => {

              this.detailsError =
                'Unable to load this food.';


              this.changeDetector
                .detectChanges();

            },
          );

        },

      });

  }


  backToFoods(): void {

    this.selectedFood =
      null;


    this.selectedServing =
      null;


    this.detailsError =
      '';


    this.saveError =
      '';

  }


  /* =====================================================
     SERVING
  ===================================================== */

  selectServing(
    serving:
      FoodServing,
  ): void {

    this.selectedServing =
      serving;


    this.saveError =
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
     ADD FOOD
  ===================================================== */

  addSelectedFood(): void {

    if (
      !this.selectedFood ||
      !this.selectedServing ||
      this.isSaving
    ) {

      return;

    }


    this.isSaving =
      true;


    this.saveError =
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


    console.log(
      'Saving diet log:',
      payload,
    );


    /*
     * Existing daily log:
     * PATCH it.
     */
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

            this.handleSaveSuccess(
              response,
            );

          },


          error: (
            error:
              HttpErrorResponse,
          ) => {

            this.handleSaveError(
              error,
            );

          },

        });


      return;

    }


    /*
     * No log for today:
     * create it.
     */
    this.nutritionService
      .createLog(
        payload,
      )
      .subscribe({

        next: (
          response:
            DietLogResponse,
        ) => {

          this.handleSaveSuccess(
            response,
          );

        },


        error: (
          error:
            HttpErrorResponse,
        ) => {

          this.handleSaveError(
            error,
          );

        },

      });

  }


  /* =====================================================
     BUILD LOG PAYLOAD
  ===================================================== */

  private buildDietLogPayload(
    newItem:
      DietLogRequestItem,
  ):
    DietLogRequest {

    const existingMeals =
      this.currentLog
        ?.meals ??
      [];


    /*
     * PATCH replaces the entire meals array,
     * so preserve every existing food.
     */
    const meals =
      existingMeals.map(
        meal => ({

          meal_type:
            meal.meal_name,

          items:
            meal.items.map(
              item =>
                this.convertExistingItem(
                  item,
                ),
            ),

        }),
      );


    const selectedMealName =
      this.normalizeMealName(
        this.mealName,
      );


    const existingMeal =
      meals.find(
        meal =>
          this.normalizeMealName(
            meal.meal_type,
          ) ===
          selectedMealName,
      );


    if (
      existingMeal
    ) {

      existingMeal.items.push(
        newItem,
      );

    }
    else {

      meals.push({

        meal_type:
          this.mealName,

        items: [
          newItem,
        ],

      });

    }


    return {

      date:
        this.todayApiDate,

      meals,

    };

  }


  /* =====================================================
     EXISTING ITEM → REQUEST ITEM
  ===================================================== */

  private convertExistingItem(
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
     HELPERS
  ===================================================== */

  private normalizeMealName(
    value:
      string,
  ):
    string {

    return String(
      value ??
      '',
    )
      .trim()
      .toLowerCase()
      .replace(
        /[_-]+/g,
        ' ',
      );

  }


  private safeNumber(
    value:
      unknown,
  ):
    number {

    const parsed =
      Number(
        value,
      );


    return Number.isFinite(
      parsed,
    )
      ? parsed
      : 0;

  }


  /* =====================================================
     SAVE SUCCESS
  ===================================================== */

  private handleSaveSuccess(
    response:
      DietLogResponse,
  ): void {

    console.log(
      'Food added successfully:',
      response,
    );


    this.zone.run(
      () => {

        this.currentLog =
          response;


        this.isSaving =
          false;


        this.changeDetector
          .detectChanges();


        this.router.navigate([
          '/healthify',
        ]);

      },
    );

  }


  /* =====================================================
     SAVE ERROR
  ===================================================== */

  private handleSaveError(
    error:
      HttpErrorResponse,
  ): void {

    console.error(
      'Unable to add food:',
      error,
    );


    this.zone.run(
      () => {

        this.isSaving =
          false;


        if (
          error.status === 422
        ) {

          console.error(
            'Diet log validation details:',
            error.error?.detail,
          );


          this.saveError =
            'This food could not be added. Please try another serving.';

        }
        else if (
          error.status === 401
        ) {

          this.saveError =
            'Your session could not be verified.';

        }
        else if (
          error.status === 0
        ) {

          this.saveError =
            'Unable to connect to PulseOS.';

        }
        else {

          this.saveError =
            'Unable to add this food right now.';

        }


        this.changeDetector
          .detectChanges();

      },
    );

  }


  /* =====================================================
     CANCEL
  ===================================================== */

  cancel(): void {

    this.router.navigate([
      '/healthify',
    ]);

  }

}