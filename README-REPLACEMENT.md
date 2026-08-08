# SATYX — Root Replacement Bundle

This bundle is structured for the current SATYX GitHub repository:
https://github.com/satyamchaubey-gif/SATYX

## Important
- Keep the existing image files at repository root.
- Do NOT create an `assets/` folder just for these files.
- Upload/replace the root HTML/CSS/JS files from this bundle.
- `backend/` is separate because the Python API should be deployed separately from the static Vercel frontend.
- Never upload `.env`.

## Frontend
The root contains:
index.html, shop.html, drop-001.html, product.html, cart.html,
checkout.html, account.html, about.html, admin.html, style.css, script.js.

## Backend
`backend/` contains the FastAPI + MongoDB starter.

Before real customers use it:
1. Deploy the API separately.
2. Put its HTTPS URL into the frontend API constant.
3. Set MongoDB credentials as deployment environment variables.
4. Restrict CORS to the real SATYX domain.
5. Add rate limiting, email/mobile verification, payment gateway + webhook verification,
   backups, monitoring and proper admin authorization.

The frontend is not meant to contain database credentials.
