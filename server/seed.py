import sys
import os
import random
from datetime import datetime, timedelta

# Adjust path to import from server/app
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from run import app
from app.database import db
from app.models import User, Bin, Vehicle, Route, Collection, Notification
from app.services.ml_service import train_and_save_models

def seed_database():
    with app.app_context():
        print("Recreating database tables...")
        db.drop_all()
        db.create_all()
        
        # 1. Create Users
        print("Creating users...")
        users = [
            {"email": "admin@smartwaste.com", "name": "Municipal Director", "role": "Admin", "password": "adminpassword"},
            {"email": "operator@smartwaste.com", "name": "Route Dispatcher", "role": "Operator", "password": "operatorpassword"},
            {"email": "driver1@smartwaste.com", "name": "John Doe", "role": "Driver", "password": "driverpassword"},
            {"email": "driver2@smartwaste.com", "name": "Sarah Connor", "role": "Driver", "password": "driverpassword"},
            {"email": "driver3@smartwaste.com", "name": "James Smith", "role": "Driver", "password": "driverpassword"},
        ]
        
        user_objects = {}
        for u_data in users:
            u = User(email=u_data['email'], name=u_data['name'], role=u_data['role'])
            u.set_password(u_data['password'])
            db.session.add(u)
            user_objects[u_data['email']] = u
            
        db.session.commit()
        
        # 2. Create Smart Bins
        # Center: Bangalore (12.9716, 77.5946)
        print("Creating smart bins...")
        bin_locations = [
            ("KBR Park Circle", 12.9784, 77.5902, "Organic", 5, 85.0),
            ("Indiranagar 100ft Rd", 12.9719, 77.6412, "Recyclable", 4, 95.0),
            ("MG Road Metro", 12.9748, 77.6085, "General", 3, 45.0),
            ("Commercial Street", 12.9818, 77.6074, "General", 4, 72.0),
            ("Koramangala 5th Block", 12.9348, 77.6189, "Organic", 5, 92.0),
            ("Electronic City Gate 1", 12.8465, 77.6749, "Hazardous", 5, 30.0),
            ("Jayanagar 4th Block", 12.9284, 77.5912, "Organic", 3, 55.0),
            ("Malleshwaram 8th Cross", 12.9984, 77.5712, "Recyclable", 2, 60.0),
            ("Cubbon Park Entrance", 12.9738, 77.5972, "Organic", 4, 15.0),
            ("Whitefield Main Rd", 12.9698, 77.7499, "Hazardous", 4, 88.0),
            ("Brigade Road Shopping", 12.9732, 77.6070, "Recyclable", 3, 65.0),
            ("Bannerghatta National Park", 12.7845, 77.5812, "General", 4, 40.0),
        ]
        
        bin_objects = []
        for name, lat, lng, w_type, priority, fill in bin_locations:
            b = Bin(
                location_name=name,
                latitude=lat,
                longitude=lng,
                fill_level=fill,
                waste_type=w_type,
                priority=priority,
                status="Active",
                last_collected=datetime.utcnow() - timedelta(days=random.randint(1, 3))
            )
            db.session.add(b)
            bin_objects.append(b)
            
        db.session.commit()
        
        # 3. Create Vehicles
        print("Creating vehicles...")
        vehicles = [
            {"num": "KA-03-HA-1234", "driver_email": "driver1@smartwaste.com", "cap": 2500.0, "fuel": "Diesel", "lat": 12.9716, "lon": 77.5946, "status": "Active"},
            {"num": "KA-01-MJ-5678", "driver_email": "driver2@smartwaste.com", "cap": 1800.0, "fuel": "CNG", "lat": 12.9750, "lon": 77.6000, "status": "Active"},
            {"num": "KA-04-EV-9012", "driver_email": "driver3@smartwaste.com", "cap": 1500.0, "fuel": "Electric", "lat": 12.9690, "lon": 77.5910, "status": "Active"},
        ]
        
        vehicle_objects = []
        for v in vehicles:
            driver_u = user_objects.get(v['driver_email'])
            veh = Vehicle(
                vehicle_number=v['num'],
                driver_id=driver_u.id if driver_u else None,
                capacity=v['cap'],
                fuel_type=v['fuel'],
                latitude=v['lat'],
                longitude=v['lon'],
                status=v['status']
            )
            db.session.add(veh)
            vehicle_objects.append(veh)
            
        db.session.commit()
        
        # 4. Create past collections history for dashboard charts
        print("Populating collection histories...")
        now = datetime.utcnow()
        for i in range(15):
            past_time = now - timedelta(days=i)
            # Add collections for random bins
            for b in random.sample(bin_objects, k=random.randint(3, 6)):
                c = Collection(
                    bin_id=b.id,
                    vehicle_id=random.choice(vehicle_objects).id,
                    collected_at=past_time - timedelta(hours=random.randint(1, 8)),
                    weight_collected=random.uniform(50.0, 180.0),
                    status="Completed"
                )
                db.session.add(c)
                
        # 5. Create notifications
        print("Populating notifications...")
        notifications = [
            Notification(message="Smart Bin 'Indiranagar 100ft Rd' has exceeded 95% capacity and is overflow-critical.", type="Overflow"),
            Notification(message="Smart Bin 'KBR Park Circle' has exceeded 85% capacity.", type="Overflow"),
            Notification(message="Vehicle KA-04-EV-9012 reported a battery charge low alert.", type="Breakdown"),
            Notification(message="Schedule route optimized for Route 03 (Jayanagar sector).", type="Route Update"),
        ]
        for n in notifications:
            db.session.add(n)
            
        db.session.commit()
        
        # 6. Generate historical data for Machine Learning model training
        print("Simulating historical data to train ML Models...")
        ml_data = {
            'bins': [],
            'routes': []
        }
        
        # Bin overflow simulation (200 records)
        # Organic fills fastest, Hazardous slowest. High priority bins are collected faster.
        waste_rates = {'organic': 2.4, 'general': 1.8, 'recyclable': 1.3, 'hazardous': 0.7}
        for _ in range(250):
            w_type = random.choice(['Organic', 'Recyclable', 'Hazardous', 'General'])
            priority = random.randint(1, 5)
            fill_level = random.uniform(10.0, 95.0)
            
            base_rate = waste_rates[w_type.lower()]
            priority_mult = 1.0 + (priority - 1) * 0.15
            rate = base_rate * priority_mult * random.uniform(0.8, 1.2)
            
            hours_to_overflow = (100.0 - fill_level) / rate
            
            ml_data['bins'].append({
                'fill_level': fill_level,
                'waste_type': w_type,
                'day_of_week': random.randint(0, 6),
                'hour': random.randint(0, 23),
                'priority': priority,
                'hours_to_overflow': hours_to_overflow
            })
            
        # Fuel usage simulation (80 records)
        fuel_rates = {'diesel': 0.38, 'cng': 0.32, 'electric': 0.16}
        for _ in range(100):
            dist = random.uniform(5.0, 45.0)
            capacity = random.choice([1500.0, 1800.0, 2500.0])
            fuel_type = random.choice(['Diesel', 'CNG', 'Electric'])
            num_bins = random.randint(2, 8)
            
            base_usage = fuel_rates[fuel_type.lower()]
            stop_go_factor = 1.0 + (num_bins * 0.025)
            load_factor = 1.0 + random.uniform(0.05, 0.25)
            
            fuel_used = dist * base_usage * stop_go_factor * load_factor * random.uniform(0.9, 1.1)
            
            ml_data['routes'].append({
                'distance': dist,
                'capacity': capacity,
                'fuel_type': fuel_type,
                'num_bins': num_bins,
                'fuel_used': fuel_used
            })
            
        print("Training models...")
        success = train_and_save_models(ml_data)
        if success:
            print("AI/ML Models trained and saved successfully.")
        else:
            print("AI/ML Model training failed or was skipped.")
            
        print("Database seeded successfully.")

if __name__ == '__main__':
    seed_database()
