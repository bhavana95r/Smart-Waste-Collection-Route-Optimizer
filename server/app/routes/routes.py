from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Route, Bin, Vehicle, User
from app.database import db
from app.services.optimizer import optimize_route
import json

routes_bp = Blueprint('routes', __name__)

@routes_bp.route('', methods=['GET'])
@jwt_required()
def get_routes():
    routes = Route.query.all()
    return jsonify([r.to_dict() for r in routes]), 200

@routes_bp.route('/optimize-route', methods=['POST'])
@jwt_required()
def run_optimization():
    data = request.get_json() or {}
    vehicle_id = data.get('vehicle_id')
    bin_ids = data.get('bin_ids', []) # List of bin IDs to collect. If empty, collect all active bins with fill_level > 30%
    depot_lat = float(data.get('depot_lat', 12.9716))
    depot_lon = float(data.get('depot_lon', 77.5946))
    
    if not vehicle_id:
        return jsonify({'message': 'Missing vehicle_id'}), 400
        
    vehicle = Vehicle.query.get(vehicle_id)
    if not vehicle:
        return jsonify({'message': 'Vehicle not found'}), 404
        
    # Query Bins
    if not bin_ids:
        # Auto-select all bins with fill level > 30% that are Active
        bins = Bin.query.filter(Bin.fill_level >= 30.0, Bin.status == 'Active').all()
    else:
        bins = Bin.query.filter(Bin.id.in_(bin_ids)).all()
        
    bins_data = [b.to_dict() for b in bins]
    vehicle_data = vehicle.to_dict()
    
    # Run optimizer
    result = optimize_route(bins_data, vehicle_data, depot_lat, depot_lon)
    
    # Save optimized route to DB
    route_name = f"Route for Vehicle {vehicle.vehicle_number} - Bin count {len(result['route_order'])}"
    r = Route(
        name=route_name,
        status='Pending',
        total_distance=result['total_distance'],
        estimated_time=result['estimated_time'],
        fuel_consumption=result['fuel_consumption'],
        co2_emissions=result['co2_emissions'],
        collection_cost=result['collection_cost']
    )
    r.set_coordinates(result['path'])
    db.session.add(r)
    db.session.commit()
    
    # Assign route to vehicle
    vehicle.assigned_route_id = r.id
    db.session.commit()
    
    # Format response including detailed routing details
    response_data = r.to_dict()
    response_data['route_order'] = result['route_order']
    
    return jsonify(response_data), 200

@routes_bp.route('/live-route', methods=['GET'])
@jwt_required()
def get_live_route():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    
    if user.role != 'Driver':
        # Operators / Admins can query active routes for any vehicle by vehicle_id query param
        v_id = request.args.get('vehicle_id')
        if not v_id:
            return jsonify({'message': 'driver role or vehicle_id parameter required'}), 400
        vehicle = Vehicle.query.get(int(v_id))
    else:
        vehicle = user.assigned_vehicle
        
    if not vehicle:
        return jsonify({'message': 'No assigned vehicle found'}), 404
        
    if not vehicle.assigned_route_id:
        return jsonify({'message': 'No active route assigned to this vehicle'}), 404
        
    route = Route.query.get(vehicle.assigned_route_id)
    if not route:
        return jsonify({'message': 'Route not found'}), 404
        
    # Re-extract bins collected in this route by querying coordinates matching bins
    route_dict = route.to_dict()
    
    # Bins collected (we'll fetch bins in this route area or simply bins with high fill levels)
    # For a fully fledged driver view, we can return bins that match the route name,
    # or simulated bins assigned to this driver's current run.
    # Let's return all active bins that have fill level >= 30% as the checklist for simplicity
    bins = Bin.query.filter(Bin.fill_level >= 30.0, Bin.status == 'Active').all()
    route_dict['bins'] = [b.to_dict() for b in bins]
    
    return jsonify(route_dict), 200

@routes_bp.route('/<int:route_id>', methods=['PUT'])
@jwt_required()
def update_route_status(route_id):
    r = Route.query.get(route_id)
    if not r:
        return jsonify({'message': 'Route not found'}), 404
        
    data = request.get_json() or {}
    if 'status' in data:
        r.status = data['status']
        
        # If route is completed, disassociate route from vehicle and reset vehicle's position to depot
        if r.status == 'Completed':
            vehicles = Vehicle.query.filter_by(assigned_route_id=r.id).all()
            for v in vehicles:
                v.assigned_route_id = None
                # Reset coordinates to depot (Bangalore Center)
                v.latitude = 12.9716
                v.longitude = 77.5946
                
    db.session.commit()
    return jsonify(r.to_dict()), 200
