# Fitness App — Full Implementation Plan

## Design Principles (Applied Everywhere)

1. **Module Registry Pattern** — Every feature is a self-registering module with its own routes, controllers, services, models, and validations. Modules can be enabled/disabled via feature flags without touching other code.
2. **Custom Fields Engine** — Any entity (user, exercise, equipment, meal) can have arbitrary fields added at runtime. No schema migrations needed for new attributes.
3. **Event Bus** — Modules communicate via events (`workout.completed`, `meal.logged`, `session.booked`). New modules just subscribe to events they care about. This allows AI, notifications, and future modules to hook in without modifying existing code.
4. **Role-Based Access Control (RBAC)** — Every route declares required role(s). Adding new roles later is just config.
5. **File Upload Abstraction** — All photos/files go through a single upload service. Swap S3 for R2 or local storage by changing one adapter.

---

## Phase 1: Foundation Refactor
**Goal**: Transform current codebase into the modular architecture. No new features yet — just restructure so everything that follows is clean.

### Step 1.1: Project Restructure
- Reorganize from flat `src/routes`, `src/controllers` into module-based structure:
  ```
  src/
  ├── modules/
  │   ├── auth/        (routes, controller, service, validation)
  │   ├── users/       (routes, controller, service, validation)
  │   ├── workouts/    (routes, controller, service, validation)
  │   ├── exercises/   (routes, controller, service, validation)
  │   └── goals/       (routes, controller, service, validation)
  ├── shared/
  │   ├── middleware/   (auth, rbac, validate, upload, error-handler)
  │   ├── services/     (database, file-upload, event-bus, custom-fields)
  │   └── utils/        (pagination, date-helpers, response-helpers)
  ├── config/           (database, auth, storage, features)
  └── app.js + server.js
  ```
- Create `ModuleRegistry` — auto-discovers and loads modules from `src/modules/`
- Create `EventBus` — simple pub/sub for inter-module communication
- Move error handler to shared middleware with structured error classes

### Step 1.2: Database Upgrade to PostgreSQL
- Replace better-sqlite3 with `pg` (node-postgres)
- Create migration system (numbered SQL files in `migrations/`)
- Write initial migration with all current tables
- Update database service with connection pooling
- Add Redis setup for caching and sessions (via `ioredis`)
- Update `.env.example` with PostgreSQL + Redis connection strings
- Update tests to use a test database (auto-create/drop per test run)

### Step 1.3: Multi-Role Auth System
- Add `role` column to users table: `admin`, `trainer`, `client`
- Add `trainer_id` FK on users (nullable — links client to trainer)
- Add `status` column: `active`, `invited`, `suspended`
- Create RBAC middleware: `authorize('trainer', 'admin')` pattern
- Create invitation flow: trainer invites client via email → client registers with invite token
- Update JWT payload to include role
- Add refresh token rotation (refresh_tokens table)
- Update all existing routes with proper role guards
- Write tests for role-based access

### Step 1.4: File Upload Service
- Create abstract `StorageAdapter` interface (`upload`, `delete`, `getSignedUrl`)
- Implement `LocalStorageAdapter` (for dev — stores in `uploads/` dir)
- Implement `S3StorageAdapter` (for production — S3-compatible including R2)
- Create `file_uploads` table (tracks all uploaded files, entity associations)
- Create upload middleware (multer + size limits + mime type validation)
- Create thumbnail generation for images (sharp library)
- Add `DELETE /api/files/:id` for cleanup
- Write tests

### Step 1.5: Custom Fields Engine
- Create `custom_field_definitions` table (entity_type, name, field_type, options, created_by)
- Create `custom_field_values` table (entity_type, entity_id, field_def_id, value, recorded_at)
- Supported field types: `text`, `number`, `date`, `select`, `boolean`, `photo`
- API endpoints:
  - `POST /api/custom-fields/definitions` — create new field definition (trainer/admin)
  - `GET /api/custom-fields/definitions?entity=user` — list field definitions
  - `PUT /api/custom-fields/:entityType/:entityId` — set values for an entity
  - `GET /api/custom-fields/:entityType/:entityId` — get values
