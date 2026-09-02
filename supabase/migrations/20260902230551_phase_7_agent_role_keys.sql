alter table public.agents add column if not exists role_key text not null default 'custom'
  check (role_key in ('chief','atelier','voice','studio','social','builder','custom'));

update public.agents set role_key = case slug
  when 'chief' then 'chief'
  when 'atelier' then 'atelier'
  when 'voice' then 'voice'
  when 'studio' then 'studio'
  when 'social' then 'social'
  when 'builder' then 'builder'
  else role_key
end;
