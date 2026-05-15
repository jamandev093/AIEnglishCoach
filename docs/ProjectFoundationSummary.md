# AI English Coach — Project Foundation Summary

This document summarizes the current stable foundation of the AI English Coach project.

Current status:

```text
Phase 7 ✅ App content flow foundation complete
Phase 8 ✅ Backend admin/content publishing foundation complete
Phase 9 ✅ Backend admin user/access foundation complete
```

The mobile app is for learners only.  
Admin tools must not be added inside the React Native user app.  
The admin dashboard will be a separate secure web dashboard later.

---

# 1. Core Product Direction

AI English Coach is a mobile-first English speaking improvement app.

Main product promise:

```text
Help users turn passive English knowledge into real speaking confidence.
```

Core learning loop:

```text
User speaks
→ AI/backend checks
→ correction popup
→ explanation
→ repeat practice
→ save progress
```

Target users:

```text
Indian learners first
Global learners later
Beginner to intermediate users
Users who can read/write but cannot speak confidently
Non-academic practical learners
Academic learners who need grammar support
```

Important product modes planned:

```text
Simple / Speak Easy Mode
Teacher / Grammar Coach Mode
English-only mode
Native-language support mode
```

---

# 2. Mobile App Rule

The mobile app is only for learners/users.

Do not add:

```text
Admin dashboard
Admin icon
Admin content tools
Admin user search
Payment management tools
Developer tools
```

inside the React Native app.

Admin tools belong in a separate web dashboard later.

---

# 3. Phase 7 Summary — App Content Flow Foundation

Completed Phase 7 features:

```text
Stories screen connected to backend content
Confidence Building screen connected to backend content
Reading & Listening connected to backend content
TTS preserved for Reading & Listening
Conversation Topics screen created
Practice Topics entry point added
Topic click saves selected topic
Topic click opens Speaking page
SpeakingScreen reads selected topic
Selected topic influences practice sentence
Clear selected topic works
Final Phase 7 regression passed
```

Locked user flow:

```text
Home
→ Practice Topics
→ Topics List
→ Tap Topic
→ Speaking Page
→ Selected Topic appears
→ Topic sentence appears
→ User speaks
→ Backend analyzes
→ Result popup
→ Repeat practice
→ Progress saved
```

Important decision:

```text
Keep topic library as a separate screen.
Do not put 100–300 topics directly inside SpeakingScreen.
Do not remove topic-wise practice.
Do not rewrite stable SpeakingScreen unnecessarily.
```

---

# 4. Phase 8 Summary — Admin Content Publishing Backend Foundation

Completed Phase 8 features:

```text
Admin API key security foundation
JSON content store foundation
Public content APIs read from JSON store
Protected admin content list/create endpoints
Protected admin content update endpoint
Protected admin publish/unpublish endpoints
Admin content export/backup endpoint
Local admin verification
Render admin verification
Admin content publishing workflow documentation
Final Phase 8 regression passed
```

Public content endpoints:

```text
GET /content/stories
GET /content/confidence-videos
GET /content/reading-listening
GET /content/topics
```

Admin content endpoints:

```text
GET  /admin/content
POST /admin/content
PUT  /admin/content/{content_id}
POST /admin/content/{content_id}/publish
POST /admin/content/{content_id}/unpublish
GET  /admin/content/export
```

Security:

```text
Admin endpoints require X-Admin-Key.
ADMIN_API_KEY is stored only in backend environment.
Never expose ADMIN_API_KEY in mobile app.
Never commit real admin keys.
```

Content management supports:

```text
Stories
Confidence videos
Reading & Listening
Conversation topics
Draft/unpublished content
Published content
Premium/free content flag
Content backup/export
```

Daily speaking missions are not part of static admin content because they belong to the Speaking/AI flow.

---

# 5. Phase 9 Summary — Admin User/Access Backend Foundation

Completed Phase 9 features:

```text
User/Auth/Access planning
User management schema foundation
User JSON store foundation
Admin user list/search/metrics endpoints
Auth/payment/account foundation schemas only
Local admin user endpoint verification
Render admin user endpoint verification
Manual premium / scholarship access update foundation
Local manual premium/scholarship verification
Render manual premium/scholarship verification and restore
Admin user management workflow documentation
Final Phase 9 regression passed
```

Admin user endpoints:

```text
GET  /admin/users
GET  /admin/users/search?phone=...
GET  /admin/users/metrics
GET  /admin/users/{user_id}
PUT  /admin/users/{user_id}/access
POST /admin/users/{user_id}/access/revoke
POST /admin/users/{user_id}/access/expire
```

Supported admin user-management foundation:

```text
Search user by phone number
View paid users
View unpaid users
View premium users
View free users
View manual premium users
View poor-student / scholarship users
View active users
View inactive users
View non-serious users
View user performance
View user detail
Grant manual premium access
Grant scholarship/free access
Revoke access
Expire access
Restore free access
```

Real auth/payment are not implemented yet.

Only foundation schemas exist for:

```text
User registration request
User login request
User auth account
User auth session
Payment record
User payment summary
Course pricing
```

---

