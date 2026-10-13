# Changelog 📜

All notable changes to the **Roammate** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-13

### Added
- **Authentication:**
  - Email/password user registration and login.
  - One-click Google Sign-in popup support.
  - Password reset email delivery.
- **Onboarding & Profiles:**
  - Customizable profile attributes: Name, Age, Gender, City, Bio, Travel Style, and Interests chips.
  - Dating preference controls: Target gender selection and age bracket range (`ageMin` - `ageMax`).
- **Discover & Smart Matching:**
  - Two-way compatibility filtering ensuring both parties fit each other's criteria.
  - Match scoring ($50\% - 99\%$) based on shared interests, identical travel style, and shared home city.
  - Swipe-like Like / Pass card interface with instant match overlay modal.
- **Real-Time 1:1 Chat:**
  - Instant messaging powered by Firestore real-time snapshot listeners.
  - Unread message counter badges on the navigation bar.
  - Quick action to convert a chat connection into a collaborative trip.
- **Collaborative Itinerary Planning:**
  - Multi-day trip creation (up to 30 days) with automated day slots.
  - Ability to invite mutual matches to participate.
  - Shared activity adding and deletion per day with timestamps.
- **Group Travel:**
  - Community trips directory with filtering by *"For you"* (personalized interests) and *"Joined"*.
  - Ability for users to host group trips with capacity constraints.
  - Real-time discussion board within group trips.
- **UI/UX & Design System:**
  - Mobile-first layout with smooth CSS tokens.
  - Automatic light and dark mode switching based on system preferences.
  - Form input and focus restoration during background data sync.
- **Developer Experience:**
  - Firestore security rules (`firestore.rules`).
  - Database seeding utility script for demo travelers and sample group trips (`scripts/seed.mjs`).
