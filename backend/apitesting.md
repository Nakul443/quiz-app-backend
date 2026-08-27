# Manual Testing Walkthrough (Postman / curl)

Run these in order — each step's output feeds the next (IDs, tokens). Replace
`localhost:5000` if your `PORT` differs.

Every response is shaped `{ success, message, data? }`. Save `token` and any `_id`
you get back — you'll need them in later steps.

---

## 0. Health check

```bash
curl http://localhost:5000/health
```
Expect: `200 { "success": true, "message": "Server is healthy" }`

---

## 1. Register an Admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin One",
    "email": "admin@test.com",
    "password": "adminpass123",
    "role": "admin"
  }'
```
Expect: `201`, `data.token` = **save as `ADMIN_TOKEN`**, `data.user._id` = admin's id.

## 2. Register a User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "User One",
    "email": "user@test.com",
    "password": "userpass123"
  }'
```
Expect: `201`, `role` defaults to `"user"`. Save token as **`USER_TOKEN`**.

## 3. Login (sanity check)

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@test.com", "password": "adminpass123" }'
```
Expect: `200` with the same shape as register.

**Negative test** — wrong password:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{ "email": "admin@test.com", "password": "wrongpass" }'
```
Expect: `401 Invalid email or password.`

---

## 4. Create a quiz (as Admin)

```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "title": "General Knowledge",
    "description": "A short GK quiz",
    "time_limit": 120
  }'
```
Expect: `201`, `is_active: false` by default. Save `data._id` = **`QUIZ_ID`**.

**RBAC negative test** — same call with `USER_TOKEN` instead:
```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{ "title": "x", "description": "xxxxx", "time_limit": 60 }'
```
Expect: `403 Access denied...`

**No-token test**:
```bash
curl -X POST http://localhost:5000/api/quizzes \
  -H "Content-Type: application/json" \
  -d '{ "title": "x", "description": "xxxxx", "time_limit": 60 }'
```
Expect: `401 Access denied. No token provided.`

---

## 5. Add questions to the quiz (as Admin)

```bash
curl -X POST http://localhost:5000/api/quizzes/QUIZ_ID/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "question_text": "What is the capital of France?",
    "order_index": 1,
    "options": [
      { "option_text": "Paris", "is_correct": true, "order_index": 1 },
      { "option_text": "London", "is_correct": false, "order_index": 2 },
      { "option_text": "Berlin", "is_correct": false, "order_index": 3 },
      { "option_text": "Madrid", "is_correct": false, "order_index": 4 }
    ]
  }'
```
Expect: `201`. Note the correct option's `_id` for later verification.

Add a second question the same way (`order_index: 2`) so the quiz has 2+ questions.

**Edge case** — 2 correct answers (should fail):
```bash
curl -X POST http://localhost:5000/api/quizzes/QUIZ_ID/questions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{
    "question_text": "Bad question",
    "order_index": 3,
    "options": [
      { "option_text": "A", "is_correct": true, "order_index": 1 },
      { "option_text": "B", "is_correct": true, "order_index": 2 }
    ]
  }'
```
Expect: `400 A question must have exactly one correct option.`

---

## 6. Try activating an empty quiz — should fail before questions exist

(Skip if you already added questions above — this is just to confirm the guard. To
actually see it fail, run this against a **freshly created second quiz** with no
questions yet.)

```bash
curl -X PATCH http://localhost:5000/api/quizzes/EMPTY_QUIZ_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{ "is_active": true }'
```
Expect: `400 Cannot activate an empty quiz...`

## 7. Activate the real quiz (has questions now)

```bash
curl -X PATCH http://localhost:5000/api/quizzes/QUIZ_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{ "is_active": true }'
```
Expect: `200`, `data.is_active: true`.

---

## 8. User browses quizzes

```bash
curl http://localhost:5000/api/quizzes \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: only active quizzes appear (your quiz should now be in the list).

```bash
curl http://localhost:5000/api/quizzes/QUIZ_ID \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: questions + options, but each option should have **no `is_correct` field**.

---

## 9. Start an attempt (as User)

