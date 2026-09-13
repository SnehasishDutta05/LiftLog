import {
  Injectable,
} from '@angular/core';

import {
  HttpClient,
  HttpParams,
} from '@angular/common/http';

import {
  Observable,
} from 'rxjs';

import {
  environment,
} from '../../environments/environment';


/* =========================================================
   NUTRITION
========================================================= */

export interface NutritionValues {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  fiber_g: number;
}


/* =========================================================
   GOALS
========================================================= */

export interface NutritionGoals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}


/* =========================================================
   FOOD SEARCH
========================================================= */

export interface FoodSearchItem {
  food_id: number;
  name: string;
  nutrition_per_100g: NutritionValues;
}


export interface FoodSearchResponse {
  items: FoodSearchItem[];

  pagination: {
    page: number;
    page_size: number;
    total: number;
  };
}


/* =========================================================
   FOOD DETAILS
========================================================= */

export interface FoodServing
extends NutritionValues {

  serving_id: number;

  name: string;

  quantity_g: number;

}


export interface FoodDetails {
  food_id: number;

  name: string;

  nutrition_per_100g: NutritionValues;

  category: string;

  servings: FoodServing[];
}


/* =========================================================
   DIET LOG REQUEST
========================================================= */

export interface DietLogRequestItem {
  food_id?: number | null;

  custom_food_id?: number | null;

  serving_id?: number | null;

  quantity_g: number;
}


export interface DietLogRequestMeal {
  meal_type: string;

  items: DietLogRequestItem[];
}


export interface DietLogRequest {
  date: string;

  meals: DietLogRequestMeal[];
}


/* =========================================================
   DIET LOG RESPONSE
========================================================= */

export interface DietLogItem {
  food_id: number | null;

  custom_food_id: number | null;

  serving_id: number | null;

  food_name: string;

  quantity_g: number;

  calories: number;

  protein_g: number;

  carbs_g: number;

  fat_g: number;

  fiber_g: number;
}


export interface DietLogMeal {
  meal_name: string;

  items: DietLogItem[];

  nutrition: NutritionValues;
}


export interface DietLogResponse {
  log_id: number;

  date: string;

  last_updated: string;

  meals: DietLogMeal[];
}


/* =========================================================
   SERVICE
========================================================= */

@Injectable({
  providedIn: 'root',
})
export class NutritionService {

  private readonly apiUrl =
    `${environment.apiBaseUrl}/diet`;


  constructor(
    private http: HttpClient,
  ) {}


  /* =====================================================
     GOALS
  ===================================================== */

  getGoals():
    Observable<NutritionGoals> {

    return this.http
      .get<NutritionGoals>(
        `${this.apiUrl}/goals`,
      );

  }


  updateGoals(
    payload: NutritionGoals,
  ):
    Observable<NutritionGoals> {

    return this.http
      .put<NutritionGoals>(
        `${this.apiUrl}/goals`,
        payload,
      );

  }


  /* =====================================================
     LOGS
  ===================================================== */

  getLogs(
    date?: string,
  ):
    Observable<DietLogResponse> {

    let params =
      new HttpParams();


    if (date) {

      params =
        params.set(
          'date',
          date,
        );

    }


    return this.http
      .get<DietLogResponse>(
        `${this.apiUrl}/logs`,
        {
          params,
        },
      );

  }


  createLog(
    payload: DietLogRequest,
  ):
    Observable<DietLogResponse> {

    return this.http
      .post<DietLogResponse>(
        `${this.apiUrl}/logs`,
        payload,
      );

  }


  updateLog(
    logId: number,
    payload: DietLogRequest,
  ):
    Observable<DietLogResponse> {

    return this.http
      .patch<DietLogResponse>(
        `${this.apiUrl}/logs/${logId}`,
        payload,
      );

  }


  deleteLog(
    logId: number,
  ):
    Observable<void> {

    return this.http
      .delete<void>(
        `${this.apiUrl}/logs/${logId}`,
      );

  }


  /* =====================================================
     FOOD SEARCH
  ===================================================== */

  searchFoods(
    search: string = '',
    page: number = 1,
    pageSize: number = 20,
  ):
    Observable<FoodSearchResponse> {

    let params =
      new HttpParams()
        .set(
          'page',
          String(page),
        )
        .set(
          'page_size',
          String(pageSize),
        );


    const trimmedSearch =
      search.trim();


    if (trimmedSearch) {

      params =
        params.set(
          'search',
          trimmedSearch,
        );

    }


    return this.http
      .get<FoodSearchResponse>(
        `${this.apiUrl}/foods`,
        {
          params,
        },
      );

  }


  /* =====================================================
     FOOD DETAILS
  ===================================================== */

  getFoodDetails(
    foodId: number,
  ):
    Observable<FoodDetails> {

    return this.http
      .get<FoodDetails>(
        `${this.apiUrl}/foods/${foodId}`,
      );

  }

}