# MulliganLinks — Environment Setup Guide

This guide walks you through filling in the environment variables your app needs to run. You will copy values from three services (Supabase, Stripe, and Resend) into a file called `.env.local` in the root of this project.

**No coding experience required.** Just follow each section in order.

---

## Before You Start

Open the file `.env.local` in the project root. It contains lines like:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
...
```

You will paste the real values after the `=` sign on each line.

---

## 1. Supabase

Supabase stores your waitlist data and handles your database.

**Steps:**

1. Go to [https://supabase.com](https://supabase.com) and sign in.
2. Open your project (or create one if you haven't yet).
3. In the left sidebar, click **Settings** (the gear icon at the bottom).
4. Click **API** in the Settings menu.
5. You will see three values you need:

   - **Project URL** — copy this and paste it as the value for `NEXT_PUBLIC_SUPABASE_URL`.
   - **anon / public** key (listed under "Project API keys") — copy this and paste it as the value for `NEXT_PUBLIC_SUPABASE_ANON_KEY`. This key is safe to expose in the browser.
   - **service_role** key (also under "Project API keys") — copy this and paste it as the value for `SUPABASE_SERVICE_ROLE_KEY`.

> **Important:** The `service_role` key has full access to your database and must be kept secret. Never share it publicly or commit it to GitHub.

Your `.env.local` should look like this when done:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5...
```

---

## 2. Stripe

Stripe handles payments.

**Steps:**

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and sign in.
2. Make sure you are in **Test mode** — look for the "Test mode" toggle in the top-right corner. Test mode keys let you try payments without real money.
3. In the left sidebar, click **Developers**, then click **API keys**.
4. You will see two keys:

   - **Publishable key** — starts with `pk_test_`. Copy it and paste it as the value for `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
   - **Secret key** — starts with `sk_test_`. Click "Reveal test key" to see it, then copy it and paste it as the value for `STRIPE_SECRET_KEY`.

> **Important:** The secret key must be kept private. Never share it or commit it to GitHub.

**For the webhook secret (`STRIPE_WEBHOOK_SECRET`):**

Stripe webhooks let your app receive real-time notifications from Stripe (e.g., when a payment completes). During local development, you listen for these events using the Stripe CLI.

1. Install the Stripe CLI by following the instructions at [https://stripe.com/docs/stripe-cli](https://stripe.com/docs/stripe-cli).
2. Open a terminal window and run:
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. The CLI will print a line that says: `Your webhook signing secret is whsec_...`
4. Copy that value and paste it as `STRIPE_WEBHOOK_SECRET`.

> Note: You must keep this terminal window running while you test payments locally. Each time you restart `stripe listen`, it may generate a new secret — update `.env.local` if that happens.

Your `.env.local` Stripe section should look like:

```
STRIPE_SECRET_KEY=sk_test_51...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 3. Resend

Resend sends transactional emails (e.g., your waitlist confirmation email).

**Steps:**

1. Go to [https://resend.com](https://resend.com) and sign in (or create a free account).
2. In the left sidebar, click **API Keys**.
3. Click **Create API Key**, give it a name (e.g., "MulliganLinks Dev"), and click **Add**.
4. Copy the key that appears — it starts with `re_`.
5. Paste it as the value for `RESEND_API_KEY`.

> **Important:** This key is only shown once. Copy it before closing the window.

```
RESEND_API_KEY=re_...
```

---

## 4. App URL

This variable tells the app what its own web address is.

- **For local development**, set it to:
  ```
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```

- **When you deploy to production** (e.g., on Vercel), change it to your real domain:
  ```
  NEXT_PUBLIC_APP_URL=https://mulliganlinks.com
  ```

You will need to update this value before going live.

---

## 5. Running the Database Migration

Your database needs a table to store waitlist signups. The SQL file that creates it is located at:

```
supabase/migrations/001_waitlist.sql
```

**Steps to run it:**

1. Go to [https://supabase.com](https://supabase.com) and open your project.
2. In the left sidebar, click **SQL Editor**.
3. Click **New query** (or the `+` button).
4. On your computer, open the file `supabase/migrations/001_waitlist.sql` in any text editor (TextEdit, VS Code, etc.).
5. Select all the text in that file and copy it.
6. Paste it into the SQL Editor in Supabase.
7. Click the green **Run** button.

You should see a success message at the bottom. Your database is now ready to accept waitlist signups.

---

## You're Done!

Once all the values in `.env.local` are filled in and the migration has been run, start the app with:

```
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

If anything looks wrong or you get an error, double-check that each value in `.env.local` was pasted correctly with no extra spaces.
