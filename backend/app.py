from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from utils.logger import get_logger, configure_flask_logging
from routes.auth_routes import auth_bp
from routes.learning_content_routes import learning_bp
from routes.lesson_routes import lesson_bp
from routes.performance_routes import performance_bp
from routes.learning_intelligence_routes import intelligence_bp
from routes.quiz_routes import quiz_bp
from routes.adaptive_learning_routes import adaptive_bp
from routes.session_manager_routes import session_bp
from routes.voice_guidance_routes import voice_bp
from routes.assessment_routes import assessment_bp
from routes.dashboard_routes import dashboard_bp
from routes.challenge_routes import challenge_bp
from routes.hardware_routes import hardware_bp

# Initialize the Flask application
app = Flask(__name__)

# Enable Cross-Origin Resource Sharing (CORS)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

# Load configuration class attributes (such as JWT_SECRET_KEY) into Flask config
app.config.from_object(Config)

# Initialize the Flask-JWT-Extended manager
jwt = JWTManager(app)

# Configure structured logging
logger = get_logger(__name__)
configure_flask_logging(app)

# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(learning_bp)
app.register_blueprint(lesson_bp)
app.register_blueprint(performance_bp)
app.register_blueprint(intelligence_bp)
app.register_blueprint(quiz_bp)
app.register_blueprint(adaptive_bp)
app.register_blueprint(session_bp)
app.register_blueprint(voice_bp)
app.register_blueprint(assessment_bp)
app.register_blueprint(dashboard_bp)
app.register_blueprint(challenge_bp)
app.register_blueprint(hardware_bp)




@app.route("/", methods=["GET"])
def root():
    """
    Root endpoint to confirm that the BrailleWise backend is active and running.
    """
    return jsonify({
        "message": "BrailleWise Backend Running"
    })

if __name__ == "__main__":
    # Start the Flask development server
    logger.info("Starting BrailleWise backend on http://0.0.0.0:5000")
    app.run(host="0.0.0.0", port=5000, debug=True, use_reloader=False)
