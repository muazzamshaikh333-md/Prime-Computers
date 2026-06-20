# Prime Computers — Backend v1.1 (Admin Dashboard + Tracking + Security)

## What's new in this version

1. **Admin Dashboard** (`frontend/admin.html`)
   - Owner login screen (protected by ADMIN_KEY)
   - View all print requests as cards, with stats (Pending/In Progress/Ready/Completed)
   - Change status with one click
   - Download/view the PDF directly
   - Delete a request (also removes the PDF file)
   - Search by name/phone/Request ID, filter by status

2. **Customer Order Tracker** (`frontend/track-order.html`)
   - Customer enters their Request ID
   - Sees current status with a visual progress tracker
   - No login needed — public page

3. **Security improvements**
   - `helmet` — adds standard security HTTP headers
   - `express-rate-limit` — blocks spam (max 8 submissions per 15 min per IP)
   - Admin routes (`GET /api/print-requests` list, `PATCH`, `DELETE`) now require
     a secret `ADMIN_KEY` sent via the `x-admin-key` header. The dashboard handles
     this automatically once you log in with the key.
   - Customer-facing lookup (`GET /api/print-requests/:id`) only returns safe,
     non-sensitive fields.

4. **Customer email confirmation**
   - The print form now has an optional Email field.
   - If filled, the customer gets a confirmation email with their Request ID.

## Setup (in addition to what you already did)

1. In the `backend` folder, install the 2 new packages:
   ```
   npm install
   ```
   (this reads the updated package.json and installs helmet + express-rate-limit automatically)

2. Open `.env` and add a new line — make up any long random string as your admin key:
   ```
   ADMIN_KEY=your-own-secret-key-here
   ```

3. Restart the backend:
   ```
   npm start
   ```

4. Open `frontend/admin.html` with Live Server, log in with the same `ADMIN_KEY`
   you put in `.env`.

5. Open `frontend/track-order.html` (also via Live Server) to test the customer
   tracking page — use a Request ID from a request you already submitted.

## Notes

- `admin.html` is **not linked anywhere in the public navigation** — only the
  owner should know this URL. Keep the ADMIN_KEY private; whoever has it can
  see and manage all customer requests.
- When you eventually deploy the backend online, change the `BACKEND_URL`
  constant at the top of `admin.html`, `track-order.html`, and
  `print-services.html` to your live backend URL.
