-- Segen Jobs: the work site linked to the academy.
--
-- Clients post a job. Editors that Dleat has approved (Segen certificate plus
-- Dleat's own test) send offers, and the client picks one. The editor
-- delivers a watermarked preview (unlisted YouTube) and the finished file (a
-- Google Drive or similar link). The finished file stays hidden until the
-- client's payment receipt is approved by Dleat. The editor is paid half
-- right after that, the client gets 3 free correction rounds, and when the
-- client accepts the work Dleat keeps 15% and pays the editor the rest.
--
-- Only new tables and functions: nothing in the academy part changes.

-- ---------------------------------------------------------------------------
-- Editors
-- ---------------------------------------------------------------------------

create table public.editors (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  display_name text not null check (length(trim(display_name)) between 2 and 80),
  courses_done text not null default '',        -- Segen courses the editor finished
  portfolio_link text not null default '',
  about text not null default '',
  status text not null default 'waiting' check (status in ('waiting', 'approved', 'rejected')),
  admin_note text,                              -- shown to the editor, e.g. why not approved
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- True when the signed-in user is an editor Dleat approved.
create function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.editors e where e.user_id = auth.uid() and e.status = 'approved'
  );
$$;

-- ---------------------------------------------------------------------------
-- Jobs, offers, deliveries, corrections, payments
-- ---------------------------------------------------------------------------

create table public.jobs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  title text not null check (length(trim(title)) between 3 and 120),
  description text not null default '',
  budget integer check (budget is null or budget >= 0),
  currency text not null default 'ETB' check (currency in ('ETB', 'USD')),
  deadline date,
  -- open: taking offers · working: editor is editing · review: client is
  -- checking a version · done: client accepted · cancelled
  status text not null default 'open' check (status in ('open', 'working', 'review', 'done', 'cancelled')),
  editor_id uuid references public.editors (user_id),
  price integer check (price is null or price > 0),
  corrections_used integer not null default 0,
  paid_at timestamptz,                          -- client's payment approved by Dleat
  editor_half_paid_at timestamptz,
  editor_rest_paid_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);

create index jobs_client_idx on public.jobs (client_id);
create index jobs_editor_idx on public.jobs (editor_id);
create index jobs_status_idx on public.jobs (status);

-- Raw footage link, kept apart so editors browsing open jobs do not see it.
create table public.job_footage (
  job_id uuid primary key references public.jobs (id) on delete cascade,
  link text not null check (link ~ '^https?://')
);

