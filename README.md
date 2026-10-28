# Astana Issue Reporter — mobile app

Residents of Astana report city problems (potholes, broken lights, trash) with a photo and a point on the map.
Other residents like reports to raise their priority, and city services change the status, which notifies the author.

Course: ICT, Astana IT University, group SE-2624. Team: Seitkali Nurtas, Alikhanuly Semser, Aiboluly Aibar.
This app implements the requirements from our Project Stage 1 (Midterm) report.

## Architecture (three-tier, as in midterm C1)

```
 Phone (Expo / React Native)  ──HTTPS/JSON──▶  API server (Node.js + Express, Render)  ──▶  PostgreSQL (Supabase)
        Leaflet + OpenStreetMap map                       │
                                                          └──▶  Photo storage (Supabase Storage)
```

| Part | Technology | Folder |
|---|---|---|
| Mobile client (Android, iOS, also opens in a browser) | React Native with Expo SDK 58, Expo Router | `mobile/` |
| Admin dashboard | Same app, extra tab visible only to admins | `mobile/src/app/(tabs)/admin.js` |
| Backend | Node.js 20+, Express 5, JWT auth | `backend/` |
| Database | PostgreSQL 16 (Supabase in the cloud) | `backend/db/schema.sql` |
| Photo storage | Supabase Storage (local `uploads/` folder in development) | `backend/src/storage.js` |
| Map | Leaflet 1.9 + OpenStreetMap tiles | `mobile/src/components/mapHtml.js` |

### Changes compared with the midterm plan

- **Photos: Supabase Storage instead of Firebase Storage.** Since 2024 Firebase Storage needs the paid Blaze plan with a bank card. Supabase gives free storage with no card and keeps the database and photos in one account.
- **Admin dashboard inside the mobile app instead of a separate React.js site.** One codebase; the app also runs in a browser (`npx expo start --web`), so it can be used as a web dashboard.
- **Notifications (R8):** every status change is saved in the `notifications` table and shown in the Alerts tab; the app also shows a phone notification. The server also sends a real push through the Expo push service when the app is installed as an APK (Expo Go on Android no longer supports remote push).

## Requirements coverage

| ID | Requirement | Where | How it is checked |
|---|---|---|---|
| R1 | Place a mark on the map | `report/new.js` (GPS + tap on map), `reports.js` POST | e2e test creates a report with coordinates |
| R2 | Attach 1 photo (JPG/PNG) | `lib/photo.js`, `storage.js` | API test: real JPG/PNG only, ≤ 2 MB; client compresses to ≤ 1280 px |
| R3 | Like a problem, +1 | `lib/useLike.js`, `POST/DELETE /api/reports/:id/vote` | API test: +1, second like still +1, unlike −1, own report blocked |
| R4 | Category from a predefined list | `categories` table, category chips in the form | API test rejects unknown category |
| R5 | Text description | form field, 5–500 chars (DB `CHECK`) | API test |
| R6 | Status badge | `StatusBadge` in `components/ui.js`, coloured markers | e2e test |
| R7 | Admin changes status | `routes/admin.js`, admin tab, report page | API test: resident gets 403, change is logged in `status_log` |
| R8 | Author is notified | `notify.js`, `lib/notifications.js`, Alerts tab | API + e2e test: author sees "In Progress" notification |
| R9 | Submit in ≤ 5 clicks | "+" opens camera → shutter → confirm → category → Submit | GPS fills the location; typing is not a click |
| R10 | 100+ markers in < 3 s | canvas markers, one indexed query | e2e: 120 markers in ~0.35 s after login |
| R11 | Passwords hashed | `passwords.js`: PBKDF2-SHA256, 100 000 iterations, random salt | API test checks the stored format |
| R12 | Available 24/7 | Render + Supabase cloud | free Render plan sleeps after 15 min; the first request wakes it in up to 1 min |

Success criteria: submit in under 2 minutes; works at 360 px width (checked in e2e, no horizontal scroll); reports sorted by votes (default sort, API test).

## Run locally

Requirements: Node.js 20+, PostgreSQL 14+.

```bash
# 1. API
cd backend
cp .env.example .env          # set DATABASE_URL
npm install
npm run db:reset              # tables + 120 test reports
npm start                     # http://localhost:4000

# 2. App
cd ../mobile
npm install
npx expo start                # scan the QR code with Expo Go on the phone (same Wi-Fi)
```

Test accounts (password `Pass1234!`): admin `user1@example.kz`, residents `user2@example.kz` … `user15@example.kz`.

## Deploy to the cloud

1. **Supabase**: create a project. In Storage create a **public** bucket `report-photos`.
   Copy the *Session pooler* connection string (Connect button) and the *secret* API key.
2. **Render**: New → Blueprint → this repository (uses `render.yaml`). Fill in `DATABASE_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`.
   On the first start the server creates the tables and test data by itself.
3. **App**: in `mobile/.env` set `EXPO_PUBLIC_API_URL=https://<your-service>.onrender.com`, then `npx expo start`.

## Tests

```bash
cd backend && npm test        # 11 API tests against a real PostgreSQL database (astana_test, wiped on each run)
cd mobile && npx expo lint
```
