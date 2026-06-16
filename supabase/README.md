# Base de datos · Clofi + Store

Clofi comparte la base de datos del proyecto **store** (`wghbzpdtywcjahjfvshe`).
El esquema completo está documentado en [`db.sql`](../db.sql) en la raíz del repo.

## Cómo Clofi usa el esquema existente

| Funcionalidad Clofi | Tabla / campo en la DB |
| ------------------- | ---------------------- |
| Multi-tenant        | `public.organizations` |
| Configuración       | `public.organization_settings` |
| Empleados           | `organization_settings.settings.clofi.employees` (JSONB) |
| Asistencia          | `organization_settings.settings.clofi.attendance` (JSONB) |
| Moneda (nómina Clofi) | Siempre **USD** (`CLOFI_PAYROLL_CURRENCY`) |

No se crean tablas nuevas: los datos de asistencia viven en el JSONB `settings`
de la organización, siguiendo el patrón del store (config flexible en
`organization_settings`).

## Configuración requerida

En `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://wghbzpdtywcjahjfvshe.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
CLOFI_ORGANIZATION_ID=<uuid-de-tu-organización>
```

Obtén el UUID en Supabase → Table Editor → `organizations`.

## Referencia del esquema

Ver [`db.sql`](../db.sql) para tablas de POS: productos, ventas, inventario,
clientes, proveedores, roles, etc.
