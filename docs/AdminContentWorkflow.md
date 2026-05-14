# AI English Coach — Admin Content Publishing Workflow

This document is for backend/admin use only.

The mobile app is only for learners. Admin tools must never be added inside the React Native app.

## Admin Safety Rules

- Never expose ADMIN_API_KEY in the frontend/mobile app.
- Never commit secrets to GitHub.
- Create new content as draft first using isPublished=false.
- Publish only after verification.
- If content is wrong, unpublish it instead of deleting it.
- Do not create random test content on Render.

## Local PowerShell Setup

```powershell
$BASE_URL = "http://127.0.0.1:8000"
$ADMIN_KEY = "local-admin-test-key"