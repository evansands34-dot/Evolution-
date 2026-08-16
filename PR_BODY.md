---
Summary
- Phase 1: Backend auth scaffold (Express) with bcrypt + JWT + file-based users; signin UI (create & login tabs); header wiring; loader text updated to "welcome to Evolution".
- Phase 2: New header/search/management bar, client-side search & suggestions, recommended-items panel, product page redesign (image left, details right), improved cart UI, reviews tied to authenticated users, client helpers (ui.js, search.js).
- Phase 3 (initial): Evo AI end-to-end — /api/evoai endpoint on the server with optional OpenAI integration (enabled via OPENAI_API_KEY env var); client Evo AI panel calling the API; in-memory caching and request rate limits added.

Files / notable changes
- Backend: server.js, package.json (dependencies), users.json
- Frontend: signin.html, signin.js, auth.js, ui.js, search.js, evoai.js, updated home.html, shop.html, product.html, cart.html, index.html
- Products data remains in products.js (client-side)
- Branch: feature/redesign-auth-ui

How to run locally
1. git checkout feature/redesign-auth-ui
2. npm install
3. export JWT_SECRET="your_jwt_secret"
   (optional) export OPENAI_API_KEY="sk-..." to enable OpenAI responses
4. npm start
5. Visit:
   - http://localhost:3000/signin.html — create / sign in
   - http://localhost:3000/home.html, /shop.html, /product.html?id=1, /cart.html

API endpoints
- POST /api/register { firstName, lastName, password } -> { token, firstName, lastName }
- POST /api/login    { firstName, lastName, password } -> { token, firstName, lastName }
- GET  /api/me       (Authorization: Bearer <token>) -> { id, firstName, lastName }
- POST /api/evoai    { query, productId? } -> { answer }  (calls OpenAI when OPENAI_API_KEY is set; otherwise fallback to product data)

QA Checklist
1. Loader: home.html shows exactly "welcome to Evolution" and fades as before.
2. Sign-in flow:
   - Create account: fill first/last & password/confirm -> redirected to home; token saved.
   - Sign-in: valid credentials produce token, header shows first + last name.
   - Sign out: removes token and reloads.
3. Header/search: suggestions appear while typing; selecting suggestion opens product page.
4. Product page:
   - Image left, details right; Add to Cart adds item and navigates to cart.
   - Reviews: only signed-in users can post reviews.
   - Ask Evo AI: opens panel with contextual info.
5. Evo AI:
   - If OPENAI_API_KEY set in server environment, /api/evoai returns LLM answer.
   - Without key, server returns a product-aware fallback response.
6. Rate-limits: /api/* is rate-limited (30/min per IP).
7. Caching: Evo AI responses are cached in-memory (TTL: 5m for LLM, 1m for fallback).

Notes & limitations
- users.json is file-based; suitable for demo/local only. I recommend moving to SQLite/Postgres for production.
- Evo AI fallback extracts data from products.js using a simple parser — robust for demo, not production-grade.
- Caching is in-memory: on server restart the cache is lost. For persistent caching use Redis.
- OpenAI API key must be set as an environment variable on the host — NEVER commit it to the repository.

