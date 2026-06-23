"""
Alzheimer's Disease Risk Prediction Model Training Script
Trains ML models using Alzheimer's disease dataset with optimized feature selection
Uses the most effective features identified through correlation analysis
"""
import pandas as pd
import numpy as np
import joblib
import os
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    classification_report, confusion_matrix, roc_auc_score,
    roc_curve, precision_recall_curve, f1_score
)
import matplotlib.pyplot as plt
import seaborn as sns
from alzheimers_feature_extractor import AlzheimersFeatureExtractor, load_alzheimers_data


class AlzheimersModelTrainer:
    """Train and evaluate models for Alzheimer's disease risk prediction"""
    
    def __init__(self, feature_level='extended', random_state=42):
        """
        Initialize trainer
        
        Args:
            feature_level: 'core', 'extended', or 'full' feature sets
            random_state: Random seed for reproducibility
        """
        self.feature_level = feature_level
        self.random_state = random_state
        self.feature_extractor = AlzheimersFeatureExtractor(feature_level=feature_level)
        self.feature_names = self.feature_extractor.get_feature_names()
        self.model = None
        self.scaler = None
        self.best_model = None
        self.best_params = None
    
    def load_and_preprocess(self, csv_path='data/alzheimers_disease_data.csv'):
        """
        Load and preprocess Alzheimer's dataset
        
        Args:
            csv_path: Path to Alzheimer's disease dataset CSV
            
        Returns:
            tuple: (X_processed, y, scaler)
        """
        print("=" * 70)
        print("LOADING AND PREPROCESSING ALZHEIMER'S DISEASE DATA")
        print("=" * 70)
        
        # Load data
        print(f"\n1. Loading data from: {csv_path}")
        if not os.path.exists(csv_path):
            raise FileNotFoundError(f"Dataset not found: {csv_path}")
        
        df = load_alzheimers_data(csv_path)
        print(f"   Loaded {len(df)} records with {len(df.columns)} columns")
        
        # Extract features
        print(f"\n2. Extracting {self.feature_level} features ({len(self.feature_names)} total)...")
        extractor = AlzheimersFeatureExtractor(feature_level=self.feature_level)
        X_extracted = extractor.extract_batch(df)
        
        # Get target variable
        if 'Diagnosis' in df.columns:
            y = df['Diagnosis'].values
            print(f"   Target variable (Diagnosis) distribution:")
            unique, counts = np.unique(y, return_counts=True)
            for val, count in zip(unique, counts):
                pct = 100 * count / len(y)
                label = "No Alzheimer's" if val == 0 else "Alzheimer's"
                print(f"     {label}: {count} ({pct:.1f}%)")
        else:
            raise ValueError("'Diagnosis' column not found in dataset")
        
        # Normalize/Standardize numerical features
        print(f"\n3. Normalizing and standardizing features...")
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_extracted)
        X_processed = pd.DataFrame(X_scaled, columns=self.feature_names)
        
        print(f"   Features shape: {X_processed.shape}")
        print(f"   Feature statistics after scaling:")
        print(f"     Mean: {X_processed.mean().mean():.4f}")
        print(f"     Std: {X_processed.std().mean():.4f}")
        
        self.scaler = scaler
        return X_processed, y
    
    def train_models(self, X, y, test_size=0.2):
        """
        Train multiple models with hyperparameter tuning
        
        Args:
            X: Feature matrix
            y: Target vector
            test_size: Test set fraction
        """
        print("\n" + "=" * 70)
        print("TRAINING MODELS")
        print("=" * 70)
        
        # Split data
        print(f"\n1. Splitting data: {100*(1-test_size):.0f}% train, {100*test_size:.0f}% test")
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=self.random_state, stratify=y
        )
        print(f"   Training samples: {len(X_train)}")
        print(f"   Test samples: {len(X_test)}")
        
        # Define models and hyperparameters
        models_config = {
            'Logistic Regression': {
                'model': LogisticRegression(random_state=self.random_state, max_iter=1000),
                'params': {
                    'C': [0.001, 0.01, 0.1, 1, 10],
                    'penalty': ['l2']
                }
            },
            'Random Forest': {
                'model': RandomForestClassifier(random_state=self.random_state, n_jobs=-1),
                'params': {
                    'n_estimators': [50, 100, 200],
                    'max_depth': [5, 10, 15, None],
                    'min_samples_split': [2, 5],
                    'min_samples_leaf': [1, 2]
                }
            },
            'Gradient Boosting': {
                'model': GradientBoostingClassifier(random_state=self.random_state),
                'params': {
                    'n_estimators': [50, 100, 200],
                    'learning_rate': [0.01, 0.05, 0.1],
                    'max_depth': [3, 5, 7]
                }
            }
        }
        
        # Train and evaluate each model
        results = {}
        print("\n2. Training models with GridSearchCV (cross-validation k=5)...")
        
        for model_name, config in models_config.items():
            print(f"\n   Training {model_name}...")
            
            grid_search = GridSearchCV(
                config['model'],
                config['params'],
                cv=5,
                scoring='f1',
                n_jobs=-1,
                verbose=0
            )
            
            grid_search.fit(X_train, y_train)
            
            # Make predictions
            y_pred = grid_search.best_estimator_.predict(X_test)
            y_pred_proba = grid_search.best_estimator_.predict_proba(X_test)[:, 1]
            
            # Calculate metrics
            f1 = f1_score(y_test, y_pred)
            roc_auc = roc_auc_score(y_test, y_pred_proba)
            
            results[model_name] = {
                'model': grid_search.best_estimator_,
                'best_params': grid_search.best_params_,
                'best_score': grid_search.best_score_,
                'f1_test': f1,
                'roc_auc': roc_auc,
                'y_pred': y_pred,
                'y_pred_proba': y_pred_proba
            }
            
            print(f"     Best CV Score (F1): {grid_search.best_score_:.4f}")
            print(f"     Test F1 Score: {f1:.4f}")
            print(f"     Test ROC-AUC: {roc_auc:.4f}")
            print(f"     Best Params: {grid_search.best_params_}")
        
        # Select best model
        print("\n3. Evaluating all models...")
        best_model_name = max(results.keys(), key=lambda x: results[x]['roc_auc'])
        self.best_model = results[best_model_name]['model']
        self.best_params = results[best_model_name]['best_params']
        
        print(f"\n   ✓ Best Model: {best_model_name}")
        print(f"   ✓ ROC-AUC Score: {results[best_model_name]['roc_auc']:.4f}")
        
        # Print detailed classification reports
        print("\n" + "=" * 70)
        print("DETAILED MODEL EVALUATION")
        print("=" * 70)
        
        for model_name, result in results.items():
            print(f"\n{model_name}:")
            print(f"{'=' * 50}")
            print(classification_report(y_test, result['y_pred'], 
                  target_names=['No Alzheimer\'s', 'Alzheimer\'s']))
            print(f"Confusion Matrix:\n{confusion_matrix(y_test, result['y_pred'])}")
        
        return results, X_test, y_test
    
    def save_model(self, model_path='alzheimers_model.pkl',
                   features_path='alzheimers_features.pkl',
                   scaler_path='alzheimers_scaler.pkl'):
        """
        Save trained model, features, and scaler
        
        Args:
            model_path: Path to save model
            features_path: Path to save feature names
            scaler_path: Path to save scaler
        """
        print("\n" + "=" * 70)
        print("SAVING MODEL AND ARTIFACTS")
        print("=" * 70)
        
        if self.best_model is None:
            raise ValueError("No model trained yet. Call train_models() first.")
        
        joblib.dump(self.best_model, model_path)
        print(f"\n✓ Model saved: {model_path}")
        
        joblib.dump(self.feature_names, features_path)
        print(f"✓ Features saved: {features_path}")
        
        if self.scaler:
            joblib.dump(self.scaler, scaler_path)
            print(f"✓ Scaler saved: {scaler_path}")
        
        # Save metadata
        metadata = {
            'feature_level': self.feature_level,
            'feature_names': self.feature_names,
            'best_params': self.best_params,
            'n_features': len(self.feature_names),
            'feature_descriptions': self.feature_extractor.get_feature_descriptions()
        }
        
        metadata_path = 'alzheimers_metadata.pkl'
        joblib.dump(metadata, metadata_path)
        print(f"✓ Metadata saved: {metadata_path}")
        
        print("\n" + "=" * 70)
    
    def plot_feature_importance(self, top_n=10):
        """Plot feature importance if model supports it"""
        if not hasattr(self.best_model, 'feature_importances_'):
            print("Model does not support feature importance extraction")
            return
        
        importances = self.best_model.feature_importances_
        indices = np.argsort(importances)[::-1][:top_n]
        
        plt.figure(figsize=(10, 6))
        plt.title(f'Top {top_n} Feature Importances')
        plt.bar(range(top_n), importances[indices])
        plt.xticks(range(top_n), [self.feature_names[i] for i in indices], rotation=45, ha='right')
        plt.tight_layout()
        plt.savefig('feature_importance.png')
        print(f"✓ Feature importance plot saved: feature_importance.png")