create table public.job_offers (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  editor_id uuid not null default auth.uid() references public.editors (user_id) on delete cascade,
  price integer not null check (price > 0),
  days integer not null check (days between 1 and 90),
  message text not null default '',
  status text not null default 'sent' check (status in ('sent', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique (job_id, editor_id)
);

create table public.job_deliveries (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  version integer not null,
  preview_youtube_id text not null check (preview_youtube_id ~ '^[A-Za-z0-9_-]{6,20}$'),
  note text not null default '',
  created_at timestamptz not null default now(),
  unique (job_id, version)
);

-- The download link of each version. The client can read it only after
-- Dleat approves the payment.
create table public.delivery_files (
  delivery_id uuid primary key references public.job_deliveries (id) on delete cascade,
  final_link text not null check (final_link ~ '^https?://')
);

create table public.job_corrections (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  round integer not null,
  request text not null,
  created_at timestamptz not null default now()
);

create table public.job_payments (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs (id) on delete cascade,
  client_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  method text not null check (method in ('telebirr', 'bank', 'abroad')),
  receipt_path text,                            -- in the private 'receipts' bucket
  note text not null default '',
  status text not null default 'waiting' check (status in ('waiting', 'approved', 'rejected')),
  reject_reason text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (method = 'abroad' or receipt_path is not null)
);

create index job_payments_status_idx on public.job_payments (status);

-- Helpers for the rules below (security definer so they do not loop
-- through each other's row rules).
create function public.job_party(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1 from public.jobs j
    where j.id = p_job_id and (j.client_id = auth.uid() or j.editor_id = auth.uid())
  );
$$;

create function public.job_client(p_job_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.jobs j where j.id = p_job_id and j.client_id = auth.uid());
$$;

create function public.can_download(p_delivery_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_admin() or exists (
    select 1
    from public.job_deliveries d
    join public.jobs j on j.id = d.job_id
    where d.id = p_delivery_id
      and (j.editor_id = auth.uid() or (j.client_id = auth.uid() and j.paid_at is not null))
  );
$$;

-- ---------------------------------------------------------------------------
-- Access rules
-- ---------------------------------------------------------------------------

alter table public.editors enable row level security;
alter table public.jobs enable row level security;
alter table public.job_footage enable row level security;
alter table public.job_offers enable row level security;
alter table public.job_deliveries enable row level security;
alter table public.delivery_files enable row level security;
alter table public.job_corrections enable row level security;
alter table public.job_payments enable row level security;

grant select on public.editors, public.jobs, public.job_footage, public.job_offers,
  public.job_deliveries, public.delivery_files, public.job_corrections, public.job_payments
  to authenticated;

-- Editors: approved editors are visible to logged-in people (clients see
-- who sent an offer); each editor sees their own application.
create policy "read editors" on public.editors
  for select to authenticated
  using (status = 'approved' or user_id = auth.uid() or public.is_admin());
revoke insert, update, delete on public.editors from anon, authenticated;

-- Jobs: the client and the chosen editor see the job; approved editors see
-- open jobs so they can send offers.
create policy "read jobs" on public.jobs
  for select to authenticated
  using (
    client_id = auth.uid()
    or editor_id = auth.uid()
    or public.is_admin()
    or (status = 'open' and public.is_editor())
  );
create policy "post own job" on public.jobs
  for insert to authenticated
  with check (client_id = auth.uid() and status = 'open');
revoke insert, update, delete on public.jobs from anon, authenticated;
grant insert (title, description, budget, currency, deadline) on public.jobs to authenticated;

create policy "read footage" on public.job_footage
  for select to authenticated using (public.job_party(job_id));
create policy "client adds footage" on public.job_footage
  for insert to authenticated with check (public.job_client(job_id));
create policy "client changes footage" on public.job_footage
  for update to authenticated using (public.job_client(job_id)) with check (public.job_client(job_id));
revoke insert, update, delete on public.job_footage from anon, authenticated;
grant insert (job_id, link), update (link) on public.job_footage to authenticated;

-- Offers: the editor who sent it and the job's client see it.
create policy "read offers" on public.job_offers
  for select to authenticated
  using (editor_id = auth.uid() or public.job_client(job_id) or public.is_admin());
create policy "editor sends offer" on public.job_offers
  for insert to authenticated
  with check (
    editor_id = auth.uid()
    and status = 'sent'
    and public.is_editor()
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.status = 'open' and j.client_id <> auth.uid()
    )
  );
create policy "editor withdraws offer" on public.job_offers
  for delete to authenticated
  using (editor_id = auth.uid() and status = 'sent');
revoke insert, update, delete on public.job_offers from anon, authenticated;
grant insert (job_id, price, days, message) on public.job_offers to authenticated;
grant delete on public.job_offers to authenticated;

create policy "read deliveries" on public.job_deliveries
  for select to authenticated using (public.job_party(job_id));
revoke insert, update, delete on public.job_deliveries from anon, authenticated;

create policy "read download link" on public.delivery_files
  for select to authenticated using (public.can_download(delivery_id));
revoke insert, update, delete on public.delivery_files from anon, authenticated;

create policy "read corrections" on public.job_corrections
  for select to authenticated using (public.job_party(job_id));
revoke insert, update, delete on public.job_corrections from anon, authenticated;

create policy "read own job payments" on public.job_payments
  for select to authenticated using (client_id = auth.uid() or public.is_admin());
create policy "client pays for own job" on public.job_payments
  for insert to authenticated
  with check (
    client_id = auth.uid()
    and status = 'waiting'
    and exists (
      select 1 from public.jobs j
      where j.id = job_id and j.client_id = auth.uid()
        and j.status in ('working', 'review') and j.paid_at is null
    )
  );
revoke insert, update, delete on public.job_payments from anon, authenticated;
grant insert (job_id, method, receipt_path, note) on public.job_payments to authenticated;

-- ---------------------------------------------------------------------------
-- Actions
-- ---------------------------------------------------------------------------

-- Apply (or apply again) to work as an editor. Dleat then tests and approves.
create function public.apply_as_editor(
  p_display_name text, p_courses_done text, p_portfolio_link text, p_about text
)
returns public.editors
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.editors;
begin
  if auth.uid() is null then
    raise exception 'Please log in first';
  end if;
  insert into public.editors (user_id, display_name, courses_done, portfolio_link, about)
  values (auth.uid(), trim(p_display_name), trim(p_courses_done), trim(p_portfolio_link), trim(p_about))
  on conflict (user_id) do update
    set display_name = excluded.display_name,
        courses_done = excluded.courses_done,
        portfolio_link = excluded.portfolio_link,
        about = excluded.about,
        -- an approved editor stays approved when updating their details
        status = case when public.editors.status = 'approved' then 'approved' else 'waiting' end
  returning * into result;
  return result;
end;
$$;

-- Dleat approves or turns down an editor.
create function public.review_editor(p_user_id uuid, p_approve boolean, p_note text)
returns public.editors
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.editors;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can review editors';
  end if;
  update public.editors
  set status = case when p_approve then 'approved' else 'rejected' end,
      admin_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewed_at = now()
  where user_id = p_user_id
  returning * into result;
  if result.user_id is null then
    raise exception 'Editor not found';
  end if;
  return result;
end;
$$;

-- The client picks an offer. The job's price becomes the offer's price.
create function public.accept_offer(p_offer_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  o public.job_offers;
  result public.jobs;
begin
  select * into o from public.job_offers where id = p_offer_id;
  if o.id is null then
    raise exception 'Offer not found';
  end if;

  update public.jobs
  set status = 'working', editor_id = o.editor_id, price = o.price
  where id = o.job_id and client_id = auth.uid() and status = 'open'
  returning * into result;
  if result.id is null then
    raise exception 'This job is not open for offers';
  end if;

  update public.job_offers
  set status = case when id = o.id then 'accepted' else 'declined' end
  where job_id = o.job_id;
  return result;
end;
$$;

create function public.cancel_job(p_job_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.jobs;
begin
  update public.jobs
  set status = 'cancelled'
  where id = p_job_id and status = 'open' and (client_id = auth.uid() or public.is_admin())
  returning * into result;
  if result.id is null then
    raise exception 'Only an open job can be cancelled. Contact Dleat.';
  end if;
  return result;
end;
$$;

-- The editor sends a version: a watermarked preview and the finished file.
create function public.submit_delivery(p_job_id uuid, p_youtube_id text, p_final_link text, p_note text)
returns public.job_deliveries
language plpgsql
security definer
set search_path = ''
as $$
declare
  j public.jobs;
  result public.job_deliveries;
begin
  select * into j from public.jobs where id = p_job_id for update;
  if j.id is null or j.editor_id is distinct from auth.uid() then
    raise exception 'This is not your job';
  end if;
  if j.status <> 'working' then
    raise exception 'The client is checking your last version. Wait for their answer.';
  end if;

  insert into public.job_deliveries (job_id, version, preview_youtube_id, note)
  values (
    j.id,
    coalesce((select max(version) from public.job_deliveries where job_id = j.id), 0) + 1,
    p_youtube_id,
    trim(coalesce(p_note, ''))
  )
  returning * into result;
  insert into public.delivery_files (delivery_id, final_link) values (result.id, trim(p_final_link));

  update public.jobs set status = 'review' where id = j.id;
  return result;
end;
$$;

-- The client asks for changes. 3 rounds are free.
create function public.request_correction(p_job_id uuid, p_request text)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  j public.jobs;
begin
  select * into j from public.jobs where id = p_job_id for update;
  if j.id is null or j.client_id <> auth.uid() then
    raise exception 'This is not your job';
  end if;
  if j.status <> 'review' then
    raise exception 'There is no new version to correct yet';
  end if;
  if j.corrections_used >= 3 then
    raise exception 'All 3 free corrections are used. Contact Dleat to ask for more.';
  end if;
  if length(trim(coalesce(p_request, ''))) < 3 then
    raise exception 'Please write what should change';
  end if;

  insert into public.job_corrections (job_id, round, request)
  values (j.id, j.corrections_used + 1, trim(p_request));

  update public.jobs
  set status = 'working', corrections_used = corrections_used + 1
  where id = j.id
  returning * into j;
  return j;
end;
$$;

-- The client is happy with the work. Only after paying.
create function public.finish_job(p_job_id uuid)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.jobs;
begin
  update public.jobs
  set status = 'done', done_at = now()
  where id = p_job_id and client_id = auth.uid() and status = 'review' and paid_at is not null
  returning * into result;
  if result.id is null then
    raise exception 'The job can be finished after your payment is approved';
  end if;
  return result;
end;
$$;

create function public.review_job_payment(p_payment_id uuid, p_approve boolean, p_reason text)
returns public.job_payments
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.job_payments;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can review payments';
  end if;
  update public.job_payments
  set status = case when p_approve then 'approved' else 'rejected' end,
      reject_reason = case when p_approve then null
                           else coalesce(nullif(trim(p_reason), ''), 'Payment could not be confirmed') end,
      reviewed_at = now()
  where id = p_payment_id and status = 'waiting'
  returning * into result;
  if result.id is null then
    raise exception 'Payment not found or already reviewed';
  end if;
  if p_approve then
    update public.jobs set paid_at = coalesce(paid_at, now()) where id = result.job_id;
  end if;
  return result;
end;
$$;

-- Dleat records that the editor was paid: 'half' after the client paid,
-- 'rest' after the client accepted the work.
create function public.mark_editor_paid(p_job_id uuid, p_part text)
returns public.jobs
language plpgsql
security definer
set search_path = ''
as $$
declare
  result public.jobs;
begin
  if not public.is_admin() then
    raise exception 'Only an admin can record payouts';
  end if;
  if p_part = 'half' then
    update public.jobs set editor_half_paid_at = now()
    where id = p_job_id and paid_at is not null and editor_half_paid_at is null
    returning * into result;
  elsif p_part = 'rest' then
    update public.jobs set editor_rest_paid_at = now()
    where id = p_job_id and status = 'done' and editor_rest_paid_at is null
    returning * into result;
  else
    raise exception 'Unknown payout';
  end if;
  if result.id is null then
    raise exception 'This payout is not due yet or was already recorded';
  end if;
  return result;
end;
$$;

do $$
declare
  f text;
begin
  foreach f in array array[
    'public.is_editor()',
    'public.job_party(uuid)',
    'public.job_client(uuid)',
    'public.can_download(uuid)',
    'public.apply_as_editor(text, text, text, text)',
    'public.review_editor(uuid, boolean, text)',
    'public.accept_offer(uuid)',
    'public.cancel_job(uuid)',
    'public.submit_delivery(uuid, text, text, text)',
    'public.request_correction(uuid, text)',
    'public.finish_job(uuid)',
    'public.review_job_payment(uuid, boolean, text)',
    'public.mark_editor_paid(uuid, text)'
  ] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end;
$$;
