import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NutritionSummaryComponent } from './nutrition-summary.component';
import { NutritionService } from '../../services/nutrition.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { ChangeDetectorRef } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';

describe('NutritionSummaryComponent', () => {
    let component: NutritionSummaryComponent;
    let fixture: ComponentFixture<NutritionSummaryComponent>;
    let mockNutritionService: jasmine.SpyObj<NutritionService>;
    let mockPatientContext: Partial<PatientContextService>;

    beforeEach(async () => {
        mockNutritionService = jasmine.createSpyObj('NutritionService', ['getDailyNutrition', 'searchFood', 'addMeal', 'deleteMeal']);
        
        const patientIdSubject = new BehaviorSubject<string | null>('patient-abc');
        mockPatientContext = {
            patientId$: patientIdSubject.asObservable()
        };

        mockNutritionService.getDailyNutrition.and.returnValue(of({
            patientId: '2',
            date: new Date(),
            dailyCalories: 1000,
            targetCalories: 2000,
            hydrationPercent: 50,
            protein: 40,
            carbs: 50,
            fats: 10,
            meals: [
                { id: '1', name: 'Eggs', type: 'Breakfast', calories: 300, logged: true },
                { id: '2', name: 'Coffee', type: 'Breakfast', calories: 50, logged: true },
                { id: '3', name: 'Salad', type: 'Lunch', calories: 400, logged: true }
            ]
        }));

        await TestBed.configureTestingModule({
            declarations: [NutritionSummaryComponent],
            providers: [
                { provide: NutritionService, useValue: mockNutritionService },
                { provide: PatientContextService, useValue: mockPatientContext },
                ChangeDetectorRef
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(NutritionSummaryComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should calculate calorie percentage correctly', () => {
        // (1000 / 2000) * 100 = 50
        expect(component.caloriePercent).toBe(50);
        
        if (component.nutritionData) {
            component.nutritionData.dailyCalories = 1500;
            expect(component.caloriePercent).toBe(75);
        }
    });

    it('should group meals by type correctly', () => {
        const groups = component.groupedMeals;
        expect(groups.length).toBe(2); // Breakfast and Lunch
        
        const breakfast = groups.find(g => g.type === 'Breakfast');
        expect(breakfast?.items.length).toBe(2);
        expect(breakfast?.totalCalories).toBe(350);
        
        const lunch = groups.find(g => g.type === 'Lunch');
        expect(lunch?.totalCalories).toBe(400);
    });

    it('should list Breakfast before Lunch based on standard order', () => {
        const groups = component.groupedMeals;
        expect(groups[0].type).toBe('Breakfast');
        expect(groups[1].type).toBe('Lunch');
    });

    it('should call search service when searchFood is triggered', () => {
        component.searchQuery = 'Banana';
        mockNutritionService.searchFood.and.returnValue(of([{ name: 'Banana', calories: 100 }]));
        
        component.searchFood();
        
        expect(mockNutritionService.searchFood).toHaveBeenCalledWith('Banana');
        expect(component.searchResults.length).toBe(1);
        expect(component.searchResults[0].name).toBe('Banana');
    });

    it('should handle search error gracefully', () => {
        component.searchQuery = 'ErrorTest';
        mockNutritionService.searchFood.and.returnValue(of({ error: 'RATE_LIMIT_EXCEEDED' } as any));
        
        component.searchFood();
        
        expect(component.searchError).toContain('limit reached');
        expect(component.searchResults.length).toBe(0);
    });
});