```bash
curl -X POST http://localhost:5000/api/quizzes/QUIZ_ID/attempts \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `201`. Save `data._id` = **`ATTEMPT_ID`**.

**Edge case** — try starting a second attempt on the same quiz:
```bash
curl -X POST http://localhost:5000/api/quizzes/QUIZ_ID/attempts \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `400 You have already attempted this quiz.`

## 10. Get attempt state

```bash
curl http://localhost:5000/api/attempts/ATTEMPT_ID \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `200`, `data.time_remaining` counting down, questions with options (no
`is_correct` visible), `data.responses: []` initially.

## 11. Submit an answer

```bash
curl -X PATCH http://localhost:5000/api/attempts/ATTEMPT_ID/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer USER_TOKEN" \
  -d '{
    "question_id": "QUESTION_ID",
    "selected_option_id": "CORRECT_OPTION_ID"
  }'
```
Expect: `200`, answer saved.

Repeat for the second question. You can also re-PATCH the same `question_id` — it
should overwrite, not duplicate (unique index on `attempt_id + question_id`).

**RBAC/ownership test** — try hitting this attempt with the Admin's token:
```bash
curl -X PATCH http://localhost:5000/api/attempts/ATTEMPT_ID/answers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -d '{ "question_id": "QUESTION_ID", "selected_option_id": null }'
```
Expect: `403 Access denied...` (admin role is blocked at the route level by
`authorize(ROLES.USER)` on all `/attempts/*` routes).

## 12. Final submit

```bash
curl -X POST http://localhost:5000/api/attempts/ATTEMPT_ID/submit \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `200`, `data.status: "submitted"`, `data.score` computed immediately.

**Edge case** — submit again:
```bash
curl -X POST http://localhost:5000/api/attempts/ATTEMPT_ID/submit \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `400 Cannot submit. Attempt is already submitted.`

---

## 13. View result breakdown

```bash
curl http://localhost:5000/api/attempts/ATTEMPT_ID/result \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `200`, each question shown with `user_response` and correctness.

## 14. View attempt history

```bash
curl http://localhost:5000/api/attempts \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: `200`, paginated list including this attempt with its score.

---

## 15. Admin views submissions for the quiz

```bash
curl http://localhost:5000/api/quizzes/QUIZ_ID/submissions \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
Expect: `200`, the user's attempt shown with populated `user_id` (name, email).

---

## 16. Timer expiry / auto-submit (the trickiest one to test manually)

1. Create a **new quiz** with a very short `time_limit`, e.g. `5` (seconds).
2. Activate it, start an attempt as the user.
3. Wait > 5 seconds without submitting.
4. Call **any** attempt-touching endpoint — e.g.:
```bash
curl http://localhost:5000/api/attempts/NEW_ATTEMPT_ID \
  -H "Authorization: Bearer USER_TOKEN"
```
Expect: the attempt is auto-finalized on this very call — `status` should now be
`"auto_submitted"` with a score computed from whatever (if anything) was answered
before time ran out. This confirms the lazy-check mechanism (no cron/background job
involved — it triggers on next interaction).

---

## 17. Delete a quiz that has submissions

```bash
curl -X DELETE http://localhost:5000/api/quizzes/QUIZ_ID \
  -H "Authorization: Bearer ADMIN_TOKEN"
```
Expect: `200`, `data.is_deleted: true` — this is a **soft delete**, so the
`attempts`/`answer_responses` tied to it are preserved, not orphaned. Re-fetching
`GET /api/quizzes` afterward should no longer show it.

---

## What this walkthrough confirms end-to-end

- Register/login + password hashing works
- JWT issuance and verification works
- RBAC blocks the wrong role on every protected route (401 vs 403 distinction holds)
- Quiz CRUD + activation guard (empty quiz can't activate)
- Question/option creation enforces exactly-one-correct-answer and min-2-options
- Full attempt lifecycle: start → answer → submit → score
- Re-attempt blocking (DB-level uniqueness)
- Timer expiry auto-submit (lazy check, no cron)
- Result breakdown and history endpoints
- Admin submissions view (with population)
- Soft delete preserves attempt history