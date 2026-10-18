# Security Policy 🔒

The Roammate team takes security, privacy, and data integrity seriously. This document describes our security model and how to report vulnerabilities.

---

## 1. Supported Versions

| Version | Supported |
|---|---|
| `main` (latest) | :white_check_mark: |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability or security bug, please **do not report it publicly** through GitHub issues.

Instead, please report it privately:
1. Open a private GitHub Security Advisory at: **https://github.com/praveen-pal21/Roammate-App/security/advisories/new** (or email `praveenpal21@users.noreply.github.com`).
2. You will receive an acknowledgment within 48 hours.
3. We will collaborate with you to verify and patch the vulnerability before public disclosure.

---

## 3. Security Architecture & Rules

### Client-Side Configuration vs. Database Secrets
- **`firebase-config.js` is not a secret:** Firebase Web API keys are identifiers used by clients to address the Firebase backend. They are intended to be public in web apps.
- **Access control is strictly enforced by Cloud Firestore Security Rules** (`firestore.rules`):
  - **1:1 Chats:** `chats/{cid}/msgs` are readable and writable *only* by the two members declared in the parent chat document.
  - **Private Trips:** `trips/{tripId}` can only be read, modified, or deleted by the owner or invited matches.
  - **Profiles:** Users can only create or update their own profile document (`profiles/{uid}`).
  - **Group Trips:** Any signed-in user can view group trips, but only the original host can edit or delete the trip.

### Service Account Credentials
- The admin seed script requires `scripts/service-account.json`.
- **Never commit `scripts/service-account.json` to version control.** It is explicitly ignored in `.gitignore`.

---

## 4. Privacy Considerations

- **Likes Visibility:** In the client-only implementation, `likes/{uid}` is readable by signed-in users so mutual matching can be calculated on the client.
- **Roadmap:** For production apps requiring strict like privacy (where user A cannot see who user B liked until a mutual match occurs), matching logic will be moved to a private Cloud Function.
