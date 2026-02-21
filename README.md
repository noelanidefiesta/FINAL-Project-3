Final push
Noting ahead of time. I had a friend look this over and let me know that I need to do way more commits. I'm used to saving locally, and not pushing. So I know I don't have any other commits than what it's showing. I will make sure to do that in the future. 

# SetList Studio

A full-stack DJ gig + set planning app built with Flask (session auth) and React.

## Features

- Signup, login, logout (session-based)
- CRUD for Gigs, Sets, Tracks
- Sets can include ordered tracks through Set Items
- Ownership rules: you can only view/edit/delete your own data
- Track library supports pagination + search

## Tech Stack

- Backend: Flask, SQLAlchemy, Flask-Migrate, Flask-CORS
- Frontend: React (Vite), React Router

## Setup

### Backend

```bash
cd server
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
flask --app run.py db init
flask --app run.py db migrate -m "init"
flask --app run.py db upgrade
python run.py
```

Backend runs on `http://localhost:5555`.

### Frontend

```bash
cd client
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

## API Routes

Auth
- `POST /api/signup`
- `POST /api/login`
- `DELETE /api/logout`
- `GET /api/me`

Gigs
- `GET /api/gigs`
- `POST /api/gigs`
- `GET /api/gigs/:id`
- `PATCH /api/gigs/:id`
- `DELETE /api/gigs/:id`

Tracks
- `GET /api/tracks?page=&per_page=&q=`
- `POST /api/tracks`
- `GET /api/tracks/:id`
- `PATCH /api/tracks/:id`
- `DELETE /api/tracks/:id`

Sets
- `GET /api/sets`
- `POST /api/sets`
- `GET /api/sets/:id`
- `PATCH /api/sets/:id`
- `DELETE /api/sets/:id`
- `GET /api/sets/:id/items`
- `POST /api/sets/:id/items`
- `PATCH /api/sets/:id/items/:item_id`
- `DELETE /api/sets/:id/items/:item_id`
- `PUT /api/sets/:id/items/reorder`

## Tests

```bash
cd server
pytest -q
```
