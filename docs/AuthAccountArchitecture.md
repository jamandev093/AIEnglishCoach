# AI English Coach — Auth & Account Architecture

Yes. First copy-paste this document into your Docs/notes. After you confirm it is correct, we will implement it as:
docs\AuthAccountArchitecture.md
AI English Coach — Auth & Account Architecture
1. Current Situation
AI English Coach already has important backend and mobile foundations:
Phase 9 ✅ Backend user/access foundation
Phase 11 ✅ Mobile premium/access foundation
Phase 12A ✅ Premium access strategy documentation
Phase 12B ✅ Auth/account architecture planning
Current backend already supports admin/user foundation:
Admin user list
Admin user search by phone number
Admin user metrics
User detail
Manual premium activation
Scholarship / poor-student free access
Revoke access
Expire access
Auth/payment schema foundation only
Current mobile app already has local premium access foundation:
src/utils/accessControl.ts
src/components/PremiumLockedModal.tsx
Current locked premium rule:
Static/manual content = free
AI-powered actions = premium
Not implemented yet:
Real user registration
Real login
Phone OTP
Session/token
Real mobile user access fetch
Real payment gateway
Real backend premium enforcement
Account creation UI
Profile/account UI

2. Core Goal
The auth/account system must support the real product and business model.
It must support:
Guest users
Registered free users
Paid premium users
Manual premium users
Scholarship / poor-student access users
Trial users
Expired users
Revoked users
Blocked users
Active users
Inactive users
Non-serious users
User performance tracking
Premium AI action access
The system should make it possible to answer admin questions like:
How many paid users?
How many unpaid users?
How many scholarship/free access users?
How many active users?
How many inactive users?
How many non-serious users?
Search user by phone number
What is this user's performance?

3. Recommended Auth Direction
Recommended first production auth method:
Phone number + OTP login
Email can be added later as optional.
Password-first login is not recommended for the first version.
Why phone OTP first:
Best fit for Indian learners
Simple for non-academic users
No password memory problem
Easy signup/login flow
Matches admin requirement: search user by phone number
Works well for paid/unpaid user identification
Supports scholarship/manual premium tracking

4. Guest Browsing Model
Users should not be forced to log in immediately when they open the app.
Guest users should be allowed to:
Open the app
Browse static/manual content
Open free learning content
Read stories
Use Reading & Listening content
View Confidence Building missions
View conversation topics
Use basic free practice
See premium AI lock messages
Guest users should not be able to:
Save real cloud progress
Use premium AI actions
Restore account on another device
Sync history across devices
Access paid features
Use advanced mistake memory
Use personalized coaching
Login should happen naturally when the user needs account-based value.
Example:
User taps premium AI feedback
→ app shows premium/login/upgrade message later
→ user can create account with phone OTP

5. Account Types
The system should recognize these user types.
Guest User
No account yet
Can browse free/static content
Can see premium lock messages
Cannot save cloud progress
Cannot unlock premium AI actions
Registered Free User
Logged in with phone OTP
Has userId and phone number
Can use free content
Can save basic progress later
Can request or buy premium later
Premium Paid User
Paid successfully
accessLevel = premium
accessSource = payment
accessStatus = active
Can use premium AI actions
Manual Premium User
Premium granted manually by admin
accessLevel = premium
accessSource = adminManual
accessStatus = active
Can use premium AI actions
Scholarship / Poor-Student User
Premium granted without payment for support/free access
accessLevel = premium
accessSource = scholarship
accessStatus = active
Can use premium AI actions
Tracked separately in admin dashboard
Trial User
Temporary premium access
accessLevel = premium
accessSource = trial
accessStatus = active
Can use premium AI actions until trial expires
Expired Premium User
Previously premium
accessStatus = expired
Premium AI actions locked
Free/static content still available
Revoked User
Access removed by admin
accessStatus = revoked
Premium AI actions locked
Blocked User
Account restricted for abuse or serious issue
May be blocked from account features

6. Access Rules
Premium AI action should be allowed when:
accessLevel = premium
accessStatus = active
Allowed premium sources:
payment
adminManual
scholarship
trial
Premium AI action should be locked when:
accessLevel = free
accessStatus = expired
accessStatus = revoked
accessStatus = blocked
accessStatus = pending
user is guest/unknown
Important rule:
Scholarship user = premium access in mobile app
Manual premium user = premium access in mobile app
Paid user = premium access in mobile app
Admin can still track them separately by accessSource.

7. Mobile App Auth Flow
Future mobile flow:
Open app
→ user can browse as guest
→ user can open static/free content
→ user taps premium AI action
→ app asks login/signup later
→ user enters phone number
→ user verifies OTP
→ backend creates or finds user account
→ backend returns session token
→ mobile app fetches user access
→ premium AI actions unlock if access is active
Do not force login on first app launch.
This keeps the app easier for new users and helps growth.

