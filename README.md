# Quiz / Assessment App — Backend

A RESTful backend for a Quiz/Assessment platform where **Admins** create and manage quizzes,
and **Users** attempt them and view their scores.

Built as a standalone API — **no frontend code lives in this repo, and this repo does not
call or depend on any frontend.** It is designed to be integration-tested live via Postman
or any HTTP client.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Runtime | Node.js + Express 5 | REST API server |
| Language | TypeScript (strict mode) | type safety across models, requests, responses |
| Database | MongoDB + Mongoose | flexible document schema, easy relationship modeling via ObjectId refs |
| Auth | JWT (`jsonwebtoken`) | stateless access-token auth |
| Password hashing | bcrypt | one-way password hashing before storage |
| Validation | Zod | schema-based request validation (body/params/query) |
| Security middleware | helmet, cors | standard HTTP header hardening + cross-origin config |
| Logging | morgan | request logging in dev |
| Env management | dotenv + Zod schema | `.env` loaded and validated at boot — server refuses to start with missing/invalid config |

---

## Folder Structure

```
backend/
├── .env.example         # template for required env vars (safe to commit)
├── .env                 # actual secrets (gitignored, never committed)
├── .gitignore
├── package.json
├── tsconfig.json
├── README.md
└── src/
    ├── app.ts            # Express app: middleware, routes, error handler — NO .listen()
    ├── server.ts         # entry point: connects DB, then starts the server
    │
    ├── config/
    │   ├── db.ts         # Mongoose connection logic
    │   └── env.ts        # validates process.env with Zod, exports typed `env` object
    │
    ├── constants/
    │   ├── roles.ts          # ROLES.ADMIN / ROLES.USER — single source of truth
    │   └── attemptStatus.ts  # ATTEMPT_STATUS.IN_PROGRESS / SUBMITTED / AUTO_SUBMITTED
    │
    ├── types/
    │   └── express.d.ts  # augments Express's Request type with req.user (id, role)
    │
    ├── models/           # Mongoose schemas — one file per collection
    │   ├── user.model.ts
    │   ├── quiz.model.ts
    │   ├── question.model.ts
    │   ├── option.model.ts
    │   ├── attempt.model.ts
    │   └── answerResponse.model.ts
    │
    ├── validators/        # Zod schemas — what a valid request looks like, per route group
    │   ├── shared.validator.ts   # objectIdSchema — reused everywhere an ObjectId is expected
    │   ├── auth.validator.ts
    │   ├── quiz.validator.ts
    │   ├── question.validator.ts
    │   └── attempt.validator.ts
    │
    ├── middlewares/
    │   ├── auth.middleware.ts    # authenticate (verifies JWT) + authorize(...roles) (RBAC)
    │   ├── validate.middleware.ts # generic: runs any Zod schema against req.body/query/params
    │   └── error.middleware.ts    # centralized error handler — formats every error response
    │
    ├── controllers/       # thin HTTP layer — parse request, call service, format response
    │   ├── auth.controller.ts
    │   ├── quiz.controller.ts
    │   ├── question.controller.ts
    │   └── attempt.controller.ts
    │
    ├── services/           # business logic + DB queries — no req/res, pure functions/classes
    │   ├── auth.service.ts
    │   ├── quiz.service.ts
    │   ├── question.service.ts
    │   ├── attempt.service.ts
    │   └── scoring.service.ts    # isolated scoring/finalization logic
    │
    ├── routes/
    │   ├── index.ts        # master router — mounts all sub-routers under /api
    │   ├── auth.routes.ts
    │   ├── quiz.routes.ts
    │   ├── question.routes.ts   # mounted with mergeParams under /quizzes/:id/questions
    │   └── attempt.routes.ts
    │
    └── utils/
        ├── jwt.ts             # signToken / verifyToken
        ├── apiResponse.ts     # sendResponse() — consistent { success, message, data } shape
        ├── apiError.ts        # ApiError class — carries an HTTP status code
        └── asyncHandler.ts    # wraps async controllers, forwards thrown errors to error middleware
```

### What each layer is responsible for

- **`config/`** — anything about *how the app is configured*: env vars, DB connection. Nothing here knows about HTTP or quizzes.
- **`constants/`** — fixed vocabulary used across the app (roles, attempt statuses) as named exports instead of raw strings scattered through files.
- **`types/`** — shared TypeScript types. `express.d.ts` is what lets every controller safely use `req.user.id` / `req.user.role` after `authenticate` runs, with full type-checking.
- **`models/`** — the actual Mongoose schemas: field types, defaults, indexes, relationships (`ref`), and `toJSON` transforms (e.g. stripping `password_hash` from every user response automatically).
- **`validators/`** — pure data: what shape a request must have to be considered valid, per route. No logic, just schema definitions.
- **`middlewares/`** — reusable request-pipeline steps: `authenticate` → `authorize` → `validate` → controller → (`asyncHandler` catches errors) → `errorHandler`.
- **`controllers/`** — translate HTTP into function calls. Read `req.params`/`req.body`/`req.user`, call the matching service, send the response. No business logic lives here.
- **`services/`** — the actual business rules and DB operations (e.g. "can this quiz be activated," "compute this attempt's score"). Framework-agnostic — could be called from a script or test without any HTTP involved.
- **`routes/`** — declarative wiring: for each endpoint, which middleware runs, which validator applies, which controller handles it. Reading a routes file alone tells you the full permission chain for that endpoint.
- **`utils/`** — small reusable helpers used across the whole app (JWT signing, standardized responses/errors, async error forwarding).

