-- Canvas is retired as a MARCO Run surface. This is a data-only migration.
update public.agents
set surfaces = array_remove(surfaces, 'canvas')
where 'canvas' = any(surfaces);
