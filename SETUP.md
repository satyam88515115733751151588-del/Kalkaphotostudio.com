# Kalka digital — Dashboard setup

This gives you a private dashboard at `yoursite.com/admin/` for:
- uploading images (goes to Cloudinary, shows up on the site instantly)
- adding YouTube videos (shows up instantly)
- publishing new HTML sections that appear as new navbar links (instantly, no redeploy)

## What goes where

```
your-repo/
├── admin/
│   └── index.html          ← the dashboard (add here)
├── assets/
│   └── site-content.js     ← add here
├── section.html             ← add to repo root
├── index.html, gallery.html, ...  ← your existing pages (small edit needed, see step 4)
```

---

## Step 1 — Supabase (auth + database)

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough). Pick any name/password for the project — that password is just for the underlying Postgres database, not your login.
2. Once it's created, go to **SQL Editor → New query**, paste in the contents of `supabase-schema.sql` (in this folder), and click **Run**. This creates the `images`, `videos`, and `sections` tables.
3. Go to **Project Settings → API**. Copy:
   - **Project URL**
   - **anon public** key
4. Go to **Authentication → Users → Add user** (top right). Create your login:
   - Email: e.g. `studio@kalkadigital.com` (use a real inbox you control, or any address — Supabase won't email it since you're creating it manually)
   - Password: pick something like `Kalka@Digital2026!` — change it to whatever you like, just remember it. **This is your dashboard login.**
   - Set "Auto Confirm User" to on when creating it, so it doesn't need email verification.

That's your demo login sorted — use that email/password to sign into `/admin/`.

---

## Step 2 — Cloudinary (unsigned upload preset)

Your dashboard uploads images straight from the browser to Cloudinary, so it needs an **unsigned upload preset** (no server, no API secret exposed).

1. Log into Cloudinary → **Settings → Upload** → scroll to **Upload presets** → **Add upload preset**.
2. Set **Signing Mode** to **Unsigned**.
3. Give it a name (e.g. `kalka_dashboard`) — you'll paste this into the dashboard code.
4. Save. Also note your **Cloud name** (shown at the top of the Cloudinary dashboard — yours looks like `drppdpiyi` based on your existing image URLs).

---

## Step 3 — Fill in your credentials

Open these three files and replace the placeholder values at the top with what you got in Steps 1–2:

- `admin/index.html` — `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_UPLOAD_PRESET`
- `assets/site-content.js` — `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- `section.html` — same two, near the bottom of the file

(The anon key is safe to expose publicly — it's designed for this. Row Level Security, set up by the SQL script, is what actually protects writes.)

---

## Step 4 — Wire the script into your existing pages

On **every page** (`index.html`, `gallery.html`, `wedding-gallery.html`, etc.), add these two lines right before `</body>`, after your existing `<script src="main.js"></script>`:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="assets/site-content.js"></script>
```

This alone makes new sections appear in your navbar automatically on every page.

**Optional — dynamic images per gallery page.** On any page where you want dashboard-uploaded images to show up automatically (e.g. `wedding-gallery.html`), add a container anywhere in the page:

```html
<div data-dynamic-gallery="wedding"></div>
```

Use the matching value from the dashboard's "Belongs on" dropdown: `gallery`, `wedding`, `family`, `haldi-mehndi`, or `home`.

**Optional — dynamic videos.** On `video-gallery.html`, add:

```html
<div data-dynamic-videos style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;"></div>
```

Every video added in the dashboard will render as an embedded YouTube player inside that grid.

---

## Step 5 — Deploy

Commit and push all of this to your GitHub repo. Vercel will auto-deploy it like normal. From then on:

- Visit `yoursite.com/admin/`, log in, and anything you add appears on the live site **immediately** — no further deploys needed.
- You only need to touch GitHub/Vercel again if you want to change the site's actual design or layout.

---

## A couple of things worth knowing

- **Anyone who knows the login can publish content and HTML to your live site** — treat the dashboard password like any other admin password.
- Uploaded HTML sections are injected directly into the page (via `innerHTML`), so keep dashboard access to people you trust; it's not built to be safe against untrusted uploads.
- Want more than one login? Add more users the same way in **Authentication → Users**.
