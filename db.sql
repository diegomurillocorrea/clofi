-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.organizations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  timezone text NOT NULL DEFAULT 'America/Mexico_City'::text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organizations_pkey PRIMARY KEY (id)
);
CREATE TABLE public.organization_settings (
  organization_id uuid NOT NULL,
  currency_code text NOT NULL DEFAULT 'MXN'::text,
  tax_label text NOT NULL DEFAULT 'IVA'::text,
  default_tax_rate numeric NOT NULL DEFAULT 0.16,
  allow_negative_stock boolean NOT NULL DEFAULT false,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  logo_url text,
  primary_color text NOT NULL DEFAULT '#27272a'::text,
  accent_color text NOT NULL DEFAULT '#2563eb'::text,
  primary_color_light text NOT NULL DEFAULT '#27272a'::text,
  primary_color_dark text NOT NULL DEFAULT '#e4e4e7'::text,
  accent_color_light text NOT NULL DEFAULT '#2563eb'::text,
  accent_color_dark text NOT NULL DEFAULT '#60a5fa'::text,
  muted_color_light text NOT NULL DEFAULT '#71717a'::text,
  muted_color_dark text NOT NULL DEFAULT '#a3a3a3'::text,
  shell_background_light text NOT NULL DEFAULT '#fffbf4'::text,
  shell_background_dark text NOT NULL DEFAULT '#22180f'::text,
  shell_surface_light text NOT NULL DEFAULT '#fffcf7'::text,
  shell_surface_dark text NOT NULL DEFAULT '#2e261c'::text,
  panel_wallpaper_url text,
  CONSTRAINT organization_settings_pkey PRIMARY KEY (organization_id),
  CONSTRAINT organization_settings_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.permissions (
  code text NOT NULL,
  description text NOT NULL,
  CONSTRAINT permissions_pkey PRIMARY KEY (code)
);
CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id),
  CONSTRAINT roles_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_code text NOT NULL,
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_code),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT role_permissions_permission_code_fkey FOREIGN KEY (permission_code) REFERENCES public.permissions(code)
);
CREATE TABLE public.organization_members (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  display_name text,
  status USER-DEFINED NOT NULL DEFAULT 'active'::member_status,
  invited_email text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT organization_members_pkey PRIMARY KEY (id),
  CONSTRAINT organization_members_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT organization_members_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.member_roles (
  member_id uuid NOT NULL,
  role_id uuid NOT NULL,
  CONSTRAINT member_roles_pkey PRIMARY KEY (member_id, role_id),
  CONSTRAINT member_roles_member_id_fkey FOREIGN KEY (member_id) REFERENCES public.organization_members(id),
  CONSTRAINT member_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  parent_id uuid,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  tax_id text,
  credit_limit numeric,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT customers_pkey PRIMARY KEY (id),
  CONSTRAINT customers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.suppliers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  tax_id text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT suppliers_pkey PRIMARY KEY (id),
  CONSTRAINT suppliers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.locations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT locations_pkey PRIMARY KEY (id),
  CONSTRAINT locations_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  category_id uuid,
  sku text NOT NULL,
  name text NOT NULL,
  description text,
  barcode text,
  sale_price numeric NOT NULL DEFAULT 0,
  cost_price numeric,
  tax_rate numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  sku text NOT NULL,
  name text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  sale_price numeric,
  barcode text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id),
  CONSTRAINT product_variants_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT product_variants_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.stock_levels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  location_id uuid NOT NULL,
  quantity numeric NOT NULL DEFAULT 0,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT stock_levels_pkey PRIMARY KEY (id),
  CONSTRAINT stock_levels_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT stock_levels_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT stock_levels_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT stock_levels_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  location_id uuid NOT NULL,
  movement_type USER-DEFINED NOT NULL,
  quantity_delta numeric NOT NULL,
  unit_cost numeric,
  reference_type text,
  reference_id uuid,
  notes text,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_movements_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT inventory_movements_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT inventory_movements_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT inventory_movements_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id),
  CONSTRAINT inventory_movements_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.cash_registers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  location_id uuid,
  name text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT cash_registers_pkey PRIMARY KEY (id),
  CONSTRAINT cash_registers_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT cash_registers_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);
