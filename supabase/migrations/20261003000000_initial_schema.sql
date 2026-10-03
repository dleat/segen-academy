-- Segen Academy: first version of the database.
--
-- Students sign up, pick an offer (a single course or a bundle), pay by
-- Telebirr or bank transfer and upload a receipt. Dleat (an admin) approves
-- the receipt, which starts a 30-day access window. Inside that window one
-- lesson opens per day, counted in Ethiopian time from the day of approval.
--
-- YouTube video ids live in their own table and are only readable for
-- lessons a student has already unlocked, so the browser never receives a
-- locked video's link.

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  phone text not null default '',
  country text not null default 'Ethiopia',
  language text not null default 'en' check (language in ('en', 'ti')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

comment on column public.profiles.full_name is 'Name as it should appear on the certificate';

-- Create a profile row whenever someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, phone, country, language)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'country', ''), 'Ethiopia'),
    case when new.raw_user_meta_data ->> 'language' = 'ti' then 'ti' else 'en' end
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- True when the signed-in user is an admin (Dleat).
create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

-- ---------------------------------------------------------------------------
-- Courses, offers and lessons (the catalogue)
-- ---------------------------------------------------------------------------

create table public.courses (
  id text primary key,                       -- short slug, e.g. 'premiere-pro'
  badge text not null default '',            -- two letters shown on the card, e.g. 'Pr'
  title_en text not null,
  title_ti text not null default '',
  summary_en text not null default '',
  summary_ti text not null default '',
  description_en text not null default '',
  description_ti text not null default '',
  access_days integer not null default 30 check (access_days > 0),
  published boolean not null default true,
  sort_order integer not null default 0
);

-- Something a student can buy: one course, or a bundle of several.
create table public.offers (
  id text primary key,
  title_en text not null,
  title_ti text not null default '',
  price_usd integer not null check (price_usd >= 0),
  published boolean not null default true,
  sort_order integer not null default 0
);

create table public.offer_courses (
  offer_id text not null references public.offers (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  primary key (offer_id, course_id)
);

create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  day integer not null check (day > 0),
  title_en text not null,
  title_ti text not null default '',
  unique (course_id, day)
);

-- Kept apart from lessons so that row level security can hide the video of
-- any lesson that is still locked for the student.
create table public.lesson_videos (
  lesson_id uuid primary key references public.lessons (id) on delete cascade,
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{6,20}$')
);

-- ---------------------------------------------------------------------------
-- Purchases (one per receipt)
-- ---------------------------------------------------------------------------

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  offer_id text not null references public.offers (id),
  method text not null check (method in ('telebirr', 'bank', 'abroad')),
  receipt_path text,                          -- path in the private 'receipts' bucket
  note text not null default '',              -- anything the student wants Dleat to know
  status text not null default 'waiting' check (status in ('waiting', 'approved', 'rejected')),
  reject_reason text,
  starts_at timestamptz,
  ends_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (method = 'abroad' or receipt_path is not null),
  check (status <> 'approved' or (starts_at is not null and ends_at is not null))
);

create index purchases_user_idx on public.purchases (user_id);
create index purchases_status_idx on public.purchases (status);

-- ---------------------------------------------------------------------------
-- Site settings (one row, edited by Dleat from the admin page)
-- ---------------------------------------------------------------------------

create table public.site_settings (
  id boolean primary key default true check (id),
  contact_phone text not null default '+251979298765',
  telebirr_number text not null default '',
  telebirr_name text not null default '',
  bank_details text not null default '',
  price_note_en text not null default '',
  price_note_ti text not null default ''
);

insert into public.site_settings (id) values (true);

-- ---------------------------------------------------------------------------
-- Access rules
-- ---------------------------------------------------------------------------

-- Today's date in Ethiopia. Lessons open at midnight Addis Ababa time.
create function public.academy_today()
returns date
language sql
stable
as $$
  select (now() at time zone 'Africa/Addis_Ababa')::date;
$$;

