# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

---

## Status expiration & cleanup (24-hour stories)

This project supports ephemeral "status" posts that should automatically disappear after 24 hours. To make that work reliably you should:

1. When creating a status, store an `expiresAt` timestamp (this project now stores `expiresAt` and `publicId` for Cloudinary uploads in `statuses` documents).
2. Enable Firestore TTL for the `expiresAt` field on the `statuses` collection (Firestore will auto-delete documents once `expiresAt` has passed).
3. If media is hosted on Cloudinary, deploy the Cloud Function in `functions/` that deletes Cloudinary assets when a `statuses/{statusId}` doc is deleted.

Notes & caveats:
- Firestore TTL will remove the document server-side, but Cloudinary assets will only be removed if you deploy the deletion function.
- The client also filters out expired statuses in realtime queries; however, enabling TTL is recommended so old docs are really deleted.
- If you previously have statuses without `expiresAt`, you may want to run a small migration to add `expiresAt` for existing posts.

Migration & testing steps:

- Populate missing expiresAt on existing docs (run locally):

  1. Ensure you have a service account key and set environment variable: `export GOOGLE_APPLICATION_CREDENTIALS="/path/to/key.json"` (Windows: `set` or `PowerShell` equivalents).
  2. Run: `node scripts/populate_expires.js` from project root. Repeat until it reports zero documents.

- Quick expiry test:

  For testing you can temporarily set a short expiry (e.g., 1 minute) in `src/Components/Pages/Status/PostStatus.jsx` by editing the expiresAt calculation to `new Date(Date.now() + 1 * 60 * 1000)` and posting a test status. Verify the document is removed and check Cloud Function logs for Cloudinary deletion.

---

## Post heart reactions ❤️ (new)

- Posts now support a simple heart reaction. Each `posts/{postId}` document stores a `reactions` map, e.g. `{ "<uid>": "❤️" }`.

Manual test steps:

1. Open the Feed (where posts are listed). Click the heart button on a post — you should see a heart pop up immediately (animation lasts 0.6s) and the reaction count updates instantly without waiting for Firestore.
2. The change is written to Firestore using a transaction; other users with the feed open will see the count update in real-time.
3. Click the heart again to remove your reaction (optimistic UI + Firestore update). A toast appears with an "Undo" action for 5s.
4. To test failure paths, simulate network errors (offline) and verify the UI reverts and a failure toast appears.

Notes:
- Implementation lives in `src/Components/Pages/Status/PostCard.jsx` and `src/Components/Pages/Status/Feed.jsx` (integration).
- The floating heart animation uses Framer Motion and is cleared after 0.6s to match design.

Running tests:

- Install dev dependencies: `npm install --save-dev vitest @testing-library/react @testing-library/jest-dom jsdom`
- Run tests: `npm test`

A basic unit test was added for `PostCard` at `src/Components/Pages/Status/__tests__/PostCard.test.jsx` which mocks Firestore transactions and verifies optimistic UI/pending indicator.

---

