import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NutritionService, NutritionDTO, MealDTO } from '../../services/nutrition.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-nutrition-summary',
    standalone: false,
    templateUrl: './nutrition-summary.component.html',
    styleUrls: ['./nutrition-summary.component.scss']
})
export class NutritionSummaryComponent implements OnInit, OnDestroy {
    
    patientId: string | null = null;
    nutritionData: NutritionDTO | null = null;
    isLoading = false;
    hasError = false;
    private sub: Subscription = new Subscription();

    // Form stuff for adding meal
    showAddMealForm = false;
    searchQuery = '';
    searchResults: any[] = [];
    isSearching = false;
    selectedMealType: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack' = 'Snack';
    searchPerformed = false;
    searchError: string | null = null;

    constructor(
        private nutritionService: NutritionService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        console.log('[NutritionSummaryComponent] initialized');
        this.sub.add(
            this.patientContext.patientId$
                .pipe(filter(id => !!id && id.trim().length > 0)) // BUG 1 FIX: skip empty initial BehaviorSubject emission
                .subscribe(id => {
                    console.log('[NutritionSummaryComponent] Received patientId from context:', id);
                    this.patientId = id;
                    this.loadNutritionData(id);
                })
        );
    }

    ngOnDestroy(): void {
        this.sub.unsubscribe();
    }

    loadNutritionData(patientId: string) {
        console.log(`[NutritionSummaryComponent] Fetching data for patientId: ${patientId}`);
        this.hasError = false;
        this.isLoading = true;
        this.nutritionData = null;
        this.nutritionService.getDailyNutrition(patientId).subscribe(
            data => {
                console.log('[NutritionSummaryComponent] Successfully received data:', data);
                console.log('[NutritionSummaryComponent] Meals found:', data.meals?.length || 0);
                if (data.meals) {
                    data.meals.forEach((m, i) => console.log(`Meal ${i}: ID=${m.id}, Name=${m.name}`));
                }
                // BUG 3 FIX: ensure meals is always an array, never null
                data.meals = data.meals || [];
                this.nutritionData = data;
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error => {
                console.error('[NutritionSummaryComponent] HTTP Error loading data:', error);
                this.hasError = true;
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        );
    }

    get caloriePercent(): number {
        if (!this.nutritionData || this.nutritionData.targetCalories === 0) return 0;
        return Math.round((this.nutritionData.dailyCalories / this.nutritionData.targetCalories) * 100);
    }

    get groupedMeals() {
        if (!this.nutritionData || !this.nutritionData.meals) return [];
        
        const groups = this.nutritionData.meals.reduce((acc, meal) => {
            const type = meal.type;
            if (!acc[type]) {
                acc[type] = { type, items: [], totalCalories: 0 };
            }
            acc[type].items.push(meal);
            acc[type].totalCalories += meal.calories;
            return acc;
        }, {} as Record<string, { type: string, items: MealDTO[], totalCalories: number }>);

        // Sort by standard meal order
        const order = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
        return Object.values(groups).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    }

    getMealIcon(type: string): string {
        switch (type) {
            case 'Breakfast': return '🥣';
            case 'Lunch': return '🥗';
            case 'Dinner': return '🍽️';
            case 'Snack': return '🍎';
            default: return '🍔';
        }
    }

    toggleAddMealForm() {
        this.showAddMealForm = !this.showAddMealForm;
        this.searchQuery = '';
        this.searchResults = [];
        this.searchPerformed = false;
        this.searchError = null;
        this.cdr.detectChanges();
    }

    searchFood() {
        if (!this.searchQuery.trim()) return;
        this.isSearching = true;
        this.searchPerformed = true;
        this.searchError = null;
        this.cdr.detectChanges();

        this.nutritionService.searchFood(this.searchQuery).subscribe(
            results => {
                console.log('[NutritionSummaryComponent] Raw search results from service:', results);
                // Check for backend error object
                if (results && (results as any).error === 'RATE_LIMIT_EXCEEDED') {
                    this.searchError = 'Daily search limit reached. Please try generic items or try again later.';
                    this.searchResults = [];
                } else {
                    this.searchResults = results.slice(0, 5); // top 5
                    if (this.searchResults.length === 0) {
                        this.searchError = 'No matching foods found. Try a broader search.';
                    }
                }
                this.isSearching = false;
                this.cdr.detectChanges();
            },
            error => {
                console.error(error);
                this.searchError = 'Search service is temporarily unavailable.';
                this.isSearching = false;
                this.cdr.detectChanges();
            }
        );
    }

    selectAndAddFood(food: any) {
        if (!this.patientId) return;

        const cals = food.calories || 150;
        
        const newMeal: MealDTO = {
            name: food.name || 'Unknown Food',
            type: this.selectedMealType,
            logged: true,
            calories: Math.round(cals)
        };

        this.nutritionService.addMeal(this.patientId, newMeal).subscribe(
            updatedData => {
                console.log('[NutritionSummaryComponent] Meal added successfully. Updated meals:', updatedData.meals);
                // BUG 3 FIX: guard meals on add response too
                updatedData.meals = updatedData.meals || [];
                this.nutritionData = updatedData;
                this.cdr.detectChanges();
                this.toggleAddMealForm();
            },
            error => console.error('Error adding meal', error)
        );
    }

    deleteMeal(mealId: string | undefined) {
        console.log('[NutritionSummaryComponent] deleteMeal clicked. mealId:', mealId);
        if (!this.patientId) return;
        if (!mealId) {
            console.warn('[NutritionSummaryComponent] Cannot delete: mealId is missing/undefined');
            alert('Cannot delete this meal: missing ID. Try reloading the page.');
            return;
        }

        if (confirm('Are you sure you want to delete this meal?')) {
            console.log('[NutritionSummaryComponent] Confirming delete for mealId:', mealId);
            this.nutritionService.deleteMeal(this.patientId, mealId).subscribe(
                updatedData => {
                    console.log('[NutritionSummaryComponent] Delete successful. New meal count:', updatedData.meals?.length);
                    updatedData.meals = updatedData.meals || [];
                    this.nutritionData = updatedData;
                    this.cdr.detectChanges();
                },
                error => {
                    console.error('[NutritionSummaryComponent] HTTP Error deleting meal:', error);
                    alert('Failed to delete meal. check console for details.');
                }
            );
        }
    }
}
