from datetime import date
from flask import Blueprint, request
from .. import db
from ..models import Gig
from ..auth_utils import login_required, current_user, get_owned

gigs_bp = Blueprint("gigs", __name__)

@gigs_bp.get("/gigs")
@login_required
def list_gigs():
    user = current_user()
    gigs = Gig.query.filter_by(user_id=user.id).order_by(Gig.gig_date.desc().nullslast(), Gig.id.desc()).all()
    return {"gigs": [g.to_dict() for g in gigs]}, 200

@gigs_bp.post("/gigs")
@login_required
def create_gig():
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    if not title:
        return {"error": "title is required"}, 400

    gig_date = None
    if data.get("gig_date"):
        try:
            gig_date = date.fromisoformat(data["gig_date"])
        except ValueError:
            return {"error": "gig_date must be ISO format YYYY-MM-DD"}, 400

    gig = Gig(
        user_id=user.id,
        title=title,
        venue=(data.get("venue") or "").strip() or None,
        gig_date=gig_date,
        notes=data.get("notes"),
    )
    db.session.add(gig)
    db.session.commit()
    return gig.to_dict(), 201

@gigs_bp.get("/gigs/<int:gig_id>")
@login_required
def get_gig(gig_id):
    user = current_user()
    gig, err = get_owned(Gig, gig_id, user.id)
    if err:
        return err
    return gig.to_dict(), 200

@gigs_bp.patch("/gigs/<int:gig_id>")
@login_required
def update_gig(gig_id):
    user = current_user()
    gig, err = get_owned(Gig, gig_id, user.id)
    if err:
        return err

    data = request.get_json() or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return {"error": "title is required"}, 400
        gig.title = title

    if "venue" in data:
        gig.venue = (data.get("venue") or "").strip() or None

    if "notes" in data:
        gig.notes = data.get("notes")

    if "gig_date" in data:
        if data["gig_date"] is None or data["gig_date"] == "":
            gig.gig_date = None
        else:
            try:
                gig.gig_date = date.fromisoformat(data["gig_date"])
            except ValueError:
                return {"error": "gig_date must be ISO format YYYY-MM-DD"}, 400

    db.session.commit()
    return gig.to_dict(), 200

@gigs_bp.delete("/gigs/<int:gig_id>")
@login_required
def delete_gig(gig_id):
    user = current_user()
    gig, err = get_owned(Gig, gig_id, user.id)
    if err:
        return err
    db.session.delete(gig)
    db.session.commit()
    return {}, 204
