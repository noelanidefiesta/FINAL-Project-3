from datetime import date
from werkzeug.security import generate_password_hash, check_password_hash
from . import db

class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)

    gigs = db.relationship("Gig", back_populates="user", cascade="all, delete-orphan")
    sets = db.relationship("Set", back_populates="user", cascade="all, delete-orphan")
    tracks = db.relationship("Track", back_populates="user", cascade="all, delete-orphan")

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {"id": self.id, "username": self.username, "email": self.email}


class Gig(db.Model):
    __tablename__ = "gigs"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    venue = db.Column(db.String(200))
    gig_date = db.Column(db.Date)
    notes = db.Column(db.Text)

    user = db.relationship("User", back_populates="gigs")
    sets = db.relationship("Set", back_populates="gig")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "venue": self.venue,
            "gig_date": self.gig_date.isoformat() if self.gig_date else None,
            "notes": self.notes,
        }


class Set(db.Model):
    __tablename__ = "sets"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    gig_id = db.Column(db.Integer, db.ForeignKey("gigs.id"))
    name = db.Column(db.String(200), nullable=False)
    notes = db.Column(db.Text)

    user = db.relationship("User", back_populates="sets")
    gig = db.relationship("Gig", back_populates="sets")
    items = db.relationship("SetItem", back_populates="set", cascade="all, delete-orphan", order_by="SetItem.position")

    def to_dict(self, include_items=False):
        data = {
            "id": self.id,
            "user_id": self.user_id,
            "gig_id": self.gig_id,
            "name": self.name,
            "notes": self.notes,
        }
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        return data


class Track(db.Model):
    __tablename__ = "tracks"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    title = db.Column(db.String(200), nullable=False)
    artist = db.Column(db.String(200), nullable=False)
    bpm = db.Column(db.Integer)
    musical_key = db.Column(db.String(30))
    energy = db.Column(db.String(30))
    notes = db.Column(db.Text)

    user = db.relationship("User", back_populates="tracks")
    set_items = db.relationship("SetItem", back_populates="track")

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "artist": self.artist,
            "bpm": self.bpm,
            "musical_key": self.musical_key,
            "energy": self.energy,
            "notes": self.notes,
        }


class SetItem(db.Model):
    __tablename__ = "set_items"

    id = db.Column(db.Integer, primary_key=True)
    set_id = db.Column(db.Integer, db.ForeignKey("sets.id"), nullable=False, index=True)
    track_id = db.Column(db.Integer, db.ForeignKey("tracks.id"), nullable=False, index=True)
    position = db.Column(db.Integer, nullable=False, default=0)
    notes = db.Column(db.Text)

    set = db.relationship("Set", back_populates="items")
    track = db.relationship("Track", back_populates="set_items")

    __table_args__ = (
        db.UniqueConstraint("set_id", "position", name="uq_set_position"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "set_id": self.set_id,
            "track_id": self.track_id,
            "position": self.position,
            "notes": self.notes,
            "track": self.track.to_dict() if self.track else None,
        }
