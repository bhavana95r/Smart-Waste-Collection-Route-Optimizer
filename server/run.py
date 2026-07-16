import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from app.database import db
from config import Config

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for all routes (configured for frontend connection)
    CORS(app)
    
    # Initialize DB connection
    db.init_app(app)
    
    # Initialize JWT Manager
    jwt = JWTManager(app)
    
    # Import blueprints inside application factory to prevent circular imports
    from app.routes.auth import auth_bp
    from app.routes.bins import bins_bp
    from app.routes.vehicles import vehicles_bp
    from app.routes.routes import routes_bp
    from app.routes.analytics import analytics_bp
    from app.routes.notifications import notifications_bp
    
    # Register routes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(bins_bp, url_prefix='/api/bins')
    app.register_blueprint(vehicles_bp, url_prefix='/api/vehicles')
    app.register_blueprint(routes_bp, url_prefix='/api/routes')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    
    @app.route('/health', methods=['GET'])
    def health_check():
        return {'status': 'healthy', 'message': 'Smart Waste Optimizer Backend is online'}
        
    return app

app = create_app()

# Import all models so SQLAlchemy knows about them
import app.models

# Create database tables automatically
with app.app_context():
    db.create_all()
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
