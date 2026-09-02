-- Phase 6 runtime durability and service-role-only access.
alter table public.runs_lanes add column if not exists thread_id uuid references public.threads(id);
alter table public.runs_lanes add column if not exists request text;
alter table public.runs_lanes add column if not exists source_message_id uuid references public.agent_messages(id);
alter table public.runs_lanes add column if not exists worker_id text;
alter table public.runs_lanes add column if not exists error text;
alter table public.agent_messages add column if not exists priority_reason text;

create index if not exists runs_lanes_claim_idx on public.runs_lanes(lane, status, created_at);
create index if not exists runs_lanes_run_idx on public.runs_lanes(run_id, status);
create unique index if not exists runs_lanes_source_message_once_idx on public.runs_lanes(source_message_id) where source_message_id is not null;
create index if not exists approval_requests_pending_idx on public.approval_requests(run_id, resolved_at, expires_at);
create index if not exists agent_messages_recipient_status_idx on public.agent_messages(to_agent_id, status, created_at);

alter table public.memory_facts enable row level security;
alter table public.agent_messages enable row level security;
alter table public.runs_lanes enable row level security;
alter table public.approval_requests enable row level security;
alter table public.audit_log enable row level security;
alter table public.learning_proposals enable row level security;

revoke all on table public.memory_facts, public.agent_messages, public.runs_lanes,
  public.approval_requests, public.audit_log, public.learning_proposals from anon, authenticated;
grant select, insert, update, delete on table public.memory_facts, public.agent_messages,
  public.runs_lanes, public.approval_requests, public.audit_log, public.learning_proposals to service_role;

drop policy if exists "single_user_runtime_memory" on public.memory_facts;
drop policy if exists "single_user_runtime_messages" on public.agent_messages;
drop policy if exists "single_user_runtime_lanes" on public.runs_lanes;
drop policy if exists "single_user_runtime_approvals" on public.approval_requests;
drop policy if exists "single_user_runtime_audit" on public.audit_log;
drop policy if exists "single_user_runtime_learning" on public.learning_proposals;
create policy "service role manages runtime memory" on public.memory_facts for all to service_role using (true) with check (true);
create policy "service role manages runtime messages" on public.agent_messages for all to service_role using (true) with check (true);
create policy "service role manages runtime lanes" on public.runs_lanes for all to service_role using (true) with check (true);
create policy "service role manages runtime approvals" on public.approval_requests for all to service_role using (true) with check (true);
create policy "service role manages runtime audit" on public.audit_log for all to service_role using (true) with check (true);
create policy "service role manages runtime learning" on public.learning_proposals for all to service_role using (true) with check (true);