- Auto-include custom fields when fetching entities (via shared helper)
- Write tests

### Step 1.6: Feature Flags
- Create `config/features.js` with default flags for every module
- Support overrides via environment variables (`FEATURE_NUTRITION=true`)
- ModuleRegistry checks feature flags before loading modules
- Admin API to toggle features at runtime (stored in DB)

**Phase 1 Deliverable**: Same functionality as today, but restructured for everything that follows. All existing tests still pass. Multi-role auth working. Upload and custom fields infrastructure ready.

---

## Phase 2: Equipment & Workout System
**Goal**: Full workout template builder with equipment library, machine settings, and history tracking.

### Step 2.1: Equipment Module
- Create `equipment` table (name, brand, model, category, photo_url, default_settings JSONB, gym_location, notes, created_by)
- Equipment categories: `machine`, `free_weight`, `cable`, `bodyweight`, `cardio`, `other`
- `default_settings` stores JSON like `{seat: 5, pin_height: 3, cable_position: "high"}`
- API endpoints (trainer/admin only for write):
  - `GET /api/equipment` — list with filters
  - `POST /api/equipment` — create (with optional photo upload)
  - `PUT /api/equipment/:id` — update
  - `DELETE /api/equipment/:id`
- Support custom fields on equipment
- Write tests

### Step 2.2: Enhanced Exercise Library
- Add to exercises table: `secondary_muscles` (JSONB array), `equipment_id` (FK), `instructions`, `video_url`, `photo_url`, `is_custom`, `created_by`
- Allow trainers to create custom exercises
- Link exercises to equipment (optional)
- API updates:
  - `POST /api/exercises` — create custom exercise (trainer/admin)
  - `PUT /api/exercises/:id` — update own custom exercises
  - Filter by equipment, muscle group, category
- Support photo upload for custom exercises
- Write tests

### Step 2.3: Workout Template Builder
- Create `workout_templates` table (name, description, category, difficulty, estimated_duration_min, photo_url, is_public, created_by)
- Create `template_exercises` table (template_id, exercise_id, sort_order, target_sets, target_reps, target_weight_kg, rest_seconds, notes, superset_group, machine_settings JSONB)
- `superset_group` — exercises with same group number are supersetted together
- `machine_settings` — overrides equipment defaults per template
- API endpoints (trainer/admin):
  - `POST /api/workout-templates` — create
  - `GET /api/workout-templates` — list own + public
  - `PUT /api/workout-templates/:id` — update
  - `POST /api/workout-templates/:id/exercises` — add exercise to template
  - `PUT /api/workout-templates/:id/exercises/:exerciseId` — update exercise in template (order, sets, machine settings)
  - `DELETE /api/workout-templates/:id/exercises/:exerciseId` — remove exercise
  - `POST /api/workout-templates/:id/duplicate` — clone a template
- Emit event: `template.created`, `template.updated`
- Write tests

### Step 2.4: Workout Session Logging
- Create `workout_sessions` table (user_id, template_id, assigned_by, name, notes, mood_before, mood_after, started_at, ended_at, scheduled_at)
- Create `session_exercises` table (session_id, exercise_id, sort_order, notes, machine_settings JSONB)
- Create `exercise_sets` table (session_exercise_id, set_number, set_type, reps, weight_kg, duration_sec, distance_m, rpe, completed, notes)
- `set_type` enum: `warmup`, `working`, `dropset`, `failure`
- `rpe` — rate of perceived exertion (1-10)
- API endpoints:
  - `POST /api/workout-sessions` — start session (from template or blank)
  - `GET /api/workout-sessions` — list own sessions (with pagination)
  - `GET /api/workout-sessions/:id` — get with all exercises and sets
  - `POST /api/workout-sessions/:id/exercises` — add exercise to session
  - `POST /api/workout-sessions/:id/exercises/:exId/sets` — log a set
  - `PUT /api/workout-sessions/:id/exercises/:exId/sets/:setId` — update set
  - `PUT /api/workout-sessions/:id/complete` — finish workout (records mood_after, ended_at)
