from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app.models import Notification
from app.database import db

notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.route('', methods=['GET'])
@jwt_required()
def get_notifications():
    notifications = Notification.query.order_by(Notification.created_at.desc()).limit(30).all()
    return jsonify([n.to_dict() for n in notifications]), 200

@notifications_bp.route('/read/<int:notif_id>', methods=['PUT'])
@jwt_required()
def mark_read(notif_id):
    n = Notification.query.get(notif_id)
    if not n:
        return jsonify({'message': 'Notification not found'}), 404
        
    n.is_read = True
    db.session.commit()
    return jsonify(n.to_dict()), 200

@notifications_bp.route('/read-all', methods=['PUT'])
@jwt_required()
def mark_all_read():
    db.session.query(Notification).filter_by(is_read=False).update({Notification.is_read: True})
    db.session.commit()
    return jsonify({'message': 'All notifications marked as read'}), 200

@notifications_bp.route('/send-alert', methods=['POST'])
@jwt_required()
def send_alert():
    data = request.get_json() or {}
    message = data.get('message')
    alert_type = data.get('type', 'General') # Overflow, Breakdown, Route Update, Emergency
    
    if not message:
        return jsonify({'message': 'Missing message content'}), 400
        
    n = Notification(message=message, type=alert_type)
    db.session.add(n)
    db.session.commit()
    
    # In a full Socket.IO setup, we would broadcast the alert:
    # socketio.emit('new_alert', n.to_dict())
    
    return jsonify(n.to_dict()), 201
