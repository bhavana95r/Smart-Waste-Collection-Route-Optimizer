import os
import pickle
import numpy as np
from datetime import datetime

# Try to import scikit-learn
SKLEARN_AVAILABLE = False
try:
    from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
    SKLEARN_AVAILABLE = True
except ImportError:
    pass

MODEL_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'models')
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

BIN_MODEL_PATH = os.path.join(MODEL_DIR, 'bin_overflow_model.pkl')
FUEL_MODEL_PATH = os.path.join(MODEL_DIR, 'fuel_usage_model.pkl')

def train_and_save_models(historical_data):
    """
    Trains and saves ML models using historical collection logs.
    historical_data: Dict containing lists of samples for bin logs and route logs.
    """
    if not SKLEARN_AVAILABLE:
        print("Scikit-Learn not available. Skipping model training.")
        return False
        
    try:
        # 1. Train Bin Overflow Predictor (Random Forest Regressor)
        # Features: [current_fill_level, waste_type_encoded, day_of_week, hour_of_day, priority]
        # Label: hours_until_overflow
        bin_samples = historical_data.get('bins', [])
        if len(bin_samples) >= 10:
            X_bin = []
            y_bin = []
            waste_map = {'organic': 1, 'recyclable': 2, 'hazardous': 3, 'general': 4}
            
            for s in bin_samples:
                w_type = waste_map.get(s['waste_type'].lower(), 4)
                X_bin.append([s['fill_level'], w_type, s['day_of_week'], s['hour'], s['priority']])
                y_bin.append(s['hours_to_overflow'])
                
            bin_model = RandomForestRegressor(n_estimators=50, random_state=42)
            bin_model.fit(X_bin, y_bin)
            
            with open(BIN_MODEL_PATH, 'wb') as f:
                pickle.dump(bin_model, f)
            print("Successfully trained and saved bin overflow model.")
            
        # 2. Train Fuel Usage Predictor (Gradient Boosting Regressor)
        # Features: [distance_km, vehicle_capacity, fuel_type_encoded, num_bins]
        # Label: actual_fuel_used
        route_samples = historical_data.get('routes', [])
        if len(route_samples) >= 10:
            X_fuel = []
            y_fuel = []
            fuel_map = {'diesel': 1, 'cng': 2, 'electric': 3}
            
            for s in route_samples:
                f_type = fuel_map.get(s['fuel_type'].lower(), 1)
                X_fuel.append([s['distance'], s['capacity'], f_type, s['num_bins']])
                y_fuel.append(s['fuel_used'])
                
            fuel_model = GradientBoostingRegressor(n_estimators=50, random_state=42)
            fuel_model.fit(X_fuel, y_fuel)
            
            with open(FUEL_MODEL_PATH, 'wb') as f:
                pickle.dump(fuel_model, f)
            print("Successfully trained and saved fuel usage model.")
            
        return True
    except Exception as e:
        print(f"Error training models: {e}")
        return False

def predict_hours_to_overflow(fill_level, waste_type, priority):
    """
    Predict hours remaining before a bin reaches 100% capacity.
    Uses Random Forest Model if available, else a realistic mathematical heuristic.
    """
    now = datetime.now()
    weekday = now.weekday()
    hour = now.hour
    
    waste_map = {'organic': 1, 'recyclable': 2, 'hazardous': 3, 'general': 4}
    w_type_encoded = waste_map.get(waste_type.lower(), 4)
    
    # Check if model exists on disk
    if SKLEARN_AVAILABLE and os.path.exists(BIN_MODEL_PATH):
        try:
            with open(BIN_MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            features = np.array([[fill_level, w_type_encoded, weekday, hour, priority]])
            prediction = model.predict(features)[0]
            return max(0.1, round(float(prediction), 1))
        except Exception as e:
            print(f"Prediction model error: {e}. Falling back to heuristic.")
            
    # Heuristic fallback:
    # Fill rates per hour: Organic = 2.5%, General = 2.0%, Recyclable = 1.5%, Hazardous = 0.8%
    rates = {'organic': 2.5, 'general': 2.0, 'recyclable': 1.5, 'hazardous': 0.8}
    base_rate = rates.get(waste_type.lower(), 2.0)
    
    # Priority speed multiplier
    priority_mult = 1.0 + (priority - 1) * 0.15
    fill_rate_per_hour = base_rate * priority_mult
    
    # Adjust for weekend
    if weekday >= 5:
        fill_rate_per_hour *= 1.25 # higher waste production on weekends
        
    remaining_capacity = 100.0 - fill_level
    hours = remaining_capacity / max(0.1, fill_rate_per_hour)
    
    return max(0.1, round(hours, 1))

def predict_fuel_consumption(distance_km, vehicle_capacity, fuel_type, num_bins):
    """
    Predict fuel/energy consumption for a route.
    Uses Gradient Boosting model if available, else standard consumption rates.
    """
    fuel_map = {'diesel': 1, 'cng': 2, 'electric': 3}
    f_type_encoded = fuel_map.get(fuel_type.lower(), 1)
    
    if SKLEARN_AVAILABLE and os.path.exists(FUEL_MODEL_PATH):
        try:
            with open(FUEL_MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            features = np.array([[distance_km, vehicle_capacity, f_type_encoded, num_bins]])
            prediction = model.predict(features)[0]
            return max(0.1, round(float(prediction), 2))
        except Exception as e:
            print(f"Fuel model error: {e}. Falling back to default calculator.")
            
    # Default calculator fallback
    # Diesel uses ~0.4L/km, CNG ~0.35kg/km, Electric ~0.15kWh/km
    base_usage = 0.38
    if fuel_type.lower() == 'electric':
        base_usage = 0.16
    elif fuel_type.lower() == 'cng':
        base_usage = 0.32
        
    # Factor load and number of collections (stop & go increases consumption)
    stop_go_factor = 1.0 + (num_bins * 0.02)
    predicted_usage = distance_km * base_usage * stop_go_factor
    
    return max(0.1, round(predicted_usage, 2))
