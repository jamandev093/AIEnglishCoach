# AI English Coach — Admin User Management Workflow

This document is for backend/admin use only.

The mobile app is only for learners.  
Admin tools must never be added inside the React Native user app.

## Admin User Management Purpose

Admin User Management is for:

- Search user by phone number
- View paid / unpaid users
- View manual premium users
- View poor-student / scholarship free access users
- View user performance
- View active users
- View inactive users
- View non-serious users
- Grant manual premium access
- Grant scholarship / poor-student free access
- Revoke or expire access when needed

No real payment gateway is implemented yet.  
No real user login/auth is implemented yet.  
These APIs are backend/admin foundation only.

---

## Security Rules

- Never expose `ADMIN_API_KEY` in the frontend/mobile app.
- Never commit real admin keys to GitHub.
- Never send admin key in screenshots.
- Use the Render admin key only inside private PowerShell.
- Mobile users must never see admin tools or admin dashboard.
- Admin dashboard will be a separate secure web dashboard later.

---

## Local PowerShell Setup

Use this for local backend testing:

```powershell
$BASE_URL = "http://127.0.0.1:8000"
$ADMIN_KEY = "local-admin-test-key"
```

---

## Render PowerShell Setup

Use this for Render backend testing:

```powershell
$BASE_URL = "https://aienglishcoach-backend.onrender.com"
$ADMIN_KEY = "PASTE_REAL_RENDER_ADMIN_KEY_HERE"
```

Do not save the real Render key in this file.  
Replace it only inside your private PowerShell session.

---

## 1. List All Admin Users

```powershell
$response = Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30

$response.success
$response.count
$response.users | Select-Object id,phoneNumber,displayName,accessLevel,accessSource,accessStatus,activityStatus,confidenceScore,fluencyScore,speakingPracticeCount
```

Expected sample users:

```text
user-001 Paid Student
user-002 Free Student
user-003 Scholarship Student
```

---

## 2. Search User by Phone Number

Search by full or partial phone number.

```powershell
$response = Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/search?phone=9876543210" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30

$response.success
$response.count
$response.users | Select-Object id,phoneNumber,displayName,accessLevel,accessSource,activityStatus
```

Search scholarship user example:

```powershell
$response = Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/search?phone=3212" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30

$response.count
$response.users | Select-Object id,phoneNumber,displayName,accessSource,activityStatus
```

---

## 3. View User Dashboard Metrics

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/metrics" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Important metrics:

```text
totalRegisteredUsers
totalPaidUsers
totalUnpaidUsers
totalPremiumActiveUsers
totalFreeUsers
totalManualPremiumUsers
totalScholarshipUsers
totalTrialUsers
totalExpiredPremiumUsers
currentlyActiveUsers
practicingNowUsers
activeTodayUsers
activeThisWeekUsers
inactiveUsers
leftPlatformUsers
nonSeriousUsers
seriousUsers
```

---

## 4. View Individual User Detail

Paid user:

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-001" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Free user:

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Scholarship user:

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-003" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

User detail includes:

```text
profile
access
performance
activityStatus
adminNotes
```

---

## 5. Grant Manual Premium Access

Use this when owner/admin manually activates premium for a user.

```powershell
$body = @{
  accessLevel = "premium"
  accessSource = "adminManual"
  accessStatus = "active"
  accessExpiresAt = $null
  courseId = "premium-speaking-v1"
  courseName = "Premium Speaking Course"
  manualReason = "Owner activated premium manually."
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002/access" `
  -Method PUT `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 30
```

Expected access:

```text
accessLevel  : premium
accessSource : adminManual
accessStatus : active
```

---

## 6. Grant Poor-Student / Scholarship Free Access

Use this when a user cannot pay but should receive premium access.

```powershell
$body = @{
  accessLevel = "premium"
  accessSource = "scholarship"
  accessStatus = "active"
  accessExpiresAt = "2026-08-15T00:00:00Z"
  courseId = "premium-speaking-v1"
  courseName = "Premium Speaking Course"
  manualReason = "Poor-student free access."
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002/access" `
  -Method PUT `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 30
```

