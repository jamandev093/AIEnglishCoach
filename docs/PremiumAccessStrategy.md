# AI English Coach — Premium Access Strategy

This document locks the premium/free access strategy for AI English Coach.

## Core Rule

```text
Static/manual content = free
AI-powered actions = premium
```

The app should not become a platform where normal learning content is hidden too early.

Users should be able to open and learn from manually uploaded content for free. Premium value should come from AI-powered coaching, correction, analysis, scoring, and personalization.

---

# 1. Why This Strategy

AI English Coach is not only a content app.

The main product value is:

```text
User speaks
→ AI checks
→ AI corrects
→ AI explains
→ AI guides repeat practice
→ user improves confidence and fluency
```

So premium should protect the high-value and high-cost AI features, not basic content browsing.

This helps:

```text
Users experience value before paying
Poor students can still learn from free content
Manual content can grow the app without paywall friction
AI/API cost is protected behind premium
Premium feels useful instead of restrictive
```

---

# 2. What Should Usually Stay Free

Manually uploaded/static content should generally remain free.

Examples:

```text
Conversation topics
Story prompts
Story pictures/placeholders
Reading & Listening lessons
Confidence Building video/mission cards
Basic viewing
Basic reading
Basic listening/TTS
Meanings
Key words
Sentence starters
Prompts
Expected response examples
Basic non-AI practice flow
```

## Conversation Topics

Free users should generally be able to:

```text
Open topic list
Open a topic
View the situation/prompt
Practice basic speaking flow
```

## Stories

Free users should generally be able to:

```text
Open Stories
Choose a story
View pictures/prompts
Read hints and starters
Think and speak basic story
```

## Reading & Listening

Free users should generally be able to:

```text
Open Reading & Listening
Read the lesson
Listen to basic TTS
View meaning
View key words
Answer basic prompts
```

## Confidence Building

Free users should generally be able to:

```text
Open Confidence Building
View mission cards
View situation/video placeholder
Understand the speaking task
Try basic response
```

---

# 3. What Should Be Premium

Premium should focus on AI-powered value.

Examples:

```text
AI grammar correction
AI speaking feedback
AI pronunciation feedback
AI response correctness checking
AI smart suggestions
AI teacher explanation
AI confidence scoring
AI fluency scoring
AI mistake memory
AI personalized coaching
AI progress intelligence
Live AI conversation
Advanced speaking reports
Adaptive practice based on repeated mistakes
```

Premium is not only about access. It is about coaching quality.

---

# 4. Current Phase 11 Implementation

Phase 11 created the mobile premium/access foundation.

Implemented:

```text
src/utils/accessControl.ts
src/components/PremiumLockedModal.tsx
```

The app currently uses a temporary local access state:

```text
DEFAULT_LOCAL_USER_ACCESS = free
```

Real login/auth/payment is not implemented yet.

## Current AI-action premium locks

Implemented premium locks:

```text
Stories
→ AI Story Feedback / Stop & Check is premium-locked

Reading & Listening
→ AI Reading Feedback / Stop & Check is premium-locked

Confidence Building
→ AI Confidence Feedback / Stop & Check is premium-locked
```

These screens still allow users to open and view static content.

## Premium modal behavior

Implemented:

```text
Premium modal appears for locked AI action
Tap outside popup closes modal
Continue Free Practice closes modal
Maybe Later closes modal
Android back closes modal
```

Visual polish can be improved later.

---

# 5. Known Temporary Exception

Conversation Topics currently has a prototype card-level premium lock from Phase 11D.

Current prototype behavior:

```text
Premium topic card can show PremiumLockedModal
Premium topic may not open Speaking page
```

Final product direction:

```text
Conversation topic cards should generally open freely.
Premium lock should move to AI-powered Speaking actions later.
```

Future correction:

```text
Move topic premium lock from content-card level to Speaking AI-action level.
```

This should be done carefully because SpeakingScreen is sensitive and already stable.

---

# 6. Admin Content Upload Rule

Admin/manual content should not be marked premium by default.

Default admin upload strategy:

```text
Manually uploaded stories = free
Manually uploaded reading/listening lessons = free
Manually uploaded confidence missions = free
Manually uploaded conversation topics = free
```

Only mark content premium if there is a clear special reason.

General business rule:

```text
Do not monetize by hiding static content too early.
Monetize AI-powered coaching and feedback.
```

---

# 7. Scholarship and Manual Premium Access

Scholarship users should unlock premium AI actions without payment.

Backend access example:

```text
accessLevel = premium
accessSource = scholarship
accessStatus = active
```

Manual premium users should also unlock premium AI actions.

Backend access example:

```text
accessLevel = premium
accessSource = adminManual
accessStatus = active
```

Paid users should unlock premium AI actions.

Backend access example:

```text
accessLevel = premium
accessSource = payment
accessStatus = active
```

Expired or revoked users should not access premium AI actions.

---

# 8. Current Limitations

Not implemented yet:

```text
Real user login
Real phone OTP/auth
Real payment gateway
Real premium user fetch from backend
Real backend enforcement for premium AI actions
Payment webhook verification
Upgrade UI
Request scholarship/free access UI
Account creation UI
```

Current mobile premium access is frontend/local foundation only.

Later, premium access should come from backend user access after login.

---

# 9. Future Auth/Payment Direction

When real auth is added:

```text
User logs in
Mobile app fetches user access state
App checks accessLevel/accessStatus
Premium AI actions unlock or lock based on real user state
```

When payment is added:

```text
User pays
Backend verifies payment
User access changes to premium
Mobile app unlocks premium AI actions
```

When scholarship access is granted:

```text
Admin grants scholarship
Backend updates user access
Mobile app unlocks premium AI actions
```

---

# 10. Future Backend Enforcement

Frontend premium locks are useful for user experience, but real protection should later be enforced by backend.

Future backend rule:

```text
AI-heavy endpoints should check user access before running premium AI analysis.
```

Examples:

```text
AI speaking correction endpoint
AI pronunciation feedback endpoint
AI confidence scoring endpoint
AI live conversation endpoint
AI mistake memory endpoint
```

This prevents unauthorized premium AI usage and protects API cost.

---

# 11. Recommended Future Work

Recommended order:

```text
1. Keep static content free
2. Continue locking AI actions one screen at a time
3. Correct Conversation Topics prototype lock later
4. Plan real user/auth flow
5. Plan mobile user access fetch
6. Plan payment gateway
7. Add backend premium enforcement for AI endpoints
8. Add upgrade/request access UI
```

Do not rush into all of these at once.

---

# 12. Locked Decision

```text
Static/manual content should generally remain free.
AI-powered actions should be premium.
Scholarship/manual premium users should unlock premium AI actions.
Payment/auth are not implemented yet.
Conversation Topics card-level lock is temporary/prototype behavior.
Future premium enforcement should happen on AI actions and backend AI endpoints.
```