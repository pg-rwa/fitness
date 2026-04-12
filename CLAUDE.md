# Peqo

Your AI fitness companion. A multi-role fitness SaaS platform for trainers and clients.

## Tech Stack

- **Backend:** Node.js 20 / Express 5 / SQLite (better-sqlite3) with WAL mode
- **Frontend:** Next.js 14 / React 18 / Tailwind CSS (port 3002)
- **Admin Panel:** Next.js 14 / Tailwind CSS (port 3001)
- **Mobile:** Expo 54 / React Native / NativeWind / Expo Router
- **Auth:** JWT (access + refresh tokens) / bcryptjs / role-based (admin, trainer, client)
- **Real-time:** WebSocket (ws) for notifications
- **AI:** Anthropic Claude SDK for insights
- **Testing:** Jest + Supertest
- **Deployment:** Docker Compose + Nginx reverse proxy + Let's Encrypt SSL

## Architecture

- **Module Registry Pattern** — auto-discovers modules in `src/modules/`, each with routes/controller/service/validations
- **Event Bus** — pub/sub for inter-module communication (workout.completed, meal.logged, etc.)
- **Custom Fields Engine** — dynamic fields on any entity at runtime
- **Feature Flags** — toggle modules on/off via DB or env vars
- **File Upload Abstraction** — S3 or local storage adapter
- **RBAC Middleware** — `authorize('trainer', 'admin')` guards on all routes

## Project Structure

```
src/
├── app.js, server.js          # Express app + HTTP/WebSocket server
├── config/                    # database, auth, features, migrator
├── modules/                   # 15+ feature modules
│   ├── auth/                  # register, login, invitations, refresh tokens
│   ├── users/                 # profiles, user management
│   ├── workouts/              # basic workout CRUD
│   ├── exercises/             # 100+ exercise library
│   ├── equipment/             # gym equipment inventory
│   ├── workout-templates/     # reusable templates with supersets
│   ├── workout-sessions/      # detailed session + set logging
│   ├── assigned-workouts/     # trainer assigns to clients
│   ├── goals/                 # fitness goals
│   ├── progress/              # measurements, PRs, volume analytics
│   ├── nutrition/             # 110+ foods, meals, macros, presets
│   ├── scheduling/            # session scheduling
│   ├── notifications/         # real-time + email alerts
│   ├── health-sync/           # Apple Health / Google Fit
│   ├── ai-insights/           # Claude AI analysis
│   ├── calendar/              # unified calendar view
│   ├── custom-fields/         # dynamic entity fields
│   └── admin/                 # admin management endpoints
└── shared/
    ├── middleware/             # authenticate, authorize, rate-limit, validate, upload, error-handler
    ├── services/              # event-bus, module-registry, websocket, email, file-upload, logger, metrics
    └── utils/                 # errors, pagination
frontend/                      # Next.js web app (login, dashboard, workouts, nutrition, progress, etc.)
admin/                         # Next.js admin panel (users, trainers, equipment, foods, feature flags)
mobile/                        # React Native Expo app (tabs: home, workouts, profile)
migrations/                    # 7 migration files (001-007)
prisma/seed.js + data/         # seed data: exercises, foods, templates
tests/                         # 12 test files
deploy/                        # Docker, nginx, SSL, backup, rollback scripts
```

## Database

SQLite at `data/fitness.db`. Key tables: users, user_profiles, exercises, equipment, workout_templates, template_exercises, workout_sessions, session_exercises, exercise_sets, personal_records, goals, progress_measurements, food_items, meals, meal_presets, nutrition_targets, notifications, ai_insights, scheduled_sessions, refresh_tokens, invitations, health_sync_profiles, custom_field_definitions, custom_field_values, file_uploads.

## Commands

```bash
npm install          # install dependencies
npm run dev          # start dev server (port 3000)
npm test             # run Jest test suite
node prisma/seed.js  # seed database
```

## Frontend/Admin Dev

