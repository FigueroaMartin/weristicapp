-- Tabla para la sección "Panoramas": ideas de salidas/planes de la pareja.
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

alter table public.panoramas enable row level security;

-- La app usa la anon key (protegida por la contraseña de la app), igual que el resto de tablas.
create policy "panoramas_anon_all" on public.panoramas
  for all to anon, authenticated
  using (true) with check (true);
