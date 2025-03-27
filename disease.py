import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import mean_squared_error, r2_score
import joblib

# Sample function to generate synthetic data for training
# In a real scenario, you would use actual sensor readings collected over time
def generate_sample_data(n_samples=1000):
    np.random.seed(42)
    data = {
        'soil_moisture': np.random.uniform(10, 95, n_samples),
        'temperature': np.random.uniform(15, 35, n_samples),
        'humidity': np.random.uniform(30, 90, n_samples),
        'light_intensity': np.random.uniform(100, 1000, n_samples),
        'time_of_day': np.random.uniform(0, 24, n_samples)
    }
    
    # Create stress level using a complex relationship
    stress = (
        10 - 0.1 * data['soil_moisture'] +
        0.2 * np.maximum(0, data['temperature'] - 25) +
        0.1 * np.maximum(0, 60 - data['humidity']) +
        0.05 * np.sin(data['time_of_day'] * np.pi / 12)
    )
    
    # Add some noise and constrain to 0-10 range
    data['stress_level'] = np.clip(stress + np.random.normal(0, 0.5, n_samples), 0, 10)
    
    return pd.DataFrame(data)

# Main model training function
def train_plant_stress_model():
    # Get training data
    print("Generating sample data...")
    df = generate_sample_data()
    
    # Features and target
    X = df.drop('stress_level', axis=1)
    y = df['stress_level']
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # Train model
    print("Training Random Forest model...")
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X_train_scaled, y_train)
    
    # Evaluate model
    y_pred = model.predict(X_test_scaled)
    mse = mean_squared_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Model performance: MSE = {mse:.4f}, R² = {r2:.4f}")
    
    # Save model and scaler
    joblib.dump(model, 'plant_stress_model.pkl')
    joblib.dump(scaler, 'feature_scaler.pkl')
    
    print("Model saved as 'plant_stress_model.pkl'")
    
    # Feature importance
    features = X.columns
    importances = model.feature_importances_
    indices = np.argsort(importances)[::-1]
    
    print("\nFeature importance:")
    for i in indices:
        print(f"{features[i]}: {importances[i]:.4f}")
    
    return model, scaler

# Function to convert model to TensorFlow Lite format for Arduino
def convert_to_tflite():
    # Note: This would typically involve retraining the model in TensorFlow
    # Or converting scikit-learn model to TensorFlow format
    # This is a placeholder for that process
    print("For Arduino deployment, convert the model to TensorFlow Lite format")
    print("See: https://www.tensorflow.org/lite/microcontrollers")

# Function to make predictions with new data
def predict_stress(model, scaler, soil_moisture, temperature, humidity, light, time):
    # Create a sample data point
    new_data = pd.DataFrame({
        'soil_moisture': [soil_moisture],
        'temperature': [temperature],
        'humidity': [humidity],
        'light_intensity': [light],
        'time_of_day': [time]
    })
    
    # Scale features
    new_data_scaled = scaler.transform(new_data)
    
    # Predict
    stress_prediction = model.predict(new_data_scaled)[0]
    
    return stress_prediction

if __name__ == "__main__":
    model, scaler = train_plant_stress_model()
    
    # Example prediction
    stress = predict_stress(model, scaler, 
                           soil_moisture=40, 
                           temperature=28, 
                           humidity=55, 
                           light=800, 
                           time=14)
    print(f"\nExample prediction: Plant stress level = {stress:.2f}/10")
    
    # Convert for Arduino
    convert_to_tflite()