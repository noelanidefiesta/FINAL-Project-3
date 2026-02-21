from flask import Blueprint, request, session, jsonify
from sqlalchemy.exc import IntegrityError
from .. import db
from ..models import User
from ..auth_utils import current_user, login_required

auth_bp = Blueprint("auth", __name__)

@auth_bp.post("/signup")
def signup():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or not email or not password:
        return {"error": "username, email, and password are required"}, 400
    if len(password) < 6:
        return {"error": "password must be at least 6 characters"}, 400

    user = User(username=username, email=email)
    user.set_password(password)

    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return {"error": "email already in use"}, 409

    session["user_id"] = user.id
    return user.to_dict(), 201

@auth_bp.post("/login")
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return {"error": "email and password are required"}, 400

    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return {"error": "invalid credentials"}, 401

    session["user_id"] = user.id
    return user.to_dict(), 200

@auth_bp.delete("/logout")
def logout():
    session.pop("user_id", None)
    return {}, 204

@auth_bp.get("/me")
@login_required
def me():
    user = current_user()
    return user.to_dict(), 200
