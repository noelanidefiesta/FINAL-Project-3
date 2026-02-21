from flask import Blueprint, request
from sqlalchemy import or_
from .. import db
from ..models import Track, SetItem, Set, Gig
from ..auth_utils import login_required, current_user, get_owned

tracks_bp = Blueprint("tracks", __name__)

@tracks_bp.get("/tracks")
@login_required
def list_tracks():
    user = current_user()
    q = (request.args.get("q") or "").strip()
    page = int(request.args.get("page") or 1)
    per_page = int(request.args.get("per_page") or 20)
    per_page = max(1, min(per_page, 100))

    query = Track.query.filter_by(user_id=user.id)

    if q:
        like = f"%{q.lower()}%"
        query = query.filter(or_(Track.title.ilike(like), Track.artist.ilike(like), Track.energy.ilike(like)))

    pagination = query.order_by(Track.id.desc()).paginate(page=page, per_page=per_page, error_out=False)
    return {
        "tracks": [t.to_dict() for t in pagination.items],
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
    }, 200

@tracks_bp.post("/tracks")
@login_required
def create_track():
    user = current_user()
    data = request.get_json() or {}
    title = (data.get("title") or "").strip()
    artist = (data.get("artist") or "").strip()
    if not title or not artist:
        return {"error": "title and artist are required"}, 400

    bpm = data.get("bpm")
    if bpm is not None:
        try:
            bpm = int(bpm)
        except (TypeError, ValueError):
            return {"error": "bpm must be an integer"}, 400

    track = Track(
        user_id=user.id,
        title=title,
        artist=artist,
        bpm=bpm,
        musical_key=(data.get("musical_key") or "").strip() or None,
        energy=(data.get("energy") or "").strip() or None,
        notes=data.get("notes"),
    )
    db.session.add(track)
    db.session.commit()
    return track.to_dict(), 201

@tracks_bp.get("/tracks/<int:track_id>")
@login_required
def get_track(track_id):
    user = current_user()
    track, err = get_owned(Track, track_id, user.id)
    if err:
        return err
    return track.to_dict(), 200

@tracks_bp.patch("/tracks/<int:track_id>")
@login_required
def update_track(track_id):
    user = current_user()
    track, err = get_owned(Track, track_id, user.id)
    if err:
        return err

    data = request.get_json() or {}

    if "title" in data:
        title = (data.get("title") or "").strip()
        if not title:
            return {"error": "title is required"}, 400
        track.title = title

    if "artist" in data:
        artist = (data.get("artist") or "").strip()
        if not artist:
            return {"error": "artist is required"}, 400
        track.artist = artist

    if "bpm" in data:
        bpm = data.get("bpm")
        if bpm is None or bpm == "":
            track.bpm = None
        else:
            try:
                track.bpm = int(bpm)
            except (TypeError, ValueError):
                return {"error": "bpm must be an integer"}, 400

    if "musical_key" in data:
        track.musical_key = (data.get("musical_key") or "").strip() or None

    if "energy" in data:
        track.energy = (data.get("energy") or "").strip() or None

    if "notes" in data:
        track.notes = data.get("notes")

    db.session.commit()
    return track.to_dict(), 200

@tracks_bp.delete("/tracks/<int:track_id>")
@login_required
def delete_track(track_id):
    user = current_user()
    track, err = get_owned(Track, track_id, user.id)
    if err:
        return err
    db.session.delete(track)
    db.session.commit()
    return {}, 204


@tracks_bp.get("/tracks/<int:track_id>/usage")
@login_required
def track_usage(track_id):
    user = current_user()
    track, err = get_owned(Track, track_id, user.id)
    if err:
        return err

    rows = (
        db.session.query(SetItem, Set, Gig)
        .join(Set, SetItem.set_id == Set.id)
        .outerjoin(Gig, Set.gig_id == Gig.id)
        .filter(SetItem.track_id == track.id, Set.user_id == user.id)
        .order_by(Gig.gig_date.desc().nullslast(), Set.id.desc(), SetItem.position.asc())
        .all()
    )

    usage = []
    for item, s, g in rows:
        usage.append(
            {
                "set_item_id": item.id,
                "set_id": s.id,
                "set_name": s.name,
                "position": item.position,
                "gig": g.to_dict() if g else None,
            }
        )

    last_played = None
    for u in usage:
        if u["gig"] and u["gig"].get("gig_date"):
            last_played = u["gig"]["gig_date"]
            break

    return {"track": track.to_dict(), "usage": usage, "last_played": last_played}, 200
