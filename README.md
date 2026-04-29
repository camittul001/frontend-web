# A2N Web (frontend-web)

Responsive web companion to the A2N Flutter mobile app, sharing the same backend API and AWS Cognito user pool — so a user can sign in and see the same initiatives, participants, verifications, and leaderboard rank from either platform.

- **Stack**: Next.js 15 (App Router) · TypeScript · MUI v6 · AWS Amplify v6 (Cognito Auth) · TanStack Query · Zustand
- **Deploy target**: AWS Amplify Hosting
- **Backend / Cognito**: shared with the Flutter mobile app (no backend changes)

## Local development

Requires Node.js 20+.

```bash
cp .env.example .env.local
npm install
npm run dev
```

The app boots at <http://localhost:3000>.

### Environment variables

All values are also expected as **Environment variables** in AWS Amplify Hosting (per branch).

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | A2N backend API base URL (no trailing slash). |
| `NEXT_PUBLIC_COGNITO_REGION` | AWS region of the Cognito User Pool. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_ID` | Cognito User Pool ID. |
| `NEXT_PUBLIC_COGNITO_USER_POOL_CLIENT_ID` | Cognito User Pool App Client ID. |

Defaults in `.env.example` point at the same dev pool the Flutter app uses, so signing in with a mobile-app account here yields identical data.

## Project layout

```
src/
  app/                    # Next.js App Router
    (auth)/login          # public auth pages
    (auth)/signup
    (app)/                # authenticated shell (auth gate + nav)
      home/
      feed/
      leaderboard/
      profile/
      profile/edit/
      initiative/new/
      initiative/[id]/
      initiative/[id]/edit/
    layout.tsx            # root + Providers
    page.tsx              # redirect entry
  components/             # MUI building blocks (AppShell, cards, form)
  lib/
    amplify.ts            # Amplify v6 config from env vars
    api/client.ts         # fetch + Cognito ID token injection
    api/initiatives.ts    # endpoint wrappers (parity with mobile)
    api/auth.ts           # POST /auth/profile
    queries.ts            # TanStack Query hooks + invalidation
    distance.ts           # Haversine
    geolocation.ts        # browser GPS + manual override + Pune fallback
    scoring.ts            # constants from mobile app
  store/
    auth.ts               # Zustand auth slice
    locationOverride.ts   # persisted manual location
  theme/                  # MUI theme matching the Flutter palette
  types/                  # wire models (User, Initiative, …)
```

## Deploying to AWS Amplify Hosting

1. **Push this folder to its own GitHub repository.**
   ```bash
   git remote add origin <your-new-repo-url>
   git push -u origin main
   ```
2. In the AWS Amplify Console: *Host web app → Connect a repository* → pick the new GitHub repo and branch.
3. Amplify will detect `amplify.yml` at the repo root — keep the suggested build settings.
4. Under **App settings → Environment variables**, add every variable from `.env.example` with the appropriate value for that branch (use the same Cognito pool as mobile to keep data shared, or a dedicated prod pool if you split environments).
5. Trigger a build. The first deploy provisions a Next.js SSR app on the Amplify Hosting compute runtime.

### Cognito callback URLs

If your User Pool app client uses Cognito Hosted UI / OAuth callback URLs, add the Amplify Hosting domain (`https://<branch>.<app-id>.amplifyapp.com`) and any custom domain to the allowed callback / sign-out URLs. The current dev pool uses USER_SRP_AUTH (direct username/password), which does **not** require callback URL allow-listing.

## Feature parity with the Flutter app

| Capability | Mobile | Web |
|---|---|---|
| Email/password sign-up + sign-in (Cognito SRP) | ✓ | ✓ |
| First-time profile (name / area / city) | ✓ | ✓ |
| Home dashboard (upcoming, open nearby, points) | ✓ | ✓ |
| 5 km geo-feed | ✓ (device GPS) | ✓ (browser GPS + manual override + Pune fallback) |
| Initiative create / edit / delete | ✓ | ✓ |
| Join initiative | ✓ | ✓ |
| Add / remove co-hosts | ✓ | ✓ |
| Verify completion | ✓ | ✓ |
| Leaderboard | ✓ | ✓ |
| Profile screen + my initiatives | ✓ | ✓ |
| Image upload | ✕ (UI only) | ✕ (deferred — same backend gap) |
| Push notifications | ✕ | ✕ |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Local dev server with HMR. |
| `npm run build` | Production build (run before deploying). |
| `npm run start` | Run the production build. |
| `npm run lint` | ESLint (Next config). |
| `npm run typecheck` | TypeScript check (no emit). |

## Notes

- The Cognito ID token is sent as the raw `Authorization` header (no `Bearer` prefix) to match the API Gateway authorizer and the mobile app's contract.
- All data fetching is client-side; pages are marked `"use client"`. Authenticated routes are gated by `src/app/(app)/layout.tsx`, which also redirects to `/profile/edit` when `custom:profile_completed !== "true"`.
- `next/image` is not used yet; once initiatives carry image URLs, configure remote patterns in `next.config.ts`.
