from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models import User
from app.database import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    name = data.get('name')
    role = data.get('role', 'Operator') # Admin, Driver, Operator
    
    if not email or not password or not name:
        return jsonify({'message': 'Missing email, password or name'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'User with this email already exists'}), 400
        
    user = User(email=email, name=name, role=role)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'message': 'User registered successfully',
        'token': access_token,
        'user': user.to_dict()
    }), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Missing email or password'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401
        
    access_token = create_access_token(identity={'id': user.id, 'role': user.role})
    
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    identity = get_jwt_identity()
    user = User.query.get(identity['id'])
    if not user:
        return jsonify({'message': 'User not found'}), 444
    return jsonify(user.to_dict()), 200

@auth_bp.route('/logout', methods=['POST'])
def logout():
    # Stateless JWT logout on client side involves discarding token, 
    # but backend responds with success
    return jsonify({'message': 'Logged out successfully'}), 200
