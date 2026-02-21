from flask import Blueprint, request
from sqlalchemy import func
from .. import db
from ..models import Set, Track, SetItem, Gig
from ..auth_utils import login_required, current_user, get_owned

sets_bp = Blueprint("sets", __name__)

@sets_bp.get("/sets")
@login_required
def list_sets():
    user = current_user()
    sets = Set.query.filter_by(user_id=user.id).order_by(Set.id.desc()).all()
    return {"sets": [s.to_dict() for s in sets]}, 200

@sets_bp.post("/sets")
@login_required
def create_set():
    user = current_user()
    data = request.get_json() or {}
    name = (data.get("name") or "").strip()
    if not name:
        return {"error": "name is required"}, 400

    gig_id = data.get("gig_id")
    if gig_id is not None:
        gig, err = get_owned(Gig, gig_id, user.id)
        if err:
            return ({"error": "gig_id not found"}, 404)

    s = Set(user_id=user.id, gig_id=gig_id, name=name, notes=data.get("notes"))
    db.session.add(s)
    db.session.commit()
    return s.to_dict(), 201

@sets_bp.get("/sets/<int:set_id>")
@login_required
def get_set(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err
    return s.to_dict(include_items=True), 200

@sets_bp.patch("/sets/<int:set_id>")
@login_required
def update_set(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err

    data = request.get_json() or {}

    if "name" in data:
        name = (data.get("name") or "").strip()
        if not name:
            return {"error": "name is required"}, 400
        s.name = name

    if "notes" in data:
        s.notes = data.get("notes")

    if "gig_id" in data:
        gig_id = data.get("gig_id")
        if gig_id is None:
            s.gig_id = None
        else:
            gig = Gig.query.filter_by(id=gig_id, user_id=user.id).first()
            if not gig:
                return {"error": "gig_id not found"}, 404
            s.gig_id = gig_id

    db.session.commit()
    return s.to_dict(), 200

@sets_bp.delete("/sets/<int:set_id>")
@login_required
def delete_set(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err
    db.session.delete(s)
    db.session.commit()
    return {}, 204

@sets_bp.get("/sets/<int:set_id>/items")
@login_required
def list_items(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err
    return {"items": [i.to_dict() for i in s.items]}, 200

@sets_bp.post("/sets/<int:set_id>/items")
@login_required
def add_item(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err

    data = request.get_json() or {}
    track_id = data.get("track_id")
    if not track_id:
        return {"error": "track_id is required"}, 400

    track, err = get_owned(Track, track_id, user.id)
    if err:
        return ({"error": "track not found"}, 404)

    max_pos = db.session.query(func.max(SetItem.position)).filter(SetItem.set_id == s.id).scalar()
    next_pos = 0 if max_pos is None else max_pos + 1

    item = SetItem(set_id=s.id, track_id=track.id, position=next_pos, notes=data.get("notes"))
    db.session.add(item)
    db.session.commit()
    return item.to_dict(), 201

@sets_bp.patch("/sets/<int:set_id>/items/<int:item_id>")
@login_required
def update_item(set_id, item_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err

    item = SetItem.query.filter_by(id=item_id, set_id=s.id).first()
    if not item:
        return {"error": "Not found"}, 404

    data = request.get_json() or {}
    if "notes" in data:
        item.notes = data.get("notes")

    if "position" in data:
        try:
            item.position = int(data.get("position"))
        except (TypeError, ValueError):
            return {"error": "position must be integer"}, 400

    db.session.commit()
    return item.to_dict(), 200

@sets_bp.delete("/sets/<int:set_id>/items/<int:item_id>")
@login_required
def delete_item(set_id, item_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err

    item = SetItem.query.filter_by(id=item_id, set_id=s.id).first()
    if not item:
        return {"error": "Not found"}, 404

    db.session.delete(item)
    db.session.commit()
    return {}, 204

@sets_bp.put("/sets/<int:set_id>/items/reorder")
@login_required
def reorder_items(set_id):
    user = current_user()
    s, err = get_owned(Set, set_id, user.id)
    if err:
        return err

    data = request.get_json() or {}
    order = data.get("order")
    if not isinstance(order, list):
        return {"error": "order must be a list of item ids"}, 400

    items_by_id = {i.id: i for i in s.items}
    if set(order) != set(items_by_id.keys()):
        return {"error": "order must include all current item ids exactly once"}, 400

    for idx, item_id in enumerate(order):
        items_by_id[item_id].position = idx + 1000
    db.session.flush()

    for idx, item_id in enumerate(order):
        items_by_id[item_id].position = idx

    db.session.commit()
    return {"items": [i.to_dict() for i in s.items]}, 200
