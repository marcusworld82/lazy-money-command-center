-- Phase 4.6: MARCO shell inversion and the universal Run object.
-- The web app accesses this single-user database through the server-only
-- service-role client; RLS is still enabled on every application table.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin new.updated_at = now(); return new; end;
$$;

create table if not exists brands (
  id uuid primary key default gen_random_uuid(), name text not null,
  slug text unique not null, kind text, colors jsonb, typography text,
  voice jsonb, audience text, offers text, restrictions text,
  is_active boolean default false, created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists threads (
  id uuid primary key default gen_random_uuid(), agent_id uuid references agents(id),
  brand_id uuid references brands(id), title text, last_message_preview text,
  unread boolean default false, updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table if not exists runs (
  id uuid primary key default gen_random_uuid(), short_id text unique not null,
  agent_id uuid references agents(id), brand_id uuid references brands(id),
  thread_id uuid references threads(id), title text, inputs jsonb not null default '{}'::jsonb,
  asset_manifest jsonb not null default '[]'::jsonb, steps jsonb not null default '[]'::jsonb,
  outputs jsonb not null default '[]'::jsonb, status text not null default 'draft',
  approval_state text, cost numeric(10,4) default 0, created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(), thread_id uuid references threads(id) on delete cascade,
  run_id uuid references runs(id), role text not null, agent_id uuid references agents(id),
  kind text not null default 'text', body text, payload jsonb, created_at timestamptz default now()
);

create table if not exists asset_bundles (
  id uuid primary key default gen_random_uuid(), name text not null, brand_id uuid references brands(id),
  manifest jsonb not null default '[]'::jsonb, created_at timestamptz default now(), updated_at timestamptz default now()
);

create table if not exists sync_targets (
  id uuid primary key default gen_random_uuid(), kind text not null, repo_url text, branch text default 'main',
  vault_subpath text default '', direction text default 'outbound', last_sync_at timestamptz,
  status text default 'idle', last_error text, created_at timestamptz default now()
);

create table if not exists sync_log (
  id uuid primary key default gen_random_uuid(), target_id uuid references sync_targets(id), direction text,
  table_name text, record_id uuid, file_path text, action text, created_at timestamptz default now()
);

alter table agents add column if not exists slug text;
alter table agents add column if not exists tagline text;
alter table agents add column if not exists instructions text;
alter table agents add column if not exists avatar_color text default '#AD0000';
alter table agents add column if not exists surfaces text[] default '{chat}';
alter table agents add column if not exists model_reasoning text;
alter table agents add column if not exists model_fast text;
alter table agents add column if not exists model_render text;
alter table agents add column if not exists permissions jsonb default '{}'::jsonb;
alter table agents add column if not exists can_handoff_to uuid[];
alter table agents add column if not exists sort_order integer default 0;
alter table agents alter column status set default 'paused';

alter table workflow_canvases add column if not exists run_id uuid references runs(id);
alter table workflow_canvases add column if not exists is_template boolean default false;
alter table workflow_canvases add column if not exists groups jsonb default '[]'::jsonb;

create index if not exists runs_agent_id_idx on runs(agent_id);
create index if not exists runs_brand_id_idx on runs(brand_id);
create index if not exists runs_thread_id_idx on runs(thread_id);
create index if not exists runs_status_idx on runs(status);
create index if not exists messages_thread_created_idx on messages(thread_id, created_at);
create index if not exists messages_agent_id_idx on messages(agent_id);
create index if not exists messages_run_id_idx on messages(run_id);
create index if not exists threads_updated_at_idx on threads(updated_at desc);
create index if not exists threads_agent_id_idx on threads(agent_id);
create index if not exists threads_brand_id_idx on threads(brand_id);
create index if not exists sync_log_target_id_idx on sync_log(target_id);
create index if not exists workflow_canvases_run_id_idx on workflow_canvases(run_id);

drop trigger if exists runs_set_updated_at on runs;
create trigger runs_set_updated_at before update on runs for each row execute function public.set_updated_at();
drop trigger if exists threads_set_updated_at on threads;
create trigger threads_set_updated_at before update on threads for each row execute function public.set_updated_at();
drop trigger if exists brands_set_updated_at on brands;
create trigger brands_set_updated_at before update on brands for each row execute function public.set_updated_at();
drop trigger if exists asset_bundles_set_updated_at on asset_bundles;
create trigger asset_bundles_set_updated_at before update on asset_bundles for each row execute function public.set_updated_at();

alter table brands enable row level security;
alter table threads enable row level security;
alter table runs enable row level security;
alter table messages enable row level security;
alter table asset_bundles enable row level security;
alter table sync_targets enable row level security;
alter table sync_log enable row level security;

insert into agents (slug, name, tagline, avatar_color, surfaces, status, permissions, sort_order)
select v.slug, v.name, v.tagline, v.color, v.surfaces, 'paused',
  '{"generate":"ask","publish":"never","write_knowledge":"ask","use_cli":"never","mcp_write":"ask","budget_cap_per_run":5}'::jsonb, v.sort_order
from (values
 ('chief','Chief','routes work, reports back','#7FD1B9',array['chat'],1),
 ('atelier','Atelier','apparel design and product','#AD0000',array['chat','build'],2),
 ('voice','Voice','every word that ships','#E8C468',array['chat','build'],3),
 ('studio','Studio','images and video','#FF3D8A',array['chat','build'],4),
 ('social','Social','scheduling, platforms, automations','#6FA8FF',array['chat','build'],5),
 ('builder','Builder','planner plus executor for code','#9B8CFF',array['chat','build'],6)
) as v(slug,name,tagline,color,surfaces,sort_order)
where not exists (select 1 from agents a where a.slug = v.slug);

insert into threads (agent_id, title)
select a.id, a.name || ' thread'
from agents a
where a.slug in ('chief','atelier','voice','studio','social','builder')
  and not exists (select 1 from threads t where t.agent_id = a.id);
