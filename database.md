-- LOKOMOTİFLER TABLOSU
create table if not exists locomotives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('faal', 'cari_tamir', 'bakimda', 'gayri_faal')),
  kb_type text check (kb_type in ('kb1', 'kb2', 'kb3')),
  notes text default '',
  is_active boolean not null default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- kb_type sadece status='bakimda' olduğunda dolu olmalı
-- constraint ekleyelim (opsiyonel ama önerilen)
create or replace function check_kb_type_constraint()
returns trigger as $$
begin
  if new.status = 'bakimda' and new.kb_type is null then
    raise exception 'kb_type must be set when status is bakimda';
  end if;
  if new.status != 'bakimda' and new.kb_type is not null then
    new.kb_type := null;
  end if;
  return new;
end;
$$ language plpgsql;

create trigger enforce_kb_type
before insert or update on locomotives
for each row
execute procedure check_kb_type_constraint();

-- Otomatik updated_at güncellemesi için trigger
create or replace function update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_locomotives_timestamp
before update on locomotives
for each row
execute procedure update_timestamp();