---

## How a Request Flows Through the System

Example: `POST /api/quizzes/:id/questions` (admin adds a question)

```
1. Request hits app.ts
   → helmet, cors, express.json(), morgan (logging) run first

2. Enters routes/index.ts → routes/question.routes.ts
   (mounted with mergeParams so :id from the parent /quizzes/:id path is still accessible)

3. middlewares/auth.middleware.ts → authenticate
   → verifies JWT from Authorization header, attaches req.user = { id, role }
   → fails → 401, request stops

4. middlewares/auth.middleware.ts → authorize(ROLES.ADMIN)
   → checks req.user.role === 'admin'
   → fails → 403, request stops

5. middlewares/validate.middleware.ts → validate(createQuestionSchema)
   → runs the Zod schema from validators/question.validator.ts against
     req.body, req.params, req.query
   → fails → 400 with field-level error messages, request stops

6. controllers/question.controller.ts → createQuestion
   → pulls quizId from params, fields from body
   → calls QuestionService.createQuestion(...)

7. services/question.service.ts → QuestionService.createQuestion
   → checks quiz exists and isn't soft-deleted
   → checks >= 2 options and exactly one is_correct === true
   → saves the Question doc, then bulk-inserts the Option docs (models/question.model.ts,
     models/option.model.ts)
   → returns the created question + its options

8. Back in the controller → utils/apiResponse.ts → sendResponse(res, 201, true, ...)
   → sends { success: true, message: "...", data: {...} }

   If anything threw an ApiError at any step (utils/apiError.ts), asyncHandler
   (utils/asyncHandler.ts) catches it and forwards it to
   middlewares/error.middleware.ts, which formats a consistent error response
   (also handles raw Mongoose ValidationError, duplicate-key errors, CastError,
   and JWT errors automatically).
```

Every other endpoint follows the same shape: `auth → authorize → validate → controller → service → model`.

---

## Database Design

6 MongoDB collections, connected via `ObjectId` references (Mongoose `ref`).

| Collection | Key fields | Relationships |
|---|---|---|
| **users** | name, email (unique), password_hash, role | referenced by `quizzes.created_by`, `attempts.user_id` |
| **quizzes** | title, description, time_limit (seconds), created_by, is_active, is_deleted | belongs to a User; has many Questions and Attempts |
| **questions** | quiz_id, question_text, question_type (default `'mcq'`), order_index, points (default 1) | belongs to a Quiz; has many Options |
| **options** | question_id, option_text, is_correct, order_index | belongs to a Question; separate collection (not a subdocument) so option count and correctness are independently queryable/enforceable |
| **attempts** | quiz_id, user_id, status, score, total_questions, started_at, submitted_at | belongs to a Quiz and a User; **unique index on `(user_id, quiz_id)`** blocks re-attempts at the DB level |
| **answer_responses** | attempt_id, question_id, selected_option_id (nullable), is_correct | belongs to an Attempt and a Question; **unique index on `(attempt_id, question_id)`** — one response per question per attempt |

```
users (1) ──< quizzes            [created_by]
users (1) ──< attempts           [user_id]
quizzes (1) ──< questions
quizzes (1) ──< attempts
questions (1) ──< options
questions (1) ──< answer_responses
attempts (1) ──< answer_responses
options (1) ──< answer_responses [selected_option_id]
```

Every schema uses a `toJSON` transform to strip `__v` (and `password_hash` on User) from
API responses automatically, so controllers never have to manually clean output.

---

## Auth & RBAC

- **JWT payload**: `{ user_id, role }` — minimal, no PII.
- **Expiry**: 24h access token (`utils/jwt.ts`).
- **Transport**: `Authorization: Bearer <token>` header.
- **Password**: bcrypt-hashed (10 salt rounds) before storage; never returned in any response.
- **Two-stage middleware** (`middlewares/auth.middleware.ts`):
  - `authenticate` — is there a valid, non-expired token at all? → 401 if not.
  - `authorize(...roles)` — does *this* user's role match what the route allows? → 403 if not.
- Role check is generic/parameterized (`authorize(ROLES.ADMIN)`, `authorize(ROLES.ADMIN, ROLES.USER)`) rather than hardcoded per-role functions, so adding a new role later needs no new middleware.

---

## User Journeys

