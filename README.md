# Sam's Knack / Samsknack — Internal Manager

A private, mobile-first order, inventory, catalogue and business-spend manager for the Samsknack team.

## What is already wired

- React + Vite frontend
- Vercel serverless API proxy
- Google Apps Script API
- Google Sheets as the master database
- Google Drive for product/reference images
- Google Identity Services login
- Server-side Google ID-token verification + approved-email allowlist
- Multiple products in one order
- Catalogue-driven product selection
- Automatic catalogue image display
- Per Piece / Set of 2
- 8 maximum colours, with product-specific colour lists
- Customization details required when customization is enabled
- Optional customization reference image
- Automatic Personal (1–50 actual pieces) / Bulk (51+ actual pieces)
- Bulk SKC code
- Duplicate active-order protection by phone number
- Product inventory + packaging inventory
- Purchases & expenses
- Dashboard metrics

## 1. Local development

Install Node.js 18+.

From the folder containing `package.json`:

```bash
npm install
npm run dev
```

### Local API proxy

Vite now proxies `/api/backend` to the Apps Script URL, so the same frontend code works locally and on Vercel.

Create `.env.local`:

```text
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID
VITE_API_BASE=/api
GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

Restart `npm run dev` after changing `.env.local`.

## 2. Create the Google Sheet

Create a new Google Sheet for Samsknack data. Copy its spreadsheet ID from the URL.

Example:

`https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit`

You will paste that ID into `apps-script/Code.gs`.

## 3. Create the Google Drive folder

Create one Google Drive folder for Samsknack images. Copy the folder ID from the folder URL.

Use the same folder for:

- product catalogue images
- customization/reference images

Keep the folder access restricted to the Samsknack team. The app stores the Drive file URL and ID in Sheets.

## 4. Google OAuth Web Client

In Google Cloud Console, create an OAuth 2.0 Client ID of type **Web application**.

Authorized JavaScript origins should include:

- `http://localhost:5173`
- your Vercel production URL, for example `https://samsknack-xxx.vercel.app`

Copy the Web Client ID.

## 5. Configure Apps Script

Open your Google Sheet → **Extensions → Apps Script**.

Replace the Apps Script editor contents with:

`apps-script/Code.gs`

At the top, replace:

```javascript
SPREADSHEET_ID: 'PASTE_GOOGLE_SHEET_ID_HERE',
DRIVE_FOLDER_ID: 'PASTE_GOOGLE_DRIVE_FOLDER_ID_HERE',
GOOGLE_CLIENT_ID: 'PASTE_GOOGLE_OAUTH_WEB_CLIENT_ID_HERE',
```

Do not put a service-account JSON key anywhere in the React project.

### Run setup

In Apps Script, choose the function:

`setupSamsknack`

and click **Run**.

Google will ask you to authorize the script the first time. Approve the requested Sheets/Drive access.

The setup creates:

- `ORDERS`
- `ORDER_ITEMS`
- `CUSTOMERS`
- `PRODUCTS`
- `INVENTORY`
- `PACKAGING`
- `PURCHASES_EXPENSES`
- `TEAM`
- `SETTINGS`

It also seeds the starter catalogue.

## 6. Deploy Apps Script as the API

Apps Script → **Deploy → New deployment** → choose **Web app**.

Use:

- Execute as: **Me**
- Who has access: **Anyone**

Deploy and copy the `/exec` URL.

Put that URL into `.env.local` as `GAS_WEB_APP_URL` for local testing.

For Vercel, the same value goes into a server-side environment variable named `GAS_WEB_APP_URL`.

## 7. Test the API before Vercel

With `.env.local` configured, restart Vite.

Open:

`http://localhost:5173/`

Google sign-in should appear.

After signing in with one of these approved accounts, the app calls Apps Script:

- samsknack@gmail.com
- snehalshinde302001@gmail.com
- sandeshshinde15@gmail.com
- anket.nalawade42@gmail.com

Any other Google account is rejected by Apps Script.

## 8. Deploy to Vercel

Push the project to GitHub and import it into Vercel, or use the Vercel CLI.

Set these Vercel environment variables:

```text
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_WEB_CLIENT_ID
VITE_API_BASE=/api
GAS_WEB_APP_URL=https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
```

`GAS_WEB_APP_URL` must **not** start with `VITE_`; it is server-side only.

Redeploy after adding/changing environment variables.

Then add the final Vercel URL to the Google OAuth client's Authorized JavaScript origins.

## Important architecture

Browser → Vercel `/api/backend` → Google Apps Script → Google Sheets / Google Drive

The browser never receives a Google service-account secret. Apps Script performs the actual Sheets and Drive operations.

## Current intentional limits

This is the first connected working version. The app deliberately keeps accounting simple and calls profit **Estimated Profit**. More advanced accounting, audit logs, stock movements, and role permissions can be added after the team has used the workflow for real orders.
