import os
from flask import Flask
from flask_cors import CORS
try:
    from flask_migrate import Migrate
except ModuleNotFoundError:
    Migrate = None
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

db = SQLAlchemy()
migrate = Migrate() if Migrate else None

def create_app(test_config=None):
    load_dotenv()
    app = Flask(__name__)
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "dev-secret")
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

    if test_config:
        app.config.update(test_config)
    else:
        database_url = os.getenv("DATABASE_URL", "sqlite:///app.db")
        app.config["SQLALCHEMY_DATABASE_URI"] = database_url

    db.init_app(app)
    (migrate.init_app(app, db) if migrate else None)

    CORS(app, supports_credentials=True, resources={r"/api/*": {"origins": ["http://localhost:5173"]}})

    from .routes.auth import auth_bp
    from .routes.gigs import gigs_bp
    from .routes.tracks import tracks_bp
    from .routes.sets import sets_bp

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(gigs_bp, url_prefix="/api")
    app.register_blueprint(tracks_bp, url_prefix="/api")
    app.register_blueprint(sets_bp, url_prefix="/api")

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    return app
