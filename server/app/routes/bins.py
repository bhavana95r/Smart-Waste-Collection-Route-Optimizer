from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Bin
from app.database import db
from app.services.ml_service import predict_hours_to_overflow
from datetime import datetime

bins_bp = Blueprint('bins', __name__)

@bins_bp.route('', methods=['GET'])
@jwt_required()
def get_bins():
    bins = Bin.query.all()
    result = []
    for b in bins:
        b_dict = b.to_dict()
        # Dynamically inject ML prediction for next overflow
        b_dict['hours_to_overflow'] = predict_hours_to_overflow(b.fill_level, b.waste_type, b.priority)
        result.append(b_dict)
    return jsonify(result), 200

@bins_bp.route('', methods=['POST'])
@jwt_required()
def add_bin():
    data = request.get_json() or {}
    location_name = data.get('location_name')
    latitude = data.get('latitude')
    longitude = data.get('longitude')
    fill_level = float(data.get('fill_level', 0.0))
    waste_type = data.get('waste_type', 'General')
    priority = int(data.get('priority', 1))
    status = data.get('status', 'Active')
    
    if not location_name or latitude is None or longitude is None:
        return jsonify({'message': 'Missing location_name, latitude, or longitude'}), 400
        
    b = Bin(
        location_name=location_name,
        latitude=float(latitude),
        longitude=float(longitude),
        fill_level=fill_level,
        waste_type=waste_type,
        priority=priority,
        status=status,
        last_collected=datetime.utcnow()
    )
    db.session.add(b)
    db.session.commit()
    
    b_dict = b.to_dict()
    b_dict['hours_to_overflow'] = predict_hours_to_overflow(b.fill_level, b.waste_type, b.priority)
    return jsonify(b_dict), 201

@bins_bp.route('/<int:bin_id>', methods=['PUT'])
@jwt_required()
def update_bin(bin_id):
    b = Bin.query.get_or_456(bin_id) if hasattr(Bin.query, 'get_or_456') else Bin.query.get(bin_id)
    if not b:
        return jsonify({'message': 'Bin not found'}), 404
        
    data = request.get_json() or {}
    if 'location_name' in data:
        b.location_name = data['location_name']
    if 'latitude' in data:
        b.latitude = float(data['latitude'])
    if 'longitude' in data:
        b.longitude = float(data['longitude'])
    if 'fill_level' in data:
        b.fill_level = float(data['fill_level'])
    if 'waste_type' in data:
        b.waste_type = data['waste_type']
    if 'priority' in data:
        b.priority = int(data['priority'])
    if 'status' in data:
        b.status = data['status']
    if 'last_collected' in data:
        # Client resets bin
        b.last_collected = datetime.utcnow()
        b.fill_level = 0.0 # reset to empty upon collection
        
    db.session.commit()
    
    b_dict = b.to_dict()
    b_dict['hours_to_overflow'] = predict_hours_to_overflow(b.fill_level, b.waste_type, b.priority)
    return jsonify(b_dict), 200

@bins_bp.route('/<int:bin_id>', methods=['DELETE'])
@jwt_required()
def delete_bin(bin_id):
    b = Bin.query.get(bin_id)
    if not b:
        return jsonify({'message': 'Bin not found'}), 404
        
    db.session.delete(b)
    db.session.commit()
    return jsonify({'message': 'Bin deleted successfully'}), 200
