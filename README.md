# MFD Solutions CMS

An Angular and Tailwind CSS rebuild of the supplied `website.txt` reference, with an Express API and a persistent SQLite content store.

## Run locally

Requirements: Node.js 20.19+ and npm.

```powershell
npm.cmd install
npm.cmd run dev
```

Open [http://localhost:4200](http://localhost:4200) for the website. The admin dashboard is at [http://localhost:4200/admin](http://localhost:4200/admin).

Development login:

- Username: `farooq`
- Password: `farooq123`

The API starts on port 3000. Its first run creates `data/mfd-solutions.sqlite` and seeds the reference website sections. The SQLite database retains edited sections, contact submissions, and newsletter subscriptions.

## Content management

Sign in at `/admin` to add sections, edit titles and descriptions, change layout type, reorder or hide sections, and delete sections. The section content editor accepts JSON so cards, hero slides, FAQs, prices, and other content can be managed without code changes. Saving updates the public website immediately.

## Production

Copy `.env.example` to `.env`, change the admin credentials, and set `NODE_ENV=production`. Production startup refuses to use the development password. Then run:

```powershell
npm.cmd run build
npm.cmd start
```

The production server serves the Angular build and API from the same origin. Set `DATABASE_PATH` if the SQLite file should be stored outside the project directory. Put the server behind HTTPS in production; the admin session cookie is HTTP-only, same-site, and marked secure in production.