- Auto-detect personal records (compare to all previous sessions for same exercise)
- Emit events: `workout.started`, `workout.completed`, `personal_record.set`
- Calculate volume (total weight × reps) per session
- Trainer can view client workout sessions via `GET /api/users/:clientId/workout-sessions`
- Write tests

### Step 2.5: Workout Assignment
- Trainer assigns templates to clients: `POST /api/users/:clientId/assigned-workouts`
- Create `assigned_workouts` table (client_id, template_id, assigned_by, day_of_week, notes, is_active)
- Client sees assigned workouts on their dashboard and calendar
- Emit event: `workout.assigned`
- Write tests

**Phase 2 Deliverable**: Trainers can build workout templates with equipment settings, assign to clients. Clients can log full workout sessions with sets, reps, weight, RPE, and see personal records.

---

## Phase 3: Progress Tracking
**Goal**: Body measurements, progress photos with comparison, all visible on calendar.

### Step 3.1: Body Measurements Module
- Create `body_measurements` table (user_id, recorded_at, weight_kg, body_fat_pct, chest_cm, waist_cm, hips_cm, bicep_left_cm, bicep_right_cm, thigh_left_cm, thigh_right_cm, neck_cm, notes)
- Support custom fields on measurements (for anything else trainers want to track)
- API endpoints:
  - `POST /api/progress/measurements` — record new measurement
  - `GET /api/progress/measurements` — list own (with date range filter)
  - `GET /api/progress/measurements/latest` — most recent
  - `GET /api/progress/measurements/trends` — returns data points for charts (weight over time, etc.)
- Trainer can view client measurements: `GET /api/users/:clientId/measurements`
- Emit event: `measurement.recorded`
- Write tests

### Step 3.2: Progress Photos
- Create `progress_photos` table (user_id, photo_url, thumbnail_url, category, notes, taken_at)
- Categories: `front`, `side`, `back`, `flexed`, `custom`
- Uses file upload service for storage + thumbnail generation
- API endpoints:
  - `POST /api/progress/photos` — upload progress photo
  - `GET /api/progress/photos` — list own (with category/date filters)
  - `GET /api/progress/photos/compare?date1=...&date2=...` — returns two photos for side-by-side
  - `DELETE /api/progress/photos/:id`
- Trainer can view client photos: `GET /api/users/:clientId/photos`
- Emit event: `photo.uploaded`
- Write tests

### Step 3.3: Calendar Integration
- Create a unified calendar endpoint that aggregates:
  - Scheduled sessions (from scheduling module — Phase 4)
  - Workout sessions (completed and planned)
  - Measurement reminders (weekly/monthly configurable)
  - Photo reminders
  - Meal logs
- `GET /api/calendar?start=2026-02-01&end=2026-02-28` — returns all events in range
- Each event has: `type`, `title`, `datetime`, `status`, `entity_id`
- Calendar is read-only aggregation — each module manages its own data
- Write tests

**Phase 3 Deliverable**: Full progress tracking with measurements, photo comparisons, everything visible on a unified calendar.

---

## Phase 4: Scheduling & Booking
**Goal**: Session scheduling with trainer availability, client booking, and approval workflow.

### Step 4.1: Trainer Availability
- Create `trainer_availability` table (trainer_id, day_of_week 0-6, start_time, end_time, is_active)
- API endpoints (trainer only):
  - `GET /api/scheduling/availability` — get own availability
  - `PUT /api/scheduling/availability` — set/update weekly availability (batch)
- Write tests

