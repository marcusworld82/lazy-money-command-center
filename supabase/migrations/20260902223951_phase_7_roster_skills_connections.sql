create table if not exists public.build_runs (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.runs(id) on delete cascade,
  repo text not null,
  branch text,
  pr_url text,
  plan jsonb,
  plan_approved_at timestamptz,
  review_rounds integer not null default 0 check (review_rounds between 0 and 3),
  status text not null default 'planning' check (status in ('planning','awaiting_approval','executing','reviewing','escalated','done','failed')),
  created_at timestamptz not null default now()
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  source text not null check (source in ('claude_code','perplexity','markdown','built_here','zip')),
  source_path text,
  instruction text not null,
  triggers text[] not null default '{}',
  files jsonb not null default '[]'::jsonb,
  status text not null default 'draft' check (status in ('draft','installed','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.agent_skills (
  agent_id uuid not null references public.agents(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  enabled boolean not null default true,
  primary key (agent_id, skill_id)
);

create table if not exists public.skill_activations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.runs(id) on delete cascade,
  agent_id uuid not null references public.agents(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  matched_trigger text,
  created_at timestamptz not null default now()
);

create table if not exists public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null,
  transport text not null default 'http' check (transport in ('http','stdio')),
  auth_ref text,
  status text not null default 'disconnected' check (status in ('disconnected','connecting','connected','failed')),
  tools jsonb not null default '[]'::jsonb,
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.agent_mcp_grants (
  agent_id uuid not null references public.agents(id) on delete cascade,
  server_id uuid not null references public.mcp_servers(id) on delete cascade,
  can_read boolean not null default true,
  can_write boolean not null default false,
  primary key (agent_id, server_id)
);

create table if not exists public.cli_runners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null,
  config jsonb not null default '{}'::jsonb,
  status text not null default 'disconnected' check (status in ('disconnected','connected','failed')),
  enabled boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.cli_command_log (
  id uuid primary key default gen_random_uuid(),
  runner_id uuid not null references public.cli_runners(id) on delete restrict,
  agent_id uuid not null references public.agents(id) on delete restrict,
  run_id uuid references public.runs(id) on delete set null,
  command text not null,
  exit_code integer,
  status text not null default 'queued' check (status in ('queued','running','completed','failed','blocked')),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists build_runs_run_idx on public.build_runs(run_id, status);
create index if not exists agent_skills_agent_idx on public.agent_skills(agent_id, enabled);
create index if not exists skill_activations_run_idx on public.skill_activations(run_id, agent_id);
create index if not exists agent_mcp_grants_agent_idx on public.agent_mcp_grants(agent_id, server_id);
create index if not exists cli_command_log_run_idx on public.cli_command_log(run_id, agent_id, created_at desc);

alter table public.build_runs enable row level security;
alter table public.skills enable row level security;
alter table public.agent_skills enable row level security;
alter table public.skill_activations enable row level security;
alter table public.mcp_servers enable row level security;
alter table public.agent_mcp_grants enable row level security;
alter table public.cli_runners enable row level security;
alter table public.cli_command_log enable row level security;

revoke all on table public.build_runs, public.skills, public.agent_skills, public.skill_activations,
  public.mcp_servers, public.agent_mcp_grants, public.cli_runners, public.cli_command_log from anon, authenticated;
grant select, insert, update, delete on table public.build_runs, public.skills, public.agent_skills, public.skill_activations,
  public.mcp_servers, public.agent_mcp_grants, public.cli_runners, public.cli_command_log to service_role;

create policy "service role manages build runs" on public.build_runs for all to service_role using (true) with check (true);
create policy "service role manages skills" on public.skills for all to service_role using (true) with check (true);
create policy "service role manages agent skills" on public.agent_skills for all to service_role using (true) with check (true);
create policy "service role manages skill activations" on public.skill_activations for all to service_role using (true) with check (true);
create policy "service role manages mcp servers" on public.mcp_servers for all to service_role using (true) with check (true);
create policy "service role manages mcp grants" on public.agent_mcp_grants for all to service_role using (true) with check (true);
create policy "service role manages cli runners" on public.cli_runners for all to service_role using (true) with check (true);
create policy "service role manages cli command logs" on public.cli_command_log for all to service_role using (true) with check (true);