### Admin journey
1. `POST /api/auth/register` (role: `admin`) or `/login` → receive JWT
2. `POST /api/quizzes` → create a quiz (starts `is_active: false`)
3. `POST /api/quizzes/:id/questions` → add questions, each with its options and exactly one correct answer
4. `PATCH /api/quizzes/:id/status` → activate the quiz (blocked if it has zero questions)
5. Users can now discover and attempt this quiz
6. `GET /api/quizzes/:id/submissions` → view all attempts/scores for this quiz
7. `DELETE /api/quizzes/:id` → soft-delete when done (never a hard delete — preserves attempt history)

### User journey
1. `POST /api/auth/register` (role: `user`, or omitted — defaults to user) or `/login` → receive JWT
2. `GET /api/quizzes` → see only **active** quizzes
3. `POST /api/quizzes/:id/attempts` → start an attempt (blocked if already attempted this quiz, if quiz is inactive, or has no questions)
4. `GET /api/attempts/:id` → get current question set + time remaining (correct answers stripped from the payload)
5. `PATCH /api/attempts/:id/answers` → submit an answer, one question at a time (repeatable — last answer per question wins)
6. `POST /api/attempts/:id/submit` → final submit, score computed immediately
   - **or** — if the timer expires before the user submits, the *next* request touching that attempt (a `GET`, a `PATCH`, or the history endpoint) auto-finalizes it server-side as `auto_submitted` with whatever was answered so far — no cron job needed, this is a lazy check (`AttemptService.lazyCheckExpiration`)
7. `GET /api/attempts` → past attempt history with scores
8. `GET /api/attempts/:id/result` → full breakdown: each question, the user's answer, correctness

---

## Full API Reference

Base URL: `http://localhost:5000/api` (or whatever `PORT` you set)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/health` | none | server liveness check (mounted outside `/api`) |
| POST | `/auth/register` | none | register (name, email, password, role?) |
| POST | `/auth/login` | none | login (email, password) |
| POST | `/quizzes` | admin | create quiz |
| GET | `/quizzes` | admin/user | list quizzes (admin sees all, user sees active only) — paginated |
| GET | `/quizzes/:id` | admin/user | quiz detail + questions (options' `is_correct` hidden from users) |
| PATCH | `/quizzes/:id` | admin | update title/description/time_limit |
| PATCH | `/quizzes/:id/status` | admin | activate/deactivate (blocked if 0 questions) |
| DELETE | `/quizzes/:id` | admin | soft delete |
| GET | `/quizzes/:id/submissions` | admin | all attempts for this quiz — paginated |
| POST | `/quizzes/:id/questions` | admin | add question + options |
| GET | `/quizzes/:id/questions` | admin | list questions for a quiz (with correct answers visible) |
| PATCH | `/quizzes/:id/questions/:qid` | admin | update a question (and optionally replace its options) |
| DELETE | `/quizzes/:id/questions/:qid` | admin | delete a question (cascades to its options) |
| POST | `/quizzes/:id/attempts` | user | start an attempt |
| GET | `/attempts/:id` | user | get attempt state, time remaining, questions (answers hidden) |
| PATCH | `/attempts/:id/answers` | user | submit/update one answer |
| POST | `/attempts/:id/submit` | user | final submit, triggers scoring |
| GET | `/attempts` | user | attempt history — paginated |
| GET | `/attempts/:id/result` | user | full result breakdown |

---

## Environment Variables

Create `.env` in `backend/` (see `.env.example`):

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/quiz-app
JWT_SECRET=replace_this_with_a_long_random_secret
NODE_ENV=development
```

`config/env.ts` validates these with Zod at boot — the server refuses to start if any are
missing or malformed, rather than failing unpredictably later.

---

## Setup & Installation

```bash
cd backend
npm install
cp .env.example .env      # then fill in real values, especially JWT_SECRET
npm run dev                # starts on http://localhost:<PORT> with auto-restart
```

Other scripts:
```bash
npm run build   # compiles TypeScript to dist/
npm start        # runs the compiled build (dist/server.js) — for production
```

Requires a running MongoDB instance reachable at `MONGO_URI` (local `mongod`, or a hosted
cluster like MongoDB Atlas — either works, just point the URI at it).

---

## Edge Case Handling Summary

| Edge case | Where it's handled |
|---|---|
| Re-attempt a completed quiz | `attempt.model.ts` unique index `(user_id, quiz_id)` + explicit check in `AttemptService.startAttempt` |
| Timer expires before submit | `AttemptService.lazyCheckExpiration`, called on every attempt-touching request; auto-finalizes via `ScoringService.finalizeAndScore` with status `auto_submitted` |
| Delete quiz with submissions | Always soft-delete (`is_deleted` flag) — never a hard delete, so `answer_responses`/`attempts` are never orphaned |
| User hits admin-only route | `authorize(ROLES.ADMIN)` middleware → 403 |
| Empty quiz activation | `QuizService.updateQuizStatus` blocks `is_active: true` if question count is 0 |
| Duplicate answer submission for same question | `answerResponse.model.ts` unique index `(attempt_id, question_id)` — `submitAnswer` updates in place rather than duplicating |