# 6. Current Backend Test Status

Current backend tests:

```text
137 passed
```

Run:

```powershell
cd D:\MyNewProject\AIEnglishCoach
.\backend\.venv\Scripts\python.exe -m pytest backend\tests
```

Expected:

```text
137 passed
```

One warning is okay.

---

# 7. Current Frontend Lint Status

Run:

```powershell
npm run lint
```

Expected:

```text
0 errors
3 warnings
```

Known non-blocking warnings:

```text
src/screens/PronunciationPractice.tsx
- useEffect is defined but never used

src/screens/SpeakingScreen.tsx
- React Hook useEffect has a missing dependency

src/utils/activityHistory.ts
- stories is defined but never used
```

These are not blocking.

---

# 8. Important Backend Files

Admin/content files:

```text
backend/admin_security.py
backend/content_schemas.py
backend/content_store.py
backend/content_service.py
backend/admin_content_service.py
backend/content_data/content_items.json
```

Admin/user files:

```text
backend/user_schemas.py
backend/user_store.py
backend/admin_user_service.py
backend/user_data/users.json
```

Main backend:

```text
backend/main.py
backend/settings.py
```

Tests:

```text
backend/tests/
```

---

# 9. Important Frontend Files

Main routes/screens:

```text
app/(tabs)/index.tsx
app/(tabs)/speaking.tsx
app/conversationTopics.tsx
app/readingListening.tsx
app/confidenceBuilding.tsx
```

Core screens:

```text
src/screens/SpeakingScreen.tsx
src/screens/StoriesScreen.tsx
src/screens/ConfidenceBuildingScreen.tsx
```

Utilities:

```text
src/config/api.ts
src/utils/selectedTopicStore.ts
src/utils/activityHistory.ts
```

---

# 10. Render Backend

Backend Render URL:

```text
https://aienglishcoach-backend.onrender.com
```

Render admin APIs require:

```text
X-Admin-Key
```

Do not store real Render key in GitHub.

Safe PowerShell pattern:

```powershell
$BASE_URL = "https://aienglishcoach-backend.onrender.com"
$ADMIN_KEY = "PASTE_REAL_RENDER_ADMIN_KEY_HERE"
```

Use the real key only in private PowerShell session.

---

# 11. Restart Checklist

After PC restart:

```powershell
cd D:\MyNewProject\AIEnglishCoach
git status
```

Expected:

```text
nothing to commit, working tree clean
```

If pycache appears:

```powershell
git restore backend/__pycache__/main.cpython-314.pyc
git status
```

Run backend tests:

```powershell
.\backend\.venv\Scripts\python.exe -m pytest backend\tests
```

Run lint:

```powershell
npm run lint
```

---

# 12. Git Rules

Before commit:

```powershell
git status
```

Do not commit:

```text
.env
backend/.env
__pycache__
.pytest_cache
node_modules
.expo
temporary backup JSON files
real admin keys
```

If pycache appears:

```powershell
git restore backend/__pycache__/main.cpython-314.pyc
```

---

# 13. Admin Safety Rules

Admin content workflow:

```text
Export backup first
Create content as unpublished/draft first
Verify in admin list
Publish only when correct
Unpublish wrong content
Do not create random test content on Render
```

Admin user workflow:

```text
Search user by phone number
Open user detail
Check current access
Apply manual premium or scholarship only if needed
Check metrics
Restore test user after verification
Never expose admin key
```

---

# 14. What Is Not Built Yet

Not built yet:

```text
Real user registration
Real login/auth/OTP
Real payment gateway
Payment webhook verification
Real PostgreSQL database
Admin web dashboard UI
Admin role/team permission system
Real media upload system
Real production analytics dashboard
Real large content library upload
Real mistake memory per user from backend
Real user-level progress sync from mobile app
Production-grade AI speaking engine
```

---

# 15. Completion Percent Estimate

Mobile learner UI foundation:

```text
75%–80%
```

Mobile learner production readiness:

```text
55%–60%
```

Backend/admin foundation:

```text
65%–70%
```

Backend production readiness:

```text
30%–35%
```

Admin UI:

```text
0%
```

Payment UI:

```text
0%
```

Account/login UI:

```text
0%
```

Real auth/payment implementation:

```text
0%
```

---

# 16. Recommended Next Phases

Recommended next order:

```text
Phase 10B — Clean 3 frontend lint warnings
Phase 11A — Decide next big branch:
  Option 1: Admin web dashboard architecture
  Option 2: Mobile premium/access integration
  Option 3: Real auth/account planning
```

Safest immediate next phase:

```text
Phase 10B — Clean non-blocking lint warnings
```

Reason:

```text
Small scope
Low risk
Keeps project cleaner before next big feature branch
```

---

# 17. Locked Development Rules

```text
One file group, one feature, one stable result at a time.
Do not rewrite stable screens unnecessarily.
Do not add admin UI inside mobile app.
Do not expose admin keys.
Do not implement real payment/auth until planned carefully.
Run backend tests after backend changes.
Run lint after frontend changes.
Commit only after tests pass.
Keep Git clean after every phase.
```