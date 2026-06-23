import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';

export interface MealDTO {
    id?: string;
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    logged: boolean;
    calories: number;
}

export interface NutritionDTO {
    patientId: string;
    date: Date;
    dailyCalories: number;
    targetCalories: number;
    hydrationPercent: number;
    protein: number;
    carbs: number;
    fats: number;
    meals: MealDTO[];
}

@Injectable({
    providedIn: 'root'
})
export class NutritionService {
    private apiUrl = `${environment.monitoringApi}/nutrition`;

    constructor(private http: HttpClient) { }

    getDailyNutrition(patientId: string): Observable<NutritionDTO> {
        return this.http.get<NutritionDTO>(`${this.apiUrl}/${patientId}`);
    }

    addMeal(patientId: string, meal: MealDTO): Observable<NutritionDTO> {
        return this.http.post<NutritionDTO>(`${this.apiUrl}/${patientId}/meals`, meal);
    }

    searchFood(query: string): Observable<any[]> {
        const url = `${this.apiUrl}/search?query=${encodeURIComponent(query)}`;
        return this.http.get<any>(url).pipe(
            map(response => Array.isArray(response) ? response : [])
        );
    }

    deleteMeal(patientId: string, mealId: string): Observable<NutritionDTO> {
        return this.http.delete<NutritionDTO>(`${this.apiUrl}/${patientId}/meals/${mealId}`);
    }
}