CREATE TABLE public.cash_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cash_register_id uuid NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::cash_session_status,
  opening_amount numeric NOT NULL DEFAULT 0,
  closing_amount numeric,
  difference numeric,
  opened_by uuid NOT NULL,
  closed_by uuid,
  opened_at timestamp with time zone NOT NULL DEFAULT now(),
  closed_at timestamp with time zone,
  notes text,
  CONSTRAINT cash_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT cash_sessions_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT cash_sessions_cash_register_id_fkey FOREIGN KEY (cash_register_id) REFERENCES public.cash_registers(id),
  CONSTRAINT cash_sessions_opened_by_fkey FOREIGN KEY (opened_by) REFERENCES public.organization_members(id),
  CONSTRAINT cash_sessions_closed_by_fkey FOREIGN KEY (closed_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id uuid,
  cash_session_id uuid,
  status USER-DEFINED NOT NULL DEFAULT 'draft'::sale_status,
  sale_number text,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_total numeric NOT NULL DEFAULT 0,
  discount_total numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  void_reason text,
  voided_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sales_pkey PRIMARY KEY (id),
  CONSTRAINT sales_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT sales_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT sales_cash_session_id_fkey FOREIGN KEY (cash_session_id) REFERENCES public.cash_sessions(id),
  CONSTRAINT sales_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.sale_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  description text,
  quantity numeric NOT NULL,
  unit_price numeric NOT NULL,
  line_discount numeric NOT NULL DEFAULT 0,
  tax_rate numeric,
  line_tax numeric NOT NULL DEFAULT 0,
  line_total numeric NOT NULL,
  CONSTRAINT sale_lines_pkey PRIMARY KEY (id),
  CONSTRAINT sale_lines_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id),
  CONSTRAINT sale_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT sale_lines_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.sale_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sale_id uuid NOT NULL,
  method USER-DEFINED NOT NULL,
  amount numeric NOT NULL,
  reference text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT sale_payments_pkey PRIMARY KEY (id),
  CONSTRAINT sale_payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id)
);
CREATE TABLE public.receivables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  customer_id uuid NOT NULL,
  sale_id uuid,
  document_number text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_at date,
  total numeric NOT NULL,
  balance_due numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::receivable_status,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT receivables_pkey PRIMARY KEY (id),
  CONSTRAINT receivables_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT receivables_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id),
  CONSTRAINT receivables_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES public.sales(id)
);
CREATE TABLE public.receivable_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  receivable_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  method USER-DEFINED NOT NULL DEFAULT 'cash'::payment_method,
  reference text,
  recorded_by uuid,
  CONSTRAINT receivable_payments_pkey PRIMARY KEY (id),
  CONSTRAINT receivable_payments_receivable_id_fkey FOREIGN KEY (receivable_id) REFERENCES public.receivables(id),
  CONSTRAINT receivable_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.payables (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  document_number text,
  issued_at date NOT NULL DEFAULT CURRENT_DATE,
  due_at date,
  total numeric NOT NULL,
  balance_due numeric NOT NULL,
  status USER-DEFINED NOT NULL DEFAULT 'open'::payable_status,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT payables_pkey PRIMARY KEY (id),
  CONSTRAINT payables_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT payables_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id)
);
CREATE TABLE public.payable_payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  payable_id uuid NOT NULL,
  amount numeric NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  method USER-DEFINED NOT NULL DEFAULT 'transfer'::payment_method,
  reference text,
  recorded_by uuid,
  CONSTRAINT payable_payments_pkey PRIMARY KEY (id),
  CONSTRAINT payable_payments_payable_id_fkey FOREIGN KEY (payable_id) REFERENCES public.payables(id),
  CONSTRAINT payable_payments_recorded_by_fkey FOREIGN KEY (recorded_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.purchases (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  supplier_id uuid NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'received'::text,
  total numeric NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT purchases_pkey PRIMARY KEY (id),
  CONSTRAINT purchases_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT purchases_supplier_id_fkey FOREIGN KEY (supplier_id) REFERENCES public.suppliers(id),
  CONSTRAINT purchases_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.organization_members(id)
);
CREATE TABLE public.purchase_lines (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL,
  product_id uuid NOT NULL,
  variant_id uuid,
  quantity numeric NOT NULL,
  unit_cost numeric NOT NULL,
  line_total numeric NOT NULL,
  CONSTRAINT purchase_lines_pkey PRIMARY KEY (id),
  CONSTRAINT purchase_lines_purchase_id_fkey FOREIGN KEY (purchase_id) REFERENCES public.purchases(id),
  CONSTRAINT purchase_lines_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT purchase_lines_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  organization_id uuid,
  actor_member_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT audit_logs_pkey PRIMARY KEY (id),
  CONSTRAINT audit_logs_organization_id_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT audit_logs_actor_member_id_fkey FOREIGN KEY (actor_member_id) REFERENCES public.organization_members(id)
);