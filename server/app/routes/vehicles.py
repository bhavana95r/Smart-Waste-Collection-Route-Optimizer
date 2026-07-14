from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Vehicle
from app.database import db

vehicles_bp = Blueprint('vehicles', __name__)

@vehicles_bp.route('', methods=['GET'])
@jwt_required()
def get_vehicles():
    vehicles = Vehicle.query.all()
    return jsonify([v.to_dict() for v in vehicles]), 200

@vehicles_bp.route('', methods=['POST'])
@jwt_required()
def add_vehicle():
    data = request.get_json() or {}
    vehicle_number = data.get('vehicle_number')
    driver_id = data.get('driver_id')
    capacity = float(data.get('capacity', 2000.0))
    fuel_type = data.get('fuel_type', 'Diesel')
    latitude = float(data.get('latitude', 12.9716))
    longitude = float(data.get('longitude', 77.5946))
    status = data.get('status', 'Active')
    
    if not vehicle_number:
        return jsonify({'message': 'Missing vehicle_number'}), 400
        
    if Vehicle.query.filter_by(vehicle_number=vehicle_number).first():
        return jsonify({'message': 'Vehicle with this number already exists'}), 400
        
    v = Vehicle(
        vehicle_number=vehicle_number,
        driver_id=driver_id if driver_id else None,
        capacity=capacity,
        fuel_type=fuel_type,
        latitude=latitude,
        longitude=longitude,
        status=status
    )
    db.session.add(v)
    db.session.commit()
    
    return jsonify(v.to_dict()), 201

@vehicles_bp.route('/<int:vehicle_id>', methods=['PUT'])
@jwt_required()
def update_vehicle(vehicle_id):
    v = Vehicle.query.get(vehicle_id)
    if not v:
        return jsonify({'message': 'Vehicle not found'}), 404
        
    data = request.get_json() or {}
    if 'vehicle_number' in data:
        v.vehicle_number = data['vehicle_number']
    if 'driver_id' in data:
        v.driver_id = data['driver_id'] if data['driver_id'] != -1 and data['driver_id'] is not None else None
    if 'capacity' in data:
        v.capacity = float(data['capacity'])
    if 'fuel_type' in data:
        v.fuel_type = data['fuel_type']
    if 'latitude' in data:
        v.latitude = float(data['latitude'])
    if 'longitude' in data:
        v.longitude = float(data['longitude'])
    if 'status' in data:
        v.status = data['status']
    if 'assigned_route_id' in data:
        v.assigned_route_id = data['assigned_route_id'] if data['assigned_route_id'] != -1 and data['assigned_route_id'] is not None else None
        
    db.session.commit()
    return jsonify(v.to_dict()), 200

@vehicles_bp.route('/<int:vehicle_id>', methods=['DELETE'])
@jwt_required()
def delete_vehicle(vehicle_id):
    v = Vehicle.query.get(vehicle_id)
    if not v:
        return jsonify({'message': 'Vehicle not found'}), 404
        
    db.session.delete(v)
    db.session.commit()
    return jsonify({'message': 'Vehicle deleted successfully'}), 200
