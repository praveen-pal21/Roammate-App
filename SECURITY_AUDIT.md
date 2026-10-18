# Roammate — Security & Production Readiness Audit (Known Gaps & Roadmap)

**Target Product:** Roammate Travel Dating & Group Expeditions  
**Current Baseline Status:** Phase 0 Completed (~4.5 / 10)  
**Next Milestones:** Phase 1 (Privacy & Data Model) → Phase 2 (Server-Side Matching) → Phase 3 (Trust, Safety & Legal)

---

## 🎯 Production Readiness Gap Analysis

This document provides an honest assessment of current security, privacy, and architectural controls in the Roammate codebase, tracking against our active production readiness roadmap.

---

## 📋 Control Status & Roadmap Mapping

| Area | Current Status | Known Gap / Vulnerability | Roadmap Target |
| :--- | :---: | :--- | :---: |
| **API Keys & Credentials** | ⚠️ Partial | Client Firebase key is public (by design); HTTP referrer restrictions need to be configured in Google Cloud Console. | Phase 0.5 |
| **Data Privacy (Profiles)** | 🛑 High Gap | `email` is currently written to `profiles/{uid}` readable by all signed-in users. Needs split into `profiles/{uid}` (public) and `private/{uid}` (owner-only). | Phase 1.1 |
| **Profile Schema Lock** | ⚠️ Partial | Types are validated in `firestore.rules`, but strict `keys().hasOnly([...])` field allow-list is needed. | Phase 1.2 |
| **Photo Storage** | ⚠️ Partial | Photos are canvas-compressed base64 strings in Firestore. Needs migration to Firebase Storage with content-type and size rules. | Phase 1.3 |
| **Email Verification** | ⚠️ Missing | Client allows unverified email sign-ups; server rules must require `request.auth.token.email_verified == true`. | Phase 1.4 |
| **Matching & Like Privacy** | 🛑 Critical Gap | `likes/{uid}` is readable by signed-in users, allowing client inspection of who liked whom. Must move to private `swipes` + Cloud Function `onSwipe` trigger. | Phase 2.1 |
| **Discovery Feed** | ⚠️ Scalability Gap | Client subscribes to candidate profiles directly. Needs `getDiscoverBatch` callable Cloud Function with composite indexes. | Phase 2.2 |
| **Chat Authorization** | ⚠️ Partial | Chat documents require 2-member membership check, but do not yet verify an active mutual match document. | Phase 2.4 |
| **Trip Collaboration** | ⚠️ Partial | Activities are stored in a map on the trip document (concurrency risk). Needs subcollection `trips/{tid}/activities`. | Phase 2.5 |
| **Group Capacity & Posts** | ⚠️ Partial | Joining needs hard transactional capacity check via callable function; group posts must enforce joined membership. | Phase 2.6 |
| **Rate Limiting** | ⚠️ Client Only | 400ms message throttle and swipe debouncing run in client. Needs Cloud Function / Firestore rule rate limits + App Check. | Phase 2.7, 2.8 |
| **Trust & Safety (Block/Report)** | 🛑 Critical Gap | Block, report, unmatch, and account deletion flows must be implemented with moderator alerting. | Phase 3.1–3.5 |
| **Legal & Compliance** | ⚠️ In Progress | Terms of Service, Privacy Policy, and Community Guidelines need dedicated legal routes (`/terms`, `/privacy`). | Phase 3.8 |
| **Chat Pagination** | ✅ Fixed | Reversed newest 50 messages pagination implemented; avoids load failure past 300 messages. | Phase 4.2 |
| **Error & Toast Accuracy** | ✅ Fixed | `safe()` returns boolean; success toasts only display when database operations actually succeed. | Phase 4.3 |
| **Hosting Security Headers** | ⚠️ Note | Render static hosting does not read `_headers` syntax. Firebase Hosting (`firebase.json`) or Render dashboard headers required. | Phase 4.9 |
| **Code Structure & Tests** | ⚠️ Future | Monolithic `app.js` needs modularization, Vite bundling, and `@firebase/rules-unit-testing` emulator test suite. | Phase 5.1–5.3 |

---

## 🔒 Immediate Phase 0 Actions Completed
1. ✅ **Removed fake promo code & fake announcements**: `DEFAULT_ANNOUNCEMENTS` (`ROAMFIRST20`, Roammate 2.0) deleted. Empty announcements state rendered when database has no announcements.
2. ✅ **Removed hard-coded sample events**: `SAMPLE_EVENTS` deleted from all views and document titles.
3. ✅ **Prevented non-dev database seeding**: `scripts/seed.mjs` restricted to `roammate-dev` or emulator; `"*"` wildcard like removed from `likesMe()`.
4. ✅ **Removed prototype dead code**: `S.canWrite` checks and prototype banner text removed.
5. ✅ **Removed PII from analytics dispatch**: Stripped personal names, specific destinations, and titles from client `trackEvent`.
6. ✅ **Updated security reporting contact**: Directed to GitHub Security Advisories in `SECURITY.md`.
