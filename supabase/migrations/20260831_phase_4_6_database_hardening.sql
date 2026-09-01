-- Applies the post-deployment hardening required for the Phase 4.6 schema.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists runs_brand_id_idx on public.runs(brand_id);
create index if not exists runs_thread_id_idx on public.runs(thread_id);
create index if not exists messages_agent_id_idx on public.messages(agent_id);
create index if not exists messages_run_id_idx on public.messages(run_id);
create index if not exists threads_agent_id_idx on public.threads(agent_id);
create index if not exists threads_brand_id_idx on public.threads(brand_id);
create index if not exists sync_log_target_id_idx on public.sync_log(target_id);
create index if not exists workflow_canvases_run_id_idx on public.workflow_canvases(run_id);

-- The app is server-only and single-user for this phase. Explicitly deny
-- browser roles and reserve these tables for the server's service role.
revoke all on table public.brands, public.threads, public.runs, public.messages,
  public.asset_bundles, public.sync_targets, public.sync_log from anon, authenticated;
grant select, insert, update, delete on table public.brands, public.threads,
  public.runs, public.messages, public.asset_bundles, public.sync_targets,
  public.sync_log to service_role;

create policy "service role manages brands" on public.brands for all to service_role using (true) with check (true);
create policy "service role manages threads" on public.threads for all to service_role using (true) with check (true);
create policy "service role manages runs" on public.runs for all to service_role using (true) with check (true);
create policy "service role manages messages" on public.messages for all to service_role using (true) with check (true);
create policy "service role manages asset bundles" on public.asset_bundles for all to service_role using (true) with check (true);
create policy "service role manages sync targets" on public.sync_targets for all to service_role using (true) with check (true);
create policy "service role manages sync log" on public.sync_log for all to service_role using (true) with check (true);
