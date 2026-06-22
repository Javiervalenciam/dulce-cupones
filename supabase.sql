-- Ejecuta esto en Supabase > SQL Editor > New query > Run

create table if not exists cupones (
  id bigint generated always as identity primary key,
  codigo text unique not null,
  prefijo text not null default 'DULCE',
  promocion text,
  descripcion text,
  estado text not null default 'DISPONIBLE',
  nombre_cliente text,
  telefono_cliente text,
  detalle_entregado text,
  vence_en date,
  escaneado_en timestamptz,
  redimido_en timestamptz,
  eliminado_en timestamptz,
  creado_en timestamptz not null default now()
);

create index if not exists idx_cupones_codigo on cupones(codigo);
create index if not exists idx_cupones_estado on cupones(estado);
create index if not exists idx_cupones_prefijo on cupones(prefijo);

-- Estados: DISPONIBLE -> RECLAMADO -> REDIMIDO. Tambien: ANULADO, ELIMINADO.
-- Importante: deja la tabla SIN politicas publicas (RLS). La app solo accede
-- desde el servidor con la llave service_role, nunca desde el navegador.
