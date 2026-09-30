import os
from pathlib import Path
from flask import Flask
from flask_login import LoginManager
from flask_migrate import Migrate, upgrade

from app.api_views import api_bp
from app.database import SESSION_USER, SessionUser, db
from app.pages import PagesTree
from app.views import app_bp



def create_app(target_dir: Path, data_dir: Path | None = None) -> Flask:
    app = Flask(__name__)

    if data_dir is None:
        data_dir = Path(
            os.getenv("GITMD_DATA_DIR", Path.home() / ".gitmd")
        ).resolve()
    data_dir.mkdir(parents=True, exist_ok=True)

    db_path = data_dir / "db.sqlite3"

    app.config["DEBUG"] = os.getenv("DEBUG", "false").lower() == "true"
    app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", os.urandom(24).hex())
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"
    app.config["DOCS_ROOT"] = target_dir.resolve()

    app.register_blueprint(app_bp)
    app.register_blueprint(api_bp)

    login_manager = LoginManager(app)
    Migrate(app, db)
    db.init_app(app)

    app.extensions["PAGES"] = PagesTree(app.config["DOCS_ROOT"])

    # Automatically apply latest migrations and create tables (if they don't 
    # already exist)
    with app.app_context():
        upgrade()
        db.create_all()

    @login_manager.user_loader
    def load_user(user_id: str) -> SessionUser | None:
        if user_id == "SESSION":
            return SESSION_USER
        return None

    return app
