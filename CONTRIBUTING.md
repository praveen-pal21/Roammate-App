# Contributing to Roammate 🤝

Thank you for your interest in contributing to **Roammate**! We welcome contributions ranging from bug fixes and documentation improvements to new features.

---

## 1. Guiding Principles

- **Zero Build Step:** Keep the core app pure HTML, CSS, and vanilla ES Modules. Do not add heavy bundlers (Webpack, Vite, Rollup) unless there is a clear consensus for an architectural shift.
- **Lightweight & Fast:** Maintain fast load times and clean code without unnecessary external libraries.
- **Strict Security:** Every new Firestore path or action must be secured in `firestore.rules`.

---

## 2. Local Development Setup

### Prerequisites
- Node.js (v18+ recommended) or any simple HTTP server (Python 3, etc.)
- A Firebase project (Spark free tier is sufficient)

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/praveen-pal21/Roammate-App.git
   cd Roammate-App
   ```

2. **Configure Firebase:**
   - Copy your Web App config from the Firebase Console into `firebase-config.js`:
     ```javascript
     export const firebaseConfig = {
       apiKey: "YOUR_API_KEY",
       authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
       projectId: "YOUR_PROJECT_ID",
       storageBucket: "YOUR_PROJECT_ID.appspot.com",
       messagingSenderId: "YOUR_SENDER_ID",
       appId: "YOUR_APP_ID",
     };
     ```

3. **Start a local static server:**
   ```bash
   npx serve .
   # or
   python -m http.server 8080
   ```
   Open the displayed URL in your browser.

4. **(Optional) Seed Test Profiles:**
   ```bash
   cd scripts
   npm install
   # Place your Firebase service account key as scripts/service-account.json
   npm run seed
   ```

---

## 3. Contribution Workflow

1. **Fork the repository** on GitHub.
2. **Create a topic branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes:**
   - Adhere to the existing coding style and formatting.
   - Maintain comment clarity and avoid introducing dead code.
4. **Test thoroughly:**
   - Verify responsiveness on mobile screen sizes (max width 480px).
   - Test both light mode and dark mode.
   - Test Firestore security rules behavior if you touch data models.
5. **Commit your changes:**
   ```bash
   git commit -m "Add: support for custom itinerary tags"
   ```
6. **Push to your fork and submit a Pull Request:**
   - Describe what the PR accomplishes and test steps followed.

---

## 4. Reporting Issues & Feature Requests

- **Bugs:** Open an issue with reproduction steps, browser/OS version, and console logs.
- **Features:** Open a discussion or issue explaining the use case and proposed UX.
