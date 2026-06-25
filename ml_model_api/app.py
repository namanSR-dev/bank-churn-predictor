from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd

# 1. Initialize the API Server
app = FastAPI(title="Bank Churn Prediction API", version="1.0.0")

# --- THE CORS FIX ---
# This tells Python to allow requests from your Next.js local server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
# --------------------

# 2. Load the Model & Scaler into Memory on Startup
try:
    model = joblib.load("models/xgboost_churn_model.joblib")
    scaler = joblib.load("models/robust_scaler.joblib")
    print("✅ ML assets loaded successfully.")
except Exception as e:
    print(f"❌ Error loading ML assets: {e}")

# 3. Define the Expected Incoming JSON Data
# (These must match the exact features your model was trained on)
class CustomerData(BaseModel):
    CreditScore: int
    Age: int
    Balance: float
    NumOfProducts: int
    IsActiveMember: int
    Geography_Germany: int
    Geography_Spain: int
    Gender_Male: int

# Health Check Route
@app.get("/")
def root():
    return {"status": "online", "message": "Bank Churn API is running. Visit /docs to test."}

# 4. The Core Prediction Route
@app.post("/api/v1/predict/churn")
def predict_churn(customer: CustomerData):
    try:
        # A. Convert incoming JSON to a pandas DataFrame
        # model_dump() converts the Pydantic model to a standard dictionary
        input_data = pd.DataFrame([customer.model_dump()])

        # B. Apply the frozen mathematical scaling rules
        scaled_data = scaler.transform(input_data)

        # C. Generate the raw churn probability (predict_proba returns [Prob of 0, Prob of 1])
        probability = model.predict_proba(scaled_data)[0][1]

        # D. Apply the Custom Engineering Threshold we found in Colab!
        OPTIMAL_THRESHOLD = 0.5877
        is_flight_risk = bool(probability >= OPTIMAL_THRESHOLD)

        # E. Return the clean JSON response to the client
        return {
            "churn_probability": round(float(probability), 4),
            "is_flight_risk": is_flight_risk,
            "threshold_applied": OPTIMAL_THRESHOLD
        }

    except Exception as e:
        # If the frontend sends bad data, send back a clean 400 error
        raise HTTPException(status_code=400, detail=str(e))