### Step 4.2: Session Scheduling
- Create `scheduled_sessions` table (trainer_id, client_id, template_id, title, scheduled_start, scheduled_end, status, requested_by, recurrence_rule, location, notes)
- Status flow: `requested` → `approved` / `declined` → `completed` / `cancelled` / `no_show`
- `requested_by`: `trainer` or `client`
- `recurrence_rule`: iCal RRULE format for recurring sessions (e.g., "FREQ=WEEKLY;BYDAY=MO,WE,FR")
- API endpoints:
  - `POST /api/scheduling/sessions` — create/request session (both trainer and client can)
  - `GET /api/scheduling/sessions` — list own sessions (trainer sees all their clients, client sees own)
  - `PUT /api/scheduling/sessions/:id/approve` — trainer approves client request
  - `PUT /api/scheduling/sessions/:id/decline` — trainer declines with reason
  - `PUT /api/scheduling/sessions/:id/cancel` — either party cancels
  - `PUT /api/scheduling/sessions/:id/complete` — mark as completed
  - `GET /api/scheduling/sessions/available-slots?trainer_id=X&date=2026-02-20` — client sees open slots
- Validation: check trainer availability, no double-booking
- Emit events: `session.requested`, `session.approved`, `session.declined`, `session.cancelled`
- Write tests

### Step 4.3: Notifications Module (Foundation)
- Create `notifications` table (user_id, type, title, body, data JSONB, is_read, created_at)
- Subscribe to events from other modules:
  - `session.requested` → notify trainer
  - `session.approved` → notify client
  - `workout.assigned` → notify client
  - `personal_record.set` → notify trainer
- API endpoints:
  - `GET /api/notifications` — list own (with pagination, unread count)
  - `PUT /api/notifications/:id/read` — mark as read
  - `PUT /api/notifications/read-all` — mark all as read
- For now: in-app notifications only. Push notifications added in Phase 7 (mobile).
- Write tests

**Phase 4 Deliverable**: Full scheduling with availability, booking, approval flow, recurring sessions, and in-app notifications.

---

## Phase 5: Nutrition Module
**Goal**: Meal logging, food database, presets, macro tracking, trainer meal plans.

### Step 5.1: Food Database
- Create `food_items` table (name, brand, serving_size, serving_unit, calories, protein_g, carbs_g, fat_g, fiber_g, sugar_g, sodium_mg, barcode, photo_url, is_verified, created_by)
- Seed with common foods (500+ items from public nutrition data)
- API endpoints:
  - `GET /api/nutrition/foods?q=chicken` — search foods
  - `GET /api/nutrition/foods/:id` — get details
  - `POST /api/nutrition/foods` — add custom food item (any user)
  - `PUT /api/nutrition/foods/:id` — update own custom foods
- Admin/trainer can mark foods as `is_verified`
- Support barcode field for future scanning feature
- Write tests

### Step 5.2: Meal Presets
- Create `meal_presets` table (name, description, meal_type, photo_url, total_calories/protein/carbs/fat, created_by, is_public)
- Create `meal_preset_items` table (preset_id, food_item_id, quantity, unit)
- API endpoints:
  - `POST /api/nutrition/presets` — create preset (trainer/admin)
  - `GET /api/nutrition/presets` — list (own + public)
  - `PUT /api/nutrition/presets/:id` — update
  - `DELETE /api/nutrition/presets/:id`
  - `POST /api/nutrition/presets/:id/duplicate` — clone
- Trainer can assign presets to clients
- Write tests

### Step 5.3: Meal Logging
- Create `meal_logs` table (user_id, meal_type, logged_at, photo_url, notes)
- Create `meal_log_items` table (meal_log_id, food_item_id, quantity, unit, calories, protein_g, carbs_g, fat_g)
- Meal types: `breakfast`, `lunch`, `dinner`, `snack`
- API endpoints:
  - `POST /api/nutrition/meals` — log a meal
  - `GET /api/nutrition/meals?date=2026-02-19` — get day's meals
  - `PUT /api/nutrition/meals/:id` — update
  - `DELETE /api/nutrition/meals/:id`
  - `GET /api/nutrition/summary?date=2026-02-19` — daily macro summary (total cal/protein/carbs/fat vs targets)
  - `GET /api/nutrition/summary?start=2026-02-01&end=2026-02-28` — date range summary for trends