Expected access:

```text
accessLevel  : premium
accessSource : scholarship
accessStatus : active
```

---

## 7. Revoke User Access

Use revoke if access should be removed by admin.

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002/access/revoke" `
  -Method POST `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Expected access:

```text
accessStatus : revoked
```

---

## 8. Expire User Access

Use expire if access has ended.

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002/access/expire" `
  -Method POST `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Expected access:

```text
accessStatus : expired
```

---

## 9. Restore User to Free Access

Use this after testing manual premium or scholarship access.

```powershell
$body = @{
  accessLevel = "free"
  accessSource = "none"
  accessStatus = "active"
  accessExpiresAt = $null
  courseId = $null
  courseName = $null
  manualReason = "Restored to original free user after verification."
} | ConvertTo-Json -Depth 10

Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/user-002/access" `
  -Method PUT `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -ContentType "application/json" `
  -Body $body `
  -TimeoutSec 30
```

Expected access:

```text
accessLevel  : free
accessSource : none
accessStatus : active
```

---

## 10. Verify Normal Metrics After Restore

After restoring user-002, metrics should return to normal sample values.

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/metrics" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Expected sample values:

```text
totalRegisteredUsers     : 3
totalPaidUsers           : 1
totalUnpaidUsers         : 2
totalPremiumActiveUsers  : 2
totalFreeUsers           : 1
totalManualPremiumUsers  : 0
totalScholarshipUsers    : 1
totalExpiredPremiumUsers : 0
nonSeriousUsers          : 1
```

---

## 11. Missing User Test

```powershell
Invoke-RestMethod `
  -Uri "$BASE_URL/admin/users/missing-user" `
  -Method GET `
  -Headers @{ "X-Admin-Key" = $ADMIN_KEY } `
  -TimeoutSec 30
```

Expected:

```text
404 Not Found
User not found.
```

---

## Admin User Management Dashboard Requirements

Future admin web dashboard should show clickable cards for:

```text
Total registered users
Total paid users
Total unpaid users
Total premium active users
Total free users
Total manual premium users
Total poor-student / scholarship users
Total trial users
Total expired premium users
Currently active users
Practicing right now
Active today
Active this week
Inactive users
Left platform users
Non-serious users
Serious users
```

Each card should open a filtered user list.

Example:

```text
Paid Users: 120
Click → paid user list
```

```text
Non-serious Users: 340
Click → non-serious user list
```

---

## User Profile Page Requirements

When admin clicks one user, future web dashboard should show:

```text
User ID
Name
Phone number
Email
Native language
English level
Joined date
Last active date
Paid / unpaid status
Premium status
Access source
Access expiry date
Course name
Manual access reason
Scholarship reason
Confidence score
Fluency score
Pronunciation score
Grammar score
Speaking practice count
Topics practiced
Stories completed
Reading & Listening completed
Confidence missions completed
Total practice minutes
Repeated mistakes
Admin notes
```

---

## Safe Workflow for Admin Access Changes

1. Search user by phone number.
2. Open user detail.
3. Check current access.
4. Apply manual premium or scholarship only if needed.
5. Check user detail again.
6. Check metrics.
7. If testing, restore user back to original state.
8. Never expose admin key.
9. Never add admin tools inside mobile app.

---

## Current Foundation Status

Implemented backend/admin foundation:

```text
GET  /admin/users
GET  /admin/users/search?phone=...
GET  /admin/users/metrics
GET  /admin/users/{user_id}
PUT  /admin/users/{user_id}/access
POST /admin/users/{user_id}/access/revoke
POST /admin/users/{user_id}/access/expire
```

Not implemented yet:

```text
Real user registration
Real login / OTP
Real payment gateway
Admin web dashboard UI
Teacher/team permissions
Real database
```