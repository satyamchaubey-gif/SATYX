# SATYX Full-Stack Production Starter

## Stack
- Customer frontend: HTML/CSS/JS
- Backend: Python + FastAPI
- Database: MongoDB
- Authentication: JWT + bcrypt
- Private admin dashboard
- Server-side order pricing and inventory decrement

## Run
1. Install Python 3.11+ and MongoDB (local or Atlas).
2. `cd backend`
3. `python -m venv .venv`
4. Activate the environment.
5. `pip install -r requirements.txt`
6. Copy `.env.example` to `.env` and set strong secrets.
7. `python seed.py`
8. `uvicorn app.main:app --reload`
9. Serve `frontend/` using VS Code Live Server.
10. Open `admin.html` for the private admin dashboard.

## Production security
Before taking real orders: use HTTPS, restrict CORS to the exact frontend domain, use strong secrets, add rate limiting, verification/anti-abuse controls, backups, monitoring, secure file storage, and server-side payment webhook verification. Never commit `.env`.

The checkout in this starter does not process real payments yet.
