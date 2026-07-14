from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from app.database import db
import json

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(50), nullable=False, default='Operator') # Admin, Driver, Operator
    
    # Relationships
    assigned_vehicle = db.relationship('Vehicle', backref='driver', uselist=False)
    notifications = db.relationship('Notification', backref='user', lazy=True)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role
        }

class Bin(db.Model):
    __tablename__ = 'bins'
    
    id = db.Column(db.Integer, primary_key=True)
    location_name = db.Column(db.String(150), nullable=False)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    fill_level = db.Column(db.Float, default=0.0) # 0 to 100
    waste_type = db.Column(db.String(50), default='General') # Organic, Recyclable, Hazardous, General
    status = db.Column(db.String(50), default='Active') # Active, Maintenance, Inactive
    last_collected = db.Column(db.DateTime, nullable=True)
    priority = db.Column(db.Integer, default=1) # 1 (Low) to 5 (Critical)
    
    collections = db.relationship('Collection', backref='bin', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'location_name': self.location_name,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'fill_level': self.fill_level,
            'waste_type': self.waste_type,
            'status': self.status,
            'last_collected': self.last_collected.isoformat() if self.last_collected else None,
            'priority': self.priority
        }

class Vehicle(db.Model):
    __tablename__ = 'vehicles'
    
    id = db.Column(db.Integer, primary_key=True)
    vehicle_number = db.Column(db.String(50), unique=True, nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    capacity = db.Column(db.Float, nullable=False) # In kg
    fuel_type = db.Column(db.String(50), default='Diesel') # Diesel, CNG, Electric
    latitude = db.Column(db.Float, default=0.0)
    longitude = db.Column(db.Float, default=0.0)
    status = db.Column(db.String(50), default='Active') # Active, Maintenance, Breakdown
    assigned_route_id = db.Column(db.Integer, db.ForeignKey('routes.id', name='fk_vehicle_route'), nullable=True)
    
    collections = db.relationship('Collection', backref='vehicle', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'vehicle_number': self.vehicle_number,
            'driver_id': self.driver_id,
            'driver_name': self.driver.name if self.driver else "Unassigned",
            'capacity': self.capacity,
            'fuel_type': self.fuel_type,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'status': self.status,
            'assigned_route_id': self.assigned_route_id
        }

class Route(db.Model):
    __tablename__ = 'routes'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), default='Pending') # Pending, In Progress, Completed
    total_distance = db.Column(db.Float, default=0.0) # In km
    estimated_time = db.Column(db.Integer, default=0) # In minutes
    fuel_consumption = db.Column(db.Float, default=0.0) # In liters
    co2_emissions = db.Column(db.Float, default=0.0) # In kg
    collection_cost = db.Column(db.Float, default=0.0) # In USD
    path_coordinates = db.Column(db.Text, nullable=True) # Stored as JSON string
    
    vehicles = db.relationship('Vehicle', backref='assigned_route', foreign_keys=[Vehicle.assigned_route_id])

    def get_coordinates(self):
        if self.path_coordinates:
            try:
                return json.loads(self.path_coordinates)
            except:
                return []
        return []

    def set_coordinates(self, coords):
        self.path_coordinates = json.dumps(coords)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'status': self.status,
            'total_distance': self.total_distance,
            'estimated_time': self.estimated_time,
            'fuel_consumption': self.fuel_consumption,
            'co2_emissions': self.co2_emissions,
            'collection_cost': self.collection_cost,
            'path_coordinates': self.get_coordinates()
        }

class Collection(db.Model):
    __tablename__ = 'collections'
    
    id = db.Column(db.Integer, primary_key=True)
    bin_id = db.Column(db.Integer, db.ForeignKey('bins.id'), nullable=False)
    vehicle_id = db.Column(db.Integer, db.ForeignKey('vehicles.id'), nullable=False)
    collected_at = db.Column(db.DateTime, default=datetime.utcnow)
    weight_collected = db.Column(db.Float, default=0.0) # In kg
    status = db.Column(db.String(50), default='Completed') # Completed, Missed

    def to_dict(self):
        return {
            'id': self.id,
            'bin_id': self.bin_id,
            'bin_location': self.bin.location_name if self.bin else "Unknown",
            'vehicle_id': self.vehicle_id,
            'vehicle_number': self.vehicle.vehicle_number if self.vehicle else "Unknown",
            'collected_at': self.collected_at.isoformat(),
            'weight_collected': self.weight_collected,
            'status': self.status
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    message = db.Column(db.String(255), nullable=False)
    type = db.Column(db.String(50), default='General') # Overflow, Breakdown, Route Update, Emergency
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_read = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    def to_dict(self):
        return {
            'id': self.id,
            'message': self.message,
            'type': self.type,
            'created_at': self.created_at.isoformat(),
            'is_read': self.is_read,
            'user_id': self.user_id
        }