```bash
cd frontend && npm install && npm run dev   # web app on port 3002
cd admin && npm install && npm run dev      # admin panel on port 3001
cd mobile && npm install && npx expo start  # mobile app
```

## Docker

```bash
docker compose up --build              # dev: API + admin + frontend
docker compose -f docker-compose.prod.yml up --build  # prod: + nginx + SSL
```

## Deployment (DigitalOcean)

- **Droplet IP:** 64.227.187.54
- **HTTP Port:** 3080 (confirmed working — do NOT change)
- **Access:** DO Console only — never touch local terminal for deployment
- **App URL:** http://64.227.187.54:3080/
- **API:** http://64.227.187.54:3080/api/health
- **Admin:** http://64.227.187.54:3080/admin/

Scripts in `deploy/`: deploy.sh, dev-deploy.sh, setup.sh, quickstart.sh, backup.sh, rollback.sh, ssl-renew.sh, remote-deploy.sh.
Nginx config in `deploy/nginx/`.
Routes: `/api/*` -> API, `/admin/*` -> Admin, `/` -> Frontend.

### Deployment Rules
1. **DO Console only** — all droplet commands are run via DigitalOcean web console, not local SSH/terminal
2. **Port 3080 only** — the fitness app runs on port 3080. Do not use or modify any other ports on the droplet
3. **docker-compose.prod.yml** uses `HTTP_PORT` env var → set `HTTP_PORT=3080` in `.env`

## Git

- **Branch:** `claude/fitness-app-auth-setup-6Iz0S`
- **Remote:** origin

## What's Built (Phases 1-11 complete)

1. Modular architecture with module registry, event bus, custom fields, feature flags
2. Multi-role auth (admin/trainer/client) with JWT, refresh tokens, invitations
3. Equipment library + exercise database (100+ seeded exercises)
4. Workout templates with supersets, machine settings, duplication
5. Workout session logging with sets, reps, weight, RPE, mood, auto PR detection
6. Trainer -> client workout assignment
7. Progress tracking: body measurements, volume analytics, personal records
8. Nutrition: 110+ food database, meal logging, macro tracking, presets, targets
9. Scheduling: trainer schedules client sessions
10. Notifications: in-app + WebSocket real-time
11. AI insights via Claude API
12. Health sync infrastructure (Apple Health / Google Fit)
13. Calendar: unified monthly view
14. Web frontend (Next.js): login, register, full dashboard with all features
15. Admin panel (Next.js): user/trainer/equipment/food/feature management
16. Mobile app (React Native/Expo): tabs for home, workouts, profile
17. Production deployment: Docker, Nginx, SSL, monitoring, logging, metrics
18. Rate limiting, file uploads, email service, CORS, Helmet

## Recent Fixes (Session 2026-02-23)

- **Auto-seed on startup** (`src/app.js`): Exercises (103) and food items (192) are now auto-seeded when tables are empty on app startup. Previously `node prisma/seed.js` had to be run manually, which Docker didn't do — caused empty exercise dropdowns on fresh deploys.
- **Exercise modal error visibility** (`frontend/.../templates/page.js`, `frontend/.../workouts/page.js`): ExerciseSearchModal now shows actual API error messages in red instead of silently swallowing with `.catch(() => {})`.

## Known Issues / Notes

- The exercises API controller (`src/modules/exercises/controller.js`) imports `paginate`/`paginatedResponse` but doesn't use them — returns a plain array. The `limit` query param is ignored. Works fine since frontend handles both array and `{data:[]}` formats, but inconsistent with other modules.
- Frontend `next.config.js` has a rewrite rule that proxies `/api/*` to `http://localhost:3000` — only relevant when accessing the frontend directly (not through nginx). In production via nginx on port 3080, API routing works correctly through nginx's `/api/` location block.
- Docker volume `db-data` persists the SQLite database between container rebuilds.

## What's Left (from PLAN.md)

- Progress photos with comparison
- Trainer availability / booking approval flow
- Push notifications (mobile)
- Advanced analytics (charts, CSV export)
- Social features (challenges, leaderboards)
- App Store submission
