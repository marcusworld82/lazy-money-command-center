-- Phase 5: provider-backed generation, bundle metadata, and truthful spend.

create table if not exists settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists generation_jobs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references runs(id) on delete cascade,
  agent_id uuid references agents(id),
  provider text not null check (provider in ('fal')),
  model_name text not null,
  fal_request_id text,
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  prompt text,
  manifest jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb,
  cost numeric(10,4),
  error text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table assets add column if not exists extracted_text text;
alter table assets add column if not exists extracted_at timestamptz;
alter table assets add column if not exists default_role text;
alter table assets add column if not exists run_id uuid references runs(id);
alter table assets add column if not exists brand_id uuid references brands(id);
alter table assets add column if not exists is_generated boolean not null default false;

alter table model_usage_log add column if not exists run_id uuid references runs(id);
alter table model_usage_log add column if not exists agent_id uuid references agents(id);
alter table model_usage_log add column if not exists status text not null default 'ok' check (status in ('ok', 'failed'));
alter table model_usage_log add column if not exists error text;
alter table model_usage_log add column if not exists latency_ms integer;

create index if not exists generation_jobs_run_id_idx on generation_jobs(run_id);
create index if not exists generation_jobs_status_idx on generation_jobs(status);
create index if not exists assets_run_id_idx on assets(run_id);
create index if not exists assets_brand_id_idx on assets(brand_id);
create index if not exists idx_usage_created on model_usage_log(created_at desc);
create index if not exists idx_usage_agent on model_usage_log(agent_id);
create index if not exists idx_usage_run on model_usage_log(run_id);

drop trigger if exists settings_set_updated_at on settings;
create trigger settings_set_updated_at before update on settings for each row execute function public.set_updated_at();

alter table settings enable row level security;
alter table generation_jobs enable row level security;

revoke all on table settings, generation_jobs from anon, authenticated;
grant all on table settings, generation_jobs to service_role;

drop policy if exists "service role manages settings" on settings;
create policy "service role manages settings" on settings for all to service_role using (true) with check (true);
drop policy if exists "service role manages generation jobs" on generation_jobs;
create policy "service role manages generation jobs" on generation_jobs for all to service_role using (true) with check (true);

insert into settings (key, value)
values
  ('generation_defaults', '{"model_reasoning":null,"model_fast":null,"model_render":null}'::jsonb),
  ('generation_budget', '{"monthly_cap":null,"hard_stop":false}'::jsonb)
on conflict (key) do nothing;
