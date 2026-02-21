from functools import wraps
from flask import session, jsonify
from .models import User
from . import db

def current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    return db.session.get(User, user_id)

def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get("user_id"):
            return jsonify({"error": "Unauthorized"}), 401
        return fn(*args, **kwargs)
    return wrapper

def get_owned(model, record_id, user_id):
    obj = model.query.filter_by(id=record_id, user_id=user_id).first()
    if not obj:
        return None, ({"error": "Not found"}, 404)
    return obj, None
