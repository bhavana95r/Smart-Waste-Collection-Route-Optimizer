import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'smart-waste-collection-secret-key-12345')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-smart-waste-secret-key-67890')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)
    
    # SQLite fallback, dynamically updates with DATABASE_URL in production environments
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'sqlite:///smart_waste.db')
    if SQLALCHEMY_DATABASE_URI.startswith("postgres://"):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace("postgres://", "postgresql://", 1)
        
    SQLALCHEMY_TRACK_MODIFICATIONS = False
