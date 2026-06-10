# Auth Testing Playbook

## Step 1: MongoDB Verification
```
mongosh
use test_database
db.users.find({role: "admin"}).pretty()
db.users.findOne({role: "admin"}, {password_hash: 1})
```
Verify: bcrypt hash starts with `$2b$`, indexes exist on users.email (unique), login_attempts.identifier.

## Step 2: API Testing
```
curl -c cookies.txt -X POST http://localhost:8001/api/auth/login -H "Content-Type: application/json" -d '{"email":"admin@margin.app","password":"Admin123!"}'
cat cookies.txt
curl -b cookies.txt http://localhost:8001/api/auth/me
```

Login should return the user object and set `access_token` + `refresh_token` cookies. The `/me` call should return the same user using those cookies.

## Auth design notes
- Access token: 15 min, httpOnly cookie + Bearer header fallback
- Refresh token: 7 days, httpOnly cookie, POST /api/auth/refresh issues new access token
- Brute force: 5 failed attempts per ip:email = 15 min lockout (429)
- Frontend axios interceptor auto-refreshes on 401 and retries once
