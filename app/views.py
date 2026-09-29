from flask_login import current_user, AnonymousUserMixin, login_user
from flask import Blueprint, redirect, url_for, render_template, request, flash
from app.database import db, Instance, SESSION_USER
from app.pages import pages
from app.forms import SetupForm, get_errors
from werkzeug.security import check_password_hash, generate_password_hash
from typing import cast


app_bp = Blueprint("app", __name__)


def i() -> Instance | None:
    return db.session.get(Instance, 1)


@app_bp.get("/")
def index():
    # An instance must exist in order for the ""main"" app to be accessible.
    if not i(): return redirect(url_for("app.setup"))

    if isinstance(current_user, AnonymousUserMixin):
        return redirect(url_for("app.login"))

    return render_template("index.html", pages=pages.get_pages())


@app_bp.route("/setup", methods=["GET", "POST"])
def setup():
    # If an instance already exists, setup cannot be done again.
    if i(): return redirect(url_for("app.index"))

    form = SetupForm(request.form)
    if request.method == "GET":
        return render_template("setup.html", form=form)

    if not form.validate():
        flash(get_errors(form), "error")
        return render_template("setup.html", form=form)

    db.session.add(Instance(
        generate_password_hash(cast(str, form.password.data))
    ))
    db.session.commit()

    login_user(SESSION_USER)

    return redirect(url_for("app.index"))


@app_bp.route("/login", methods=["GET", "POST"])
def login():
    # An instance must exist in order for the ""main"" app to be accessible.
    instance = i()
    if not instance: return redirect(url_for("app.setup"))

    if request.method == "GET":
        return render_template("login.html")

    # The login requires the master password to match the initial setup 
    # password.

    password = request.form.get("password", "")

    if not check_password_hash(instance.password_hash, password):
        flash("Incorrect password.", "error")
        return render_template("login.html") 

    login_user(SESSION_USER)

    return redirect(url_for("app.index"))
