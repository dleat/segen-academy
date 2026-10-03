# Segen Academy

The website for Segen Editing Academy: recorded video editing courses where a
student pays by Telebirr or bank transfer, uploads a receipt, and once Dleat
approves it watches one new lesson a day for a month.

This first version has:

- Homepage, course list and a page for each course, in English and Tigrinya
- Student sign up, log in and password reset
- Payment page: Telebirr, bank transfer, or "outside Ethiopia", with receipt upload
- My courses: waiting, approved and rejected payments, days left
- Lesson player: one lesson opens per day (Ethiopian time) for 30 days, old lessons can be rewatched
- Admin area for Dleat: approve or reject receipts, give extra days, add lessons by pasting YouTube links, set the Telebirr and bank details

Still to come (plan phase 3 and 4): final quiz, project review, certificates,
email notices, more Tigrinya text.

## How it is built

- **Website:** React + Vite, a static site hosted on Cloudflare Pages
- **Database, logins and receipt storage:** Supabase
- **Videos:** unlisted YouTube. The database only gives a student the video of
  a lesson that is already open for them, and only while their month lasts.

The database rules are in `supabase/migrations/`. The courses and prices are
added by `supabase/migrations/20261003000100_catalogue.sql`.

## Setting it up (one time)

These steps need a computer. Each one is free.

1. **Create a Supabase project.** Sign up at supabase.com, click *New project*,
   name it `segen-academy`, choose a strong database password and save it
   somewhere safe, and pick the region closest to Ethiopia (for example
   Frankfurt).
2. **Create the database.** In the project, open *SQL Editor*, paste the whole
   of `supabase/migrations/20261003000000_initial_schema.sql`, and click *Run*.
   Then do the same with `supabase/migrations/20261003000100_catalogue.sql`.
3. **Set the website address for emails.** In *Authentication > URL
   Configuration*, set *Site URL* to the website address (for now the
   Cloudflare address from step 5, later your own domain).
4. **Copy the two public keys.** In *Project Settings > API*, copy the
   *Project URL* and the *anon public* key. Never share the *service_role* key.
5. **Put the site on Cloudflare Pages.** Sign up at cloudflare.com, open
   *Workers & Pages > Create > Pages > Connect to Git*, and choose the
   `segen-academy` repository. Use these settings:
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Environment variables: `VITE_SUPABASE_URL` = the Project URL and
     `VITE_SUPABASE_ANON_KEY` = the anon public key
6. **Make yourself the admin.** Sign up on the website with your own email.
   Then in Supabase *SQL Editor* run this, with your email:

   ```sql
   update public.profiles set is_admin = true
   where id = (select id from auth.users where email = 'your-email@example.com');
   ```

   Log out and in again, and an *Admin* link appears at the top.
7. **Fill in the payment details.** In *Admin > Payment details*, enter the
   Telebirr number, bank accounts and the price in birr.
8. **Add lessons.** In *Admin > Lessons*, choose a course and add one lesson per
   day with the link of an unlisted YouTube video.

## Running it on your own computer (for developers)

```sh
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

Without `.env.local` the site still opens in a preview mode: the public pages
work, and logging in and buying are turned off.

To run Supabase locally instead, install Docker and run `npx supabase start`;
it applies the migrations automatically.
