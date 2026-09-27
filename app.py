from werkzeug.security import check_password_hash
from database import db, Instance, SessionUser, SESSION_USER
from dotenv import load_dotenv

from flask_migrate import Migrate
from flask_login import current_user, AnonymousUserMixin
from flask_login import LoginManager, login_user
from flask import Flask, redirect, url_for, request, render_template, flash

import os


load_dotenv()


app = Flask(__name__)

app.config["DEBUG"] = os.getenv("DEBUG", "false") == "true"
app.config["SECRET_KEY"] = os.environ["SECRET_KEY"]
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///./db.sqlite3"


login_manager = LoginManager(app)
migrate = Migrate(app, db)


@login_manager.user_loader
def load_user(user_id: str) -> SessionUser | None:
    if user_id == "SESSION":
        return SESSION_USER

    return None


db.init_app(app)


# A global instance, created during setup
def i() -> Instance | None:
    return db.session.get(Instance, 1)


@app.get("/")
def index():
    # An instance must exist in order for the ""main"" app to be accessible.
    if not i(): return redirect(url_for("setup"))

    if isinstance(current_user, AnonymousUserMixin):
        return redirect(url_for("login"))

    return ""


@app.route("/setup", methods=["GET", "POST"])
def setup():
    # If an instance already exists, setup cannot be done again.
    if i(): return redirect(url_for("index"))
    
    return render_template("setup.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    # An instance must exist in order for the ""main"" app to be accessible.
    instance = i()
    if not instance: return redirect(url_for("setup"))

    if request.method == "GET":
        return render_template("login.html")

    # The login requires the master password to match the initial setup 
    # password.

    password = request.form.get("password", "")

    if not check_password_hash(instance.password_hash, password):
        flash("Incorrect password.", "error")
        return render_template("login.html") 

    login_user(SESSION_USER)

    return redirect(url_for("index"))


if __name__ == "__main__":
    app.run("0.0.0.0", port=5000)
