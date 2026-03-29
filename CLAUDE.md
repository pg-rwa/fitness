# FitTracker

A multi-role fitness SaaS platform for trainers and clients.

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

## Current Focus: Mobile App (iOS & Android)

We are actively building the FitTracker mobile app for iOS and Android using Expo 54 / React Native / NativeWind / Expo Router.

### What's Built (Phase 7 — ~85% Complete)

**Infrastructure (Done):**
- Expo project with Expo Router file-based navigation
- NativeWind (Tailwind CSS for RN) styling with dark theme (coral/orange accents)
- JWT auth with expo-secure-store, automatic token refresh
- Offline-first architecture (request queuing, response caching, auto-retry)
- WebSocket real-time updates with auto-reconnect
- API client (`mobile/lib/api.js`) with offline queue and cache
- Reusable UI component library (`mobile/components/ui.js`)
- Push notifications via expo-notifications with Android channels
- Image handling (camera, picker, resizer)

**Auth Screens (Done):**
- Welcome/onboarding carousel, Login, Register (with invite code), Forgot password

**Client Screens (Done):**
- Home Dashboard — today's schedule, meals progress, streak, AI insight
- Workouts — session history, templates, start new workout
- Workout Session — exercise list, set logging (reps/weight/RPE), rest timer, mood
- Nutrition — daily macros vs targets, meal logging, food search, presets, photo upload
- Progress — body measurements with trends, progress photos with compare
- Calendar — month/week view aggregating all events
- Profile — edit profile, notification prefs, health sync toggle

**Trainer Screens (Done):**
- Dashboard — client metrics, upcoming sessions, templates
- Client List & Detail — tabbed view (workouts, schedule, nutrition, progress)
- Template Builder — exercises, targets, machine settings, superset groups
- Schedule Management — weekly availability, approve/decline sessions
- Equipment & Exercise management

**Health Integration (Partial):**
- UI and platform abstraction built (`mobile/lib/health.js`)
- Manual logging works; native HealthKit/Health Connect needs EAS dev client builds

**Push Notifications (Done):**
- Token registration, Android channels, local scheduling, badge management

### What's Left

1. **Native health module builds** — Apple HealthKit & Google Health Connect require `eas build` with dev client profile (code is ready, just needs native build)
2. **App Store submission** — Need Apple Developer & Google Play credentials, privacy policy, TestFlight/internal testing, then production release
3. **Minor polish** — Celebration animations refinement, edge case UI fixes

### Key Files
- `mobile/app/` — All screens (Expo Router file-based)
- `mobile/components/` — UI library, ExerciseSearchModal, RestTimer, ErrorBoundary
- `mobile/lib/` — api.js, websocket.js, offline.js, health.js, notifications.js, format.js, image.js
- `mobile/contexts/AuthContext.js` — Auth state management
- `mobile/app.json` — App config (bundle ID: com.fittracker.app)
- `mobile/eas.json` — EAS Build profiles (dev/preview/production)

### Build Commands
```bash
cd mobile && npm install && npx expo start          # Dev (Expo Go)
eas build --profile development --platform all      # Dev client build
eas build --profile preview --platform all           # Preview build
eas build --profile production --platform ios        # Production iOS
eas build --profile production --platform android    # Production Android
eas submit --platform ios                            # Submit to App Store
eas submit --platform android                        # Submit to Play Store
```