-- The current student's access to one course: when it started, when it
-- ends, and how many lessons are open today (0 when there is no access).
create function public.course_access(p_course_id text)
returns table (purchase_id uuid, starts_at timestamptz, ends_at timestamptz, unlocked_day integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.starts_at,
    p.ends_at,
    (public.academy_today() - (p.starts_at at time zone 'Africa/Addis_Ababa')::date + 1)::integer
  from public.purchases p
  join public.offer_courses oc on oc.offer_id = p.offer_id
  where p.user_id = auth.uid()
    and oc.course_id = p_course_id
    and p.status = 'approved'
    and p.starts_at <= now()
    and p.ends_at > now()
  order by p.starts_at desc
  limit 1;
$$;

-- Whether the current user may watch a given lesson right now.
create function public.can_watch(p_lesson_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.lessons l
    cross join lateral public.course_access(l.course_id) a
    where l.id = p_lesson_id
      and l.day <= a.unlocked_day
  );
$$;

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.offers enable row level security;
alter table public.offer_courses enable row level security;
alter table public.lessons enable row level security;
alter table public.lesson_videos enable row level security;
alter table public.purchases enable row level security;
alter table public.site_settings enable row level security;

-- Profiles: students see and edit their own; admins see everyone.
create policy "read own profile" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "update own profile" on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Students may only change these columns; is_admin can only be set in SQL.
revoke update on public.profiles from anon, authenticated;
grant update (full_name, phone, country, language) on public.profiles to authenticated;

-- Catalogue: everyone can read what is published; admins manage it.
create policy "read published courses" on public.courses
  for select using (published or public.is_admin());
create policy "admin manages courses" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read published offers" on public.offers
  for select using (published or public.is_admin());
create policy "admin manages offers" on public.offers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "read offer courses" on public.offer_courses
  for select using (true);
create policy "admin manages offer courses" on public.offer_courses
  for all using (public.is_admin()) with check (public.is_admin());

-- Lesson titles are public so the course page can list them.
create policy "read lessons" on public.lessons
  for select using (true);
create policy "admin manages lessons" on public.lessons
  for all using (public.is_admin()) with check (public.is_admin());

-- Videos: only for lessons the student has unlocked.
create policy "watch unlocked videos" on public.lesson_videos
  for select using (public.can_watch(lesson_id));
create policy "admin manages videos" on public.lesson_videos
  for all using (public.is_admin()) with check (public.is_admin());

-- Purchases: students create and read their own; approval goes through the
-- admin functions below.
create policy "read own purchases" on public.purchases
  for select using (user_id = auth.uid() or public.is_admin());
create policy "create own purchase" on public.purchases
  for insert with check (user_id = auth.uid() and status = 'waiting');

revoke insert, update on public.purchases from anon, authenticated;
grant insert (offer_id, method, receipt_path, note) on public.purchases to authenticated;

-- Settings: public to read, admin to change.
create policy "read settings" on public.site_settings
  for select using (true);
create policy "admin updates settings" on public.site_settings
  for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- Admin actions
-- ---------------------------------------------------------------------------

-- Approve a receipt. The month starts now, so lesson 1 opens today.
create function public.approve_purchase(p_purchase_id uuid)
returns public.purchases
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.purchases;
  days integer;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can approve payments';
  end if;

  select coalesce(max(c.access_days), 30) into days
  from public.purchases p
  join public.offer_courses oc on oc.offer_id = p.offer_id
  join public.courses c on c.id = oc.course_id
  where p.id = p_purchase_id;

  update public.purchases
  set status = 'approved',
      reject_reason = null,
      starts_at = now(),
      ends_at = now() + make_interval(days => days),
      reviewed_at = now()
  where id = p_purchase_id and status = 'waiting'
  returning * into result;

  if result.id is null then
    raise exception 'Payment not found or already reviewed';
  end if;
  return result;
end;
$$;

create function public.reject_purchase(p_purchase_id uuid, p_reason text)
returns public.purchases
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.purchases;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can reject payments';
  end if;

  update public.purchases
  set status = 'rejected',
      reject_reason = coalesce(nullif(trim(p_reason), ''), 'Receipt could not be confirmed'),
      reviewed_at = now()
  where id = p_purchase_id and status = 'waiting'
  returning * into result;

  if result.id is null then
    raise exception 'Payment not found or already reviewed';
  end if;
  return result;
end;
$$;

-- Give a student extra days on an approved purchase.
create function public.extend_purchase(p_purchase_id uuid, p_days integer)
returns public.purchases
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.purchases;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can extend access';
  end if;
  if p_days is null or p_days < 1 or p_days > 365 then
    raise exception 'Days must be between 1 and 365';
  end if;

  update public.purchases
  set ends_at = greatest(ends_at, now()) + make_interval(days => p_days)
  where id = p_purchase_id and status = 'approved'
  returning * into result;

  if result.id is null then
    raise exception 'Approved payment not found';
  end if;
  return result;
end;
$$;

revoke execute on function public.approve_purchase(uuid) from public, anon;
revoke execute on function public.reject_purchase(uuid, text) from public, anon;
revoke execute on function public.extend_purchase(uuid, integer) from public, anon;
grant execute on function public.approve_purchase(uuid) to authenticated;
grant execute on function public.reject_purchase(uuid, text) to authenticated;
grant execute on function public.extend_purchase(uuid, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Receipt pictures
-- ---------------------------------------------------------------------------

-- Private bucket. Each student uploads into a folder named after their id.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

create policy "students upload own receipts" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'receipts' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "students and admin read receipts" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'receipts'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin())
  );
