# Tankyard

A water/storage tank storefront: browsable listings, prices, and your payment
details (phone/mobile money, bank, Binance). You edit everything after
logging in as the seller.

This is a normal React + Vite site backed by Supabase (free tier), so it
runs as a real, standalone website on your own domain.

## 1. Create your database (Supabase)

1. Go to supabase.com, sign up free, and create a new project.
2. In the project, open the **SQL Editor** and run:

```sql
create table products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  capacity text,
  price numeric not null,
  image_url text,
  description text,
  created_at timestamptz default now()
);

create table settings (
  key text primary key,
  value text
);

alter table products enable row level security;
alter table settings enable row level security;

-- Anyone visiting the site can view listings and payment info
create policy "public read products" on products for select using (true);
create policy "public read settings" on settings for select using (true);

-- Only a logged-in (authenticated) user can add, edit, or delete
create policy "auth write products" on products for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "auth write settings" on settings for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
```

3. Go to **Authentication → Users → Add user**, and create your own seller
   login (email + password). This is what you'll use to log in as the seller
   on the live site — there's no separate signup page on purpose, so
   strangers can't create their own admin accounts.
4. Go to **Project Settings → API** and copy the **Project URL** and the
   **anon public key**.

## 2. Configure the project

Copy `.env.example` to `.env` and fill in the two values from step 1.4:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-public-key
```

## 3. Run it locally (optional, to check it works)

```
npm install
npm run dev
```

Opens at http://localhost:5173 — log in with the seller account you created,
add a tank, confirm it shows up.

## 4. Deploy to hosting

A domain alone doesn't host files — you still need a host to serve the site;
the domain just points at it. Vercel's free tier is the simplest pairing:

1. Push this folder to a new GitHub repository.
2. Go to vercel.com, sign up free, **Add New Project**, import that repo.
3. When it asks for environment variables, add the same two from your
   `.env` file.
4. Deploy. You'll get a working `https://something.vercel.app` URL first —
   confirm the live site works before attaching your domain.

## 5. Point your own domain at it

1. Buy a domain (Namecheap, Google Domains, etc.) if you haven't already.
2. In Vercel: **Project → Settings → Domains**, add your domain
   (e.g. `tankyard.com`).
3. Vercel shows you DNS records to add. Go to your domain registrar's DNS
   settings and add exactly what Vercel shows (usually an A record and a
   CNAME for `www`).
4. DNS can take a few minutes to a few hours to update. Once it does,
   your site is live at your own domain, fully connected to your database.

## Notes

- Product images are linked by URL, not uploaded — host photos somewhere
  (e.g. a free image host, or a Supabase Storage bucket) and paste the link
  in when adding a tank.
- Prices are stored as plain numbers in KES — edit `CURRENCY` in
  `src/App.jsx` if you sell in a different currency.
- Only your seller account (created in Supabase, step 1.3) can add, edit,
  or delete listings and payment details — visitors can only browse and
  view payment info.
