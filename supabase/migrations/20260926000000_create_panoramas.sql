-- Sección "Panoramas": ideas de salidas/planes de la pareja y sus rutas.
create table if not exists public.panoramas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'otro',
  plan_date date,
  place text,
  notes text,
  person text not null,
  status text not null default 'pendiente' check (status in ('pendiente', 'hecho')),
  done_at timestamptz,
  created_at timestamptz not null default now()
);

-- Paradas de la ruta de un panorama (opcional), en orden.
create table if not exists public.panorama_stops (
  id uuid primary key default gen_random_uuid(),
  panorama_id uuid not null references public.panoramas(id) on delete cascade,
  position int not null,
  name text not null,
  description text,
  planned_time text,
  duration_min int,
  lat double precision,
  lng double precision,
  done boolean not null default false,
  done_at timestamptz,
  done_by text,
  created_at timestamptz not null default now()
);

create index if not exists panorama_stops_panorama_idx on public.panorama_stops (panorama_id, position);

alter table public.panoramas enable row level security;
alter table public.panorama_stops enable row level security;

-- Mismo esquema que el resto de tablas: la app usa la anon key detrás de la contraseña de la app.
create policy "public read panoramas" on public.panoramas for select using (true);
create policy "public insert panoramas" on public.panoramas for insert with check (true);
create policy "public update panoramas" on public.panoramas for update using (true) with check (true);
create policy "public delete panoramas" on public.panoramas for delete using (true);

create policy "public read panorama stops" on public.panorama_stops for select using (true);
create policy "public insert panorama stops" on public.panorama_stops for insert with check (true);
create policy "public update panorama stops" on public.panorama_stops for update using (true) with check (true);
create policy "public delete panorama stops" on public.panorama_stops for delete using (true);