- Support photo upload per meal
- Trainer can view client meals: `GET /api/users/:clientId/meals`
- Emit events: `meal.logged`
- Write tests

### Step 5.4: Nutrition Targets
- Add to `user_profiles`: `calorie_target`, `protein_target_g`, `carbs_target_g`, `fat_target_g`
- Trainer can set targets for client: `PUT /api/users/:clientId/nutrition-targets`
- Client sees progress against targets in daily summary
- Write tests

**Phase 5 Deliverable**: Full nutrition tracking with food database, presets, meal logging with photos, and macro tracking against trainer-set targets.

---

## Phase 6: Health Sync & AI Insights
**Goal**: Connect to phone health data, generate AI-powered insights.

### Step 6.1: Health Sync Module
- Create `health_sync_records` table (user_id, source, metric_type, value, unit, recorded_at, synced_at)
- Sources: `apple_health`, `google_fit`, `fitbit`, `garmin`, `manual`
- Metric types: `steps`, `heart_rate`, `sleep_hours`, `calories_burned`, `active_minutes`, `resting_heart_rate`
- API endpoints:
  - `POST /api/health-sync/records` — batch upload records (mobile app syncs periodically)
  - `GET /api/health-sync/records?metric=steps&start=...&end=...` — query records
  - `GET /api/health-sync/summary?date=2026-02-19` — daily health summary
- Mobile app handles actual HealthKit/Google Fit integration and POSTs data to API
- Write tests

### Step 6.2: AI Insights Engine
- Create `ai_insights` table (user_id, type, title, body, data JSONB, is_read, generated_at, expires_at)
- Insight types: `trend`, `habit`, `tip`, `milestone`, `warning`
- Create background job (runs weekly per user via BullMQ):
  1. Gather user's last 30 days: workouts, meals, measurements, health data, sleep
  2. Send structured summary to Claude API with prompt
  3. Claude generates 3-5 personalized insights
  4. Store as `ai_insights` records
- Example insights:
  - Trend: "Your squat strength increased 22% in 6 weeks"
  - Habit: "You train better on 7+ hours sleep — aim for 10pm bedtime"
  - Tip: "You're consistently under on protein — try adding a shake post-workout"
  - Milestone: "At this rate you'll hit your goal weight by April!"
  - Warning: "You've missed 3 sessions this week — check in with your trainer"
- API endpoints:
  - `GET /api/insights` — list own insights (newest first)
  - `PUT /api/insights/:id/read` — mark as read
- Trainer sees client insights: `GET /api/users/:clientId/insights`
- Emit event: `insight.generated`
- Write tests

**Phase 6 Deliverable**: Health data flowing in from phones, AI generating weekly personalized insights for each user.

---

## Phase 7: Mobile Apps (React Native / Expo)
**Goal**: Ship iOS and Android apps.

### Step 7.1: Expo Project Setup
- Initialize Expo project with Expo Router (file-based navigation)
- Configure NativeWind (Tailwind CSS for React Native)
- Set up shared API client with JWT auth
- Set up secure token storage (expo-secure-store)
- Create shared UI component library:
  - Cards, Buttons, Inputs, Modals, Bottom Sheets
  - Color scheme: warm, motivating (coral/orange accents, clean whites, soft grays)
  - Celebration animations (confetti on PR, streak fire animation)

### Step 7.2: Auth Screens
- Welcome/onboarding screens (3-step carousel)
- Login screen
- Registration screen (with invite code support for clients)
- Forgot password flow