def main():
    """Main training execution"""
    print("\n")
    print("#" * 70)
    print("# ALZHEIMER'S DISEASE RISK PREDICTION - MODEL TRAINING")
    print("#" * 70)
    
    try:
        # Initialize trainer with extended features
        trainer = AlzheimersModelTrainer(feature_level='extended', random_state=42)
        
        # Load and preprocess data
        X, y = trainer.load_and_preprocess(csv_path='data/alzheimers_disease_data.csv')
        
        # Train models
        results, X_test, y_test = trainer.train_models(X, y, test_size=0.2)
        
        # Save best model
        trainer.save_model(
            model_path='alzheimers_model.pkl',
            features_path='alzheimers_features.pkl',
            scaler_path='alzheimers_scaler.pkl'
        )
        
        # Plot feature importance
        trainer.plot_feature_importance(top_n=12)
        
        print("\n" + "=" * 70)
        print("✓ TRAINING COMPLETE")
        print("=" * 70)
        print("\nNext steps:")
        print("  1. Review feature importance visualization")
        print("  2. Deploy model using app.py")
        print("  3. Test predictions with test_api.py")
        
    except Exception as e:
        print(f"\n❌ Error during training: {e}")
        import traceback
        traceback.print_exc()


if __name__ == '__main__':
    main()
