# MFD Solutions

An Angular and Tailwind CSS website with an optional Express API and SQLite-backed content manager.

## GitHub Pages

GitHub Pages hosts static files only. The Pages build bundles the default website content, omits the admin route, and hides API-backed contact and newsletter forms. Content editing, form submissions, and newsletter signups require the Express backend and are not available on Pages.

To publish this repository:

1. In the GitHub repository, open **Settings → Pages** and set the build and deployment source to **GitHub Actions**.
2. Push to `main` or run the **Deploy to GitHub Pages** workflow manually.

The workflow builds the site with the `/Angular-web-app/` base path, adds a fallback page for client-side routes, and deploys it to Pages. To build locally:

```powershell
npm.cmd ci
npm.cmd run build:github-pages
```

The deployable site is in `dist/mfd-cms/browser`.

## Run locally with the API

Requirements: Node.js 20.19+ and npm.

```powershell
npm.cmd ci
Copy-Item .env.example .env
```

Set unique `ADMIN_USERNAME` and `ADMIN_PASSWORD` values in `.env` before starting the server. The password must be at least 16 characters; generate a random one and keep it out of source control. Then run:

```powershell
npm.cmd run dev
```

Open [http://localhost:4200](http://localhost:4200) for the website and [http://localhost:4200/admin](http://localhost:4200/admin) for the CMS. The API starts on port 3000 and creates `data/mfd-solutions.sqlite` on first run. It stores edited sections, contact messages, and newsletter subscriptions.

## Self-hosted production

The Express API and Angular frontend must be deployed together (or the frontend configured to use a separately hosted API) for the admin and forms to work. Set `NODE_ENV=production`, `ADMIN_USERNAME`, and a unique `ADMIN_PASSWORD` of at least 16 characters in the server's environment, then run:

```powershell
npm.cmd run build
npm.cmd start
```

Set `DATABASE_PATH` to store SQLite outside the project directory. Put the server behind HTTPS; the admin session cookie is HTTP-only, same-site, and secure in production.

> The original development login was present in the repository's earlier commit. Treat it as compromised; do not reuse it. This update removes the defaults from the current source, but does not rewrite published Git history.