### Step 7.3: Client App Screens
- Home/Dashboard (today's schedule, meals progress, streak, AI insight)
- Workout Session (exercise list, set logging, timer, RPE, mood)
- Workout Complete (celebration, stats, PR callouts)
- Calendar (month/week view, all events aggregated)
- Nutrition (daily view, log meal, search food, use preset, photo)
- Progress (measurements entry, photo capture + compare, trend charts)
- Profile/Settings (edit profile, notification preferences, health sync toggle)

### Step 7.4: Trainer App Screens
- Dashboard (today's schedule, clients needing attention, quick actions)
- Client List (grid/list, search, filter by status)
- Client Profile (tabbed: overview, workouts, schedule, nutrition, progress)
- Template Builder (add exercises, set targets, machine settings, superset groups)
- Schedule Management (weekly view, approve/decline requests)
- Equipment Library (list, add with photo)

### Step 7.5: Health Integration
- Apple HealthKit integration (expo-apple-healthkit)
- Google Health Connect (expo-health-connect)
- Background sync job — periodically read health data and POST to API
- Permission request flows

### Step 7.6: Push Notifications
- Configure expo-notifications
- Register device tokens on login: `POST /api/devices` (device_token, platform)
- Backend sends push via Firebase Cloud Messaging (FCM) / APNs
- Notification types: session reminders, approval requests, new insights, streak alerts

### Step 7.7: App Store Submission
- App icons, splash screens, screenshots
- App Store Connect setup (iOS)
- Google Play Console setup (Android)
- Privacy policy, terms of service
- TestFlight / Internal testing track first
- Production release

**Phase 7 Deliverable**: Published iOS and Android apps for both trainers and clients.

---

## Phase 8: Admin Panel (Web)
**Goal**: Super admin web dashboard for system management.

### Step 8.1: Next.js Admin Dashboard
- Next.js + Tailwind + shadcn/ui
- Auth: admin-only login
- Pages:
  - Dashboard (system stats: total users, active sessions, revenue-ready metrics)
  - User Management (list all users, change roles, suspend, delete)
  - Trainer Management (list trainers, see their client counts, performance)
  - Food Database Management (approve user-submitted foods, bulk import)
  - Equipment Library (global equipment available to all trainers)
  - Feature Flags (toggle modules on/off)
  - Custom Field Definitions (manage system-wide custom fields)
  - System Logs / Audit Trail

**Phase 8 Deliverable**: Web admin panel for super admins to manage the entire platform.

---

## Cross-Cutting Concerns (Applied Throughout All Phases)

### Testing Strategy
- Unit tests per module (service layer)
- Integration tests per module (API endpoints via supertest)
- Test database auto-created/dropped per test suite
- CI runs all tests on every push

### API Design Standards
- All list endpoints support pagination: `?page=1&limit=20`
- All list endpoints support date range: `?start=...&end=...`
- Consistent error format: `{ error: "message", code: "ERROR_CODE" }`
- Consistent response format: `{ data: ..., pagination: { page, limit, total } }`

### Security
- Rate limiting on auth endpoints (express-rate-limit)
- Input validation on all endpoints (express-validator)
- SQL injection protection (parameterized queries)
- File upload validation (mime type, size limits)
- CORS configured per environment
- Helmet security headers

### Logging & Monitoring
- Structured logging (pino)
- Request ID tracking
- Error tracking (Sentry-ready)

---

## Implementation Order Summary

| Phase | What | Dependencies |
|-------|------|-------------|
| 1 | Foundation (restructure, PostgreSQL, multi-role auth, uploads, custom fields) | None |
| 2 | Equipment + Workout System (templates, sessions, sets, assignment) | Phase 1 |
| 3 | Progress Tracking (measurements, photos, calendar) | Phase 1 |
| 4 | Scheduling (availability, booking, approvals, notifications) | Phase 1 |
| 5 | Nutrition (food DB, presets, meal logging, macros) | Phase 1 |
| 6 | Health Sync + AI Insights | Phases 2-5 (needs data to analyze) |
| 7 | Mobile Apps (React Native / Expo) | Phases 1-6 (API complete) |
| 8 | Admin Panel (Next.js web) | Phase 1 |

Phases 2, 3, 4, 5 can be developed in parallel after Phase 1.
Phase 8 can start anytime after Phase 1.
Phase 6 needs data from 2-5 to generate meaningful insights.
Phase 7 needs API complete (1-6) but UI prototyping can start earlier.
