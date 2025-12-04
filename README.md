# River - Asset Management System

A modern web application for tracking and managing depreciating assets with real-time value updates, interactive charts, and comprehensive event management.

## Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd river
```

2. Install dependencies:

```bash
npm install
npm run db:setup
```

3. Copy `.env.example` to `.env` (or `.env.local`) and set `APP_BASE_URL` / `PORT` to match the domain + port you want to use. The defaults keep the app on `http://localhost:3000`.

4. Start the development server:

```bash
npm run dev
```

The dev script loads the same `.env*` files as Next.js itself, so it honors your `PORT`/`APP_BASE_URL` settings automatically.

5. Open the URL you configured in `APP_BASE_URL` (for example [http://localhost:3000](http://localhost:3000)).

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Building for Production

```bash
npm run build
npm start
```

## Production Setup After Clone

When deploying or running locally in production mode after cloning the repo:

```bash
git clone <repository-url>
cd river
npm install
cp .env.example .env   # update secrets + URLs as needed
npm run db:setup        # runs Prisma migrations against dev.db
npm run build           # compiles the Next.js app
npm start               # launches the production server via scripts/run-next.mjs
```

The `npm start` command reads the same `.env*` files, so set `APP_BASE_URL`, `NEXT_PUBLIC_APP_URL`, and `PORT` before launching.

## Code Formatting

Format all files:

```bash
npm run format
```
