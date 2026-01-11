-- ÖNCE MEVCUT YAPILARI SİL (Tekrar çalıştırma için)
DROP TRIGGER IF EXISTS enforce_status_constraints ON locomotives;
DROP TRIGGER IF EXISTS update_locomotives_timestamp ON locomotives;
DROP FUNCTION IF EXISTS check_status_constraints();
DROP FUNCTION IF EXISTS update_timestamp();
DROP TABLE IF EXISTS locomotives CASCADE;

-- LOKOMOTİFLER TABLOSU
create table locomotives (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('faal', 'cari_tamir', 'bakimda', 'gayri_faal')),
  kb_type text check (kb_type in ('kb1', 'kb2', 'kb3', 's1', 's2', 's3')),
  faal_sub_status text check (faal_sub_status in ('bakimsiz', 'bakiliyor', 'hazir')),
  notes text default '',
  is_active boolean not null default true,
  gone boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- kb_type sadece status='bakimda' olduğunda dolu olmalı
-- faal_sub_status sadece status='faal' olduğunda dolu olmalı
-- constraint ekleyelim (opsiyonel ama önerilen)
create or replace function check_status_constraints()
returns trigger as $$
begin
  -- KB Type kontrolü
  if new.status = 'bakimda' and new.kb_type is null then
    raise exception 'kb_type must be set when status is bakimda';
  end if;
  if new.status != 'bakimda' and new.kb_type is not null then
    new.kb_type := null;
  end if;
  
  -- Faal Sub Status kontrolü
  if new.status = 'faal' and new.faal_sub_status is null then
    raise exception 'faal_sub_status must be set when status is faal';
  end if;
  if new.status != 'faal' and new.faal_sub_status is not null then
    new.faal_sub_status := null;
  end if;
  
  return new;
end;
$$ language plpgsql;

create trigger enforce_status_constraints
before insert or update on locomotives
for each row
execute procedure check_status_constraints();

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

-- MEVCUT VERİTABANI İÇİN: kb_type constraint'ini güncelle (s1, s2, s3 ekle)
-- Eğer tablo zaten varsa, bu komutları çalıştır:
ALTER TABLE locomotives DROP CONSTRAINT IF EXISTS locomotives_kb_type_check;
ALTER TABLE locomotives ADD CONSTRAINT locomotives_kb_type_check CHECK (kb_type IN ('kb1', 'kb2', 'kb3', 's1', 's2', 's3'));