8. Future Mobile Screens
Future screens needed later:
Login / Signup screen
OTP Verify screen
Profile screen
Account Status screen
Premium Access screen
Request Free Access / Scholarship screen
Payment / Upgrade screen
These are not implemented yet.
They should be added gradually and safely.

9. Backend Endpoint Plan
Future auth endpoints:
POST /auth/request-otp
POST /auth/verify-otp
GET  /me/profile
GET  /me/access
POST /auth/logout
Future payment endpoints:
POST /payments/create-order
POST /payments/verify
POST /payments/webhook
Future account/admin relation:
Admin can search user by phone number
Admin can view user access
Admin can grant manual premium
Admin can grant scholarship/free access
Admin can revoke/expire access

10. Session / Token Strategy
Recommended future strategy:
Simple signed session token first
Access token + refresh token later if needed
Mobile secure storage:
Use expo-secure-store for real auth tokens
Important:
Do not store real auth tokens in AsyncStorage long-term
Do not store tokens in plain text files
Do not commit secrets to GitHub

11. Mobile User Access Fetch
After login, the mobile app should fetch the current user access.
Future endpoint:
GET /me/access
Expected data:
userId
phoneNumber
displayName
accessLevel
accessSource
accessStatus
accessExpiresAt
The mobile app should use this to decide premium AI actions.
Current temporary local access:
DEFAULT_LOCAL_USER_ACCESS = free
Later replacement:
DEFAULT_LOCAL_USER_ACCESS
→ currentUserAccess from backend after login

12. Admin Connection
When a user signs up:
accessLevel = free
accessSource = none
accessStatus = active
When user pays:
accessLevel = premium
accessSource = payment
accessStatus = active
When admin grants manual premium:
accessLevel = premium
accessSource = adminManual
accessStatus = active
When admin grants scholarship / poor-student access:
accessLevel = premium
accessSource = scholarship
accessStatus = active
When access expires:
accessStatus = expired
When access is revoked:
accessStatus = revoked
This connects auth/account system with the existing admin user management foundation.

13. Payment Dependency
Payment should come after auth/account identity.
Reason:
Payment needs a userId
Premium unlock needs a user account
Payment history must attach to a user
Admin paid/unpaid metrics need real users
Scholarship/manual access needs a real user record
Refunds/support need user identity
Correct order:
Auth/account foundation
→ user access fetch
→ payment gateway
→ premium unlock
Do not implement payment before user identity is stable.

14. Backend Premium Enforcement
Frontend premium modal is only user experience.
Real protection must later happen on the backend.
Future backend rule:
AI-heavy premium endpoints should check:
logged-in user
valid session
active premium access
Premium AI endpoints may include:
AI speaking correction
AI story feedback
AI reading feedback
AI confidence feedback
AI pronunciation feedback
AI live conversation
AI mistake memory
AI progress intelligence
This prevents unauthorized AI usage and protects API cost.

15. What Not To Implement Yet
Do not implement these yet:
Real OTP provider
SMS sending cost
JWT/session code
Login UI
OTP UI
Payment gateway
Payment webhook
Database migration
Backend premium enforcement
Upgrade screen
Request scholarship form
Full profile/account UI
These should come later, one phase at a time.

16. Recommended Future Implementation Ladder
Recommended future order:
Phase 13A — Backend auth schema/store foundation
Phase 13B — OTP request/verify mock endpoint foundation
Phase 13C — Mobile account/access utility foundation
Phase 13D — Login/signup UI foundation
Phase 13E — Mobile fetch /me/access and replace local access
Phase 13F — Backend premium enforcement for one AI endpoint
Phase 13G — Auth/account regression
Phase 14 — Payment planning after auth foundation is stable
Important:
Do not implement real payment before auth.
Do not implement full auth UI before backend auth foundation.
Do not connect premium payment before user access fetch works.

17. Locked Decisions
Phone OTP first
Email optional later
Guest browsing allowed
No forced login at first launch
Premium AI actions require real account later
Static/manual content remains free
AI-powered actions are premium
Scholarship/manual premium users unlock premium AI actions
Payment comes after auth/account foundation
Mobile should fetch user access from backend after login
Backend must later enforce premium AI endpoints
Use secure storage for real auth tokens later

18. Current Status
Current state:
Planning complete
Documentation phase only
No backend auth implemented yet
No mobile login UI implemented yet
No real payment implemented yet
Next implementation phase will create this document as:
docs\AuthAccountArchitecture.md
