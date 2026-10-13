# Google authentication

The login/register page uses Firebase web configuration from the `NEXT_PUBLIC_FIREBASE_*`
environment variables listed in `.env.example`. Set actual values in an untracked `.env.local`
or the deployment environment; do not commit configuration values.
It exchanges the Google Firebase ID token through `googleLogin(input: GoogleLoginInput!)`
and uses the returned SkiResort JWT through the existing session storage/Apollo flow.
New users complete a nickname (3–12 characters) and phone after GOOGLE_PROFILE_REQUIRED.
Phone is profile data, not SMS-verified. Existing accounts are not automatically linked.

Before enabling the button:

1. Enable Google in Firebase Authentication and authorize each frontend domain (including localhost for development).
2. Configure backend GOOGLE_APPLICATION_CREDENTIALS with an external Admin service-account file.
3. Confirm the sparse unique firebaseUid database index is built.
4. Fill the Firebase variables and set NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true in .env.local (or the deployment build environment), then restart/rebuild Next.js.

These NEXT_PUBLIC values are included in the browser bundle. Restrict the Firebase web API
key and authorized domains in the provider console. Backend Admin credentials must never
use NEXT_PUBLIC variables. Rotate any key that has been exposed; Git history removal does
not revoke it.

Firebase authentication uses memory persistence and is signed out after obtaining the token.
An ID token awaiting profile completion stays only in component memory; cancel/reload discards it.
Only a successful backend response creates a SkiResort session.

Live acceptance: sign in with Google, complete a new profile, open a guarded member page,
sign out, and sign in again without another profile prompt. Also check popup cancellation,
nickname/phone collisions and blocked-account errors. Credentials, provider setup and
database readiness must be confirmed by the backend operator.

SDK reference: https://firebase.google.com/docs/auth/web/google-signin
