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
  faal_sub_status text check (faal_sub_status in ('bakimsiz', 'bakiliyor', 'hazir', 'yolda')),
  notes text default '',
  train boolean not null default false,
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

-- MEVCUT VERİTABANI İÇİN: Yolda Faal alt durumunu ekle
ALTER TABLE locomotives DROP CONSTRAINT IF EXISTS locomotives_faal_sub_status_check;
ALTER TABLE locomotives ADD CONSTRAINT locomotives_faal_sub_status_check CHECK (faal_sub_status IN ('bakimsiz', 'bakiliyor', 'hazir', 'yolda'));

-- MEVCUT VERİTABANI İÇİN: Tren toggle alanını ekle
ALTER TABLE locomotives ADD COLUMN IF NOT EXISTS train boolean NOT NULL DEFAULT false;

-- BAĞIMSIZ NOT TARİHÇESİ TABLOSU
CREATE TABLE IF NOT EXISTS locomotive_note_history (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  locomotive_name varchar(5) NOT NULL CHECK (locomotive_name ~ '^[0-9]{5}$'),
  note_text varchar(350) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS locomotive_note_history_created_at_idx
  ON locomotive_note_history (created_at DESC);

CREATE INDEX IF NOT EXISTS locomotive_note_history_name_created_idx
  ON locomotive_note_history (locomotive_name, created_at DESC);

-- TREN GİDİŞ KAYITLARI (lokomotif tablosundan bağımsız)
CREATE TABLE IF NOT EXISTS public.locomotive_train_departures (
  locomotive_name varchar(5) NOT NULL CHECK (locomotive_name ~ '^[0-9]{5}$'),
  locomotive_created_at timestamptz,
  departed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (locomotive_name, departed_at)
);

-- MEVCUT TREN GİDİŞ TABLOSU İÇİN: Lokomotifin ilk eklenme tarihini ekle
ALTER TABLE public.locomotive_train_departures
  ADD COLUMN IF NOT EXISTS locomotive_created_at timestamptz;

CREATE INDEX IF NOT EXISTS locomotive_train_departures_departed_at_idx
  ON public.locomotive_train_departures (departed_at DESC);

-- Onaylı depodan gitmiş işlemini atomik yap: notu koru, tren kaydını ekle, lokomotifi sil.
CREATE OR REPLACE FUNCTION public.record_locomotive_train_departure(p_locomotive_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  loco public.locomotives%ROWTYPE;
BEGIN
  SELECT * INTO loco
  FROM public.locomotives
  WHERE id = p_locomotive_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Locomotive not found';
  END IF;

  IF loco.name !~ '^[0-9]{5}$' THEN
    RAISE EXCEPTION 'Locomotive name must contain exactly five digits';
  END IF;

  IF NULLIF(btrim(loco.notes), '') IS NOT NULL THEN
    INSERT INTO public.locomotive_note_history (locomotive_name, note_text)
    VALUES (loco.name, btrim(loco.notes));
  END IF;

  INSERT INTO public.locomotive_train_departures (locomotive_name, locomotive_created_at)
  VALUES (loco.name, loco.created_at);

  DELETE FROM public.locomotives WHERE id = p_locomotive_id;
END;
$$;

-- ESKİ KAYITLARDAKİ NOTLARI AKTAR
-- Eski Kayıtlar sekmesinde gösterilen aktif lokomotiflerden yalnızca notu dolu olanları aktarır.
-- updated_at, arşiv kaydı için tarih olarak kullanılır. Sorgu tekrar çalıştırılırsa aynı kayıt eklenmez.
INSERT INTO locomotive_note_history (locomotive_name, note_text, created_at)
SELECT locomotives.name, btrim(locomotives.notes), locomotives.updated_at
FROM locomotives
WHERE locomotives.is_active IS TRUE
  AND locomotives.gone IS TRUE
  AND NULLIF(btrim(locomotives.notes), '') IS NOT NULL
  AND char_length(btrim(locomotives.notes)) <= 350
  AND locomotives.name ~ '^[0-9]{5}$'
  AND NOT EXISTS (
    SELECT 1
    FROM locomotive_note_history AS note_history
    WHERE note_history.locomotive_name = locomotives.name
      AND note_history.note_text = btrim(locomotives.notes)
      AND note_history.created_at = locomotives.updated_at
  );

-- ESKİ JSONB TARİHÇESİ KULLANILDIYSA: Aşağıdaki aktarımı bir kez çalıştırın.
INSERT INTO locomotive_note_history (locomotive_name, note_text, created_at)
SELECT locomotives.name, history_entries.entry->>'text', (history_entries.entry->>'timestamp')::timestamptz
FROM locomotives
CROSS JOIN LATERAL jsonb_array_elements(COALESCE(locomotives.history, '[]'::jsonb)) AS history_entries(entry)
WHERE COALESCE(history_entries.entry->>'text', '') <> '';

-- AKTARIM DOĞRULANDIKTAN SONRA GONE LOKOMOTİFLERİ VE ESKİ JSONB ALANINI KALDIR
-- Önce yukarıdaki gone notları ve varsa JSONB tarihçesi aktarımlarını çalıştırıp sonuçları doğrulayın.
BEGIN;

DELETE FROM public.locomotives
WHERE gone IS TRUE
RETURNING id, name;

ALTER TABLE public.locomotives DROP COLUMN IF EXISTS history;

COMMIT;