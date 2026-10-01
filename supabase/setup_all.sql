-- >>> BEGIN supabase/schema.sql

-- =====================================================
-- متجر الأثاث حسب الطلب - مخطط Supabase (PostgreSQL)
-- شغّله في: Supabase > SQL Editor
-- =====================================================

-- ---------- 0. أدوات مساعدة ----------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- 1. الأدمن ----------
create table public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------- 2. الفئات وأنواع الأثاث ----------
create table public.categories (
  id          serial primary key,
  slug        text unique not null,
  name_ar     text not null,
  name_fr     text,
  sort_order  int  not null default 0
);

-- نوع الأثاث في المخصّص + حدود المقاسات (سم)
create table public.furniture_types (
  id          serial primary key,
  category_id int  not null references public.categories(id),
  slug        text unique not null,           -- chair, single-bed ...
  name_ar     text not null,
  name_fr     text,
  svg_file    text,                           -- chair.svg
  min_length  int not null, max_length int not null,
  min_width   int not null, max_width  int not null,
  min_height  int not null, max_height int not null,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  check (min_length <= max_length and min_width <= max_width and min_height <= max_height)
);

-- ---------- 3. المنتجات والصور ----------
create table public.products (
  id          serial primary key,
  category_id int  not null references public.categories(id),
  slug        text unique not null,
  name        text not null,
  description text,
  is_visible  boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create trigger trg_products_updated before update on public.products
  for each row execute function public.set_updated_at();
create index on public.products (category_id, is_visible, sort_order);

create table public.product_images (
  id         serial primary key,
  product_id int  not null references public.products(id) on delete cascade,
  url        text not null,
  alt_text   text,
  is_main    boolean not null default false,
  sort_order int not null default 0
);
-- صورة رئيسية واحدة فقط لكل منتج
create unique index one_main_image_per_product
  on public.product_images (product_id) where is_main;

-- ---------- 4. الأقمشة والأخشاب ----------
create table public.fabrics (
  id             serial primary key,
  name           text not null,
  thumbnail_url  text not null,
  texture_url    text not null,
  dominant_color text,                         -- #1F3A93
  is_available   boolean not null default true,
  sort_order     int not null default 0
);

-- أي أقمشة تناسب أي نوع أثاث
create table public.fabric_furniture_types (
  fabric_id         int not null references public.fabrics(id) on delete cascade,
  furniture_type_id int not null references public.furniture_types(id) on delete cascade,
  primary key (fabric_id, furniture_type_id)
);

create table public.wood_finishes (
  id           serial primary key,
  name         text not null,                  -- جوز، بلوط، أبيض
  color_hex    text not null,
  is_available boolean not null default true,
  sort_order   int not null default 0
);

-- ---------- 5. الطلبات ----------
create type public.order_status as enum
  ('new', 'in_progress', 'ready', 'delivered', 'cancelled');

create sequence public.order_number_seq start 1000;

create table public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text unique not null
                default ('FR-' || nextval('public.order_number_seq')),
  customer_name text not null,
  phone         text not null,
  address       text,
  notes         text,
  budget        numeric(10,2),                 -- ميزانية الزبون (اختياري)
  agreed_price  numeric(10,2),                 -- السعر المتفق عليه (الأدمن)
  internal_note text,                          -- ملاحظة داخلية للمحل
  status        public.order_status not null default 'new',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create trigger trg_orders_updated before update on public.orders
  for each row execute function public.set_updated_at();
create index on public.orders (status, created_at desc);
create index on public.orders (phone);

create table public.order_items (
  id                uuid primary key default gen_random_uuid(),
  order_id          uuid not null references public.orders(id) on delete cascade,
  furniture_type_id int  not null references public.furniture_types(id),
  fabric_id         int  references public.fabrics(id),
  wood_finish_id    int  references public.wood_finishes(id),
  length_cm         int  not null check (length_cm > 0),
  width_cm          int  not null check (width_cm  > 0),
  height_cm         int  not null check (height_cm > 0),
  quantity          int  not null check (quantity between 1 and 50),
  notes             text,
  snapshot_path     text                       -- لقطة PNG للتصميم في Storage
);
create index on public.order_items (order_id);

-- سجل تغيّر الحالة
create table public.order_status_log (
  id         bigserial primary key,
  order_id   uuid not null references public.orders(id) on delete cascade,
  old_status public.order_status,
  new_status public.order_status not null,
  note       text,
  changed_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.order_status_log (order_id, old_status, new_status, changed_by)
    values (new.id, old.status, new.status, auth.uid());
  end if;
  return new;
end $$;
create trigger trg_orders_status_log after update on public.orders
  for each row execute function public.log_order_status();

-- سجل الإشعارات (لمعرفة ما فشل إرساله)
create table public.notification_log (
  id         bigserial primary key,
  order_id   uuid references public.orders(id) on delete cascade,
  channel    text not null,                    -- telegram / email
  success    boolean not null,
  error      text,
  created_at timestamptz not null default now()
);

-- ---------- 6. دالة إنشاء الطلب (Transaction واحدة) ----------
-- تُستدعى فقط من الخادم (Next.js API) بعد التحقق من Turnstile
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_number   text;
  it         jsonb;
  ft         public.furniture_types%rowtype;
  v_len int; v_wid int; v_hei int; v_qty int; v_fabric int;
begin
  -- بيانات الزبون
  if length(trim(coalesce(p_customer->>'name',''))) < 2 then
    raise exception 'invalid_name';
  end if;
  if coalesce(p_customer->>'phone','') !~ '^[0-9+ ]{8,16}$' then
    raise exception 'invalid_phone';
  end if;

  -- القطع
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid_items';
  end if;

  -- تحقق من كل قطعة قبل أي إدراج
  for it in select * from jsonb_array_elements(p_items) loop
    select * into ft from public.furniture_types
      where id = (it->>'furniture_type_id')::int and is_active;
    if not found then raise exception 'invalid_furniture_type'; end if;

    v_len := (it->>'length_cm')::int;
    v_wid := (it->>'width_cm')::int;
    v_hei := (it->>'height_cm')::int;
    v_qty := (it->>'quantity')::int;

    if v_len not between ft.min_length and ft.max_length
       or v_wid not between ft.min_width  and ft.max_width
       or v_hei not between ft.min_height and ft.max_height then
      raise exception 'dimensions_out_of_range';
    end if;
    if v_qty not between 1 and 50 then raise exception 'invalid_quantity'; end if;

    v_fabric := nullif(it->>'fabric_id','')::int;
    if v_fabric is not null and not exists (
      select 1 from public.fabrics f
      join public.fabric_furniture_types x on x.fabric_id = f.id
      where f.id = v_fabric and f.is_available and x.furniture_type_id = ft.id
    ) then
      raise exception 'invalid_fabric';
    end if;
  end loop;

  -- الإدراج
  insert into public.orders (customer_name, phone, address, notes, budget)
  values (
    trim(p_customer->>'name'),
    trim(p_customer->>'phone'),
    nullif(trim(p_customer->>'address'), ''),
    nullif(trim(p_customer->>'notes'), ''),
    nullif(p_customer->>'budget','')::numeric
  )
  returning id, order_number into v_order_id, v_number;

  insert into public.order_items
    (order_id, furniture_type_id, fabric_id, wood_finish_id,
     length_cm, width_cm, height_cm, quantity, notes, snapshot_path)
  select v_order_id,
         (e->>'furniture_type_id')::int,
         nullif(e->>'fabric_id','')::int,
         nullif(e->>'wood_finish_id','')::int,
         (e->>'length_cm')::int, (e->>'width_cm')::int, (e->>'height_cm')::int,
         (e->>'quantity')::int,
         nullif(e->>'notes',''),
         nullif(e->>'snapshot_path','')
  from jsonb_array_elements(p_items) e;

  insert into public.order_status_log (order_id, old_status, new_status)
  values (v_order_id, null, 'new');

  return jsonb_build_object('id', v_order_id, 'order_number', v_number);
end $$;

-- لا أحد يستدعيها إلا الخادم بمفتاح service_role
revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- ---------- 7. Row Level Security ----------
alter table public.admins                enable row level security;
alter table public.categories            enable row level security;
alter table public.furniture_types       enable row level security;
alter table public.products              enable row level security;
alter table public.product_images        enable row level security;
alter table public.fabrics               enable row level security;
alter table public.fabric_furniture_types enable row level security;
alter table public.wood_finishes         enable row level security;
alter table public.orders                enable row level security;
alter table public.order_items           enable row level security;
alter table public.order_status_log      enable row level security;
alter table public.notification_log      enable row level security;

-- قراءة عامة للمحتوى المنشور فقط
create policy "public read categories"  on public.categories      for select using (true);
create policy "public read types"       on public.furniture_types for select using (is_active);
create policy "public read products"    on public.products        for select using (is_visible);
create policy "public read images"      on public.product_images  for select using (
  exists (select 1 from public.products p where p.id = product_id and p.is_visible));
create policy "public read fabrics"     on public.fabrics         for select using (is_available);
create policy "public read fabric map"  on public.fabric_furniture_types for select using (true);
create policy "public read woods"       on public.wood_finishes   for select using (is_available);

-- الأدمن: كل شيء
create policy "admin all categories" on public.categories       for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all types"      on public.furniture_types  for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all products"   on public.products         for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all images"     on public.product_images   for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all fabrics"    on public.fabrics          for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all fabric map" on public.fabric_furniture_types for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all woods"      on public.wood_finishes    for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all orders"     on public.orders           for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all items"      on public.order_items      for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all log"        on public.order_status_log for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all notif"      on public.notification_log for all using (public.is_admin()) with check (public.is_admin());
-- جدول admins: بدون سياسات = لا وصول من العميل (يُدار من SQL Editor فقط)

-- ---------- 8. Storage ----------
insert into storage.buckets (id, name, public) values
  ('products', 'products', true),
  ('fabrics',  'fabrics',  true),
  ('order-snapshots', 'order-snapshots', false)
on conflict do nothing;

create policy "public read products files" on storage.objects
  for select using (bucket_id in ('products', 'fabrics'));
create policy "admin manage files" on storage.objects
  for all using (public.is_admin() and bucket_id in ('products','fabrics','order-snapshots'))
  with check (public.is_admin() and bucket_id in ('products','fabrics','order-snapshots'));
-- رفع اللقطات من الزبون يتم عبر API في الخادم (service_role)، والأدمن يقرأها عبر signed URL

-- ---------- 9. بيانات أولية ----------
insert into public.categories (slug, name_ar, name_fr, sort_order) values
  ('chairs',  'كراسي',  'Chaises',  1),
  ('beds',    'أسرّة',  'Lits',     2),
  ('sofas',   'أرائك',  'Canapés',  3),
  ('tables',  'طاولات', 'Tables',   4);

insert into public.furniture_types
  (category_id, slug, name_ar, name_fr, svg_file,
   min_length, max_length, min_width, max_width, min_height, max_height, sort_order) values
  (1, 'chair',      'كرسي',        'Chaise',        'chair.svg',       35,  70, 35,  70,  70, 130, 1),
  (2, 'single-bed', 'سرير فردي',   'Lit simple',    'single-bed.svg', 180, 220, 80, 120,  30,  60, 2),
  (2, 'double-bed', 'سرير مزدوج',  'Lit double',    'double-bed.svg', 180, 220,130, 220,  30,  60, 3),
  (3, 'sofa',       'أريكة',       'Canapé',        'sofa.svg',       120, 350, 70, 110,  60, 100, 4),
  (4, 'table',      'طاولة',       'Table',         'table.svg',       60, 350, 40, 120,  40,  80, 5);

insert into public.wood_finishes (name, color_hex, sort_order) values
  ('جوز', '#5C4033', 1), ('بلوط', '#B08D57', 2), ('أبيض', '#F2EFE9', 3);

-- ---------- 10. تعيين الأدمن (بعد إنشاء حسابك من Authentication) ----------
-- insert into public.admins (user_id) values ('ضع-UUID-حسابك-هنا');


-- <<< END supabase/schema.sql

-- >>> BEGIN supabase/schema_v2.sql

-- =====================================================
-- ترقية المخطط v2 - شغّله بعد schema.sql
-- نظام الخيارات + أنواع جديدة + حقول الأقمشة
-- =====================================================

-- ---------- 1. أنواع الأثاث ----------
alter table public.furniture_types
  add column if not exists is_round boolean not null default false;
-- في الأنواع الدائرية: العرض = الطول = القطر

insert into public.categories (slug, name_ar, name_fr, sort_order)
values ('other', 'أخرى', 'Autres', 5)
on conflict (slug) do nothing;

insert into public.furniture_types
  (category_id, slug, name_ar, name_fr, svg_file, is_round,
   min_length, max_length, min_width, max_width, min_height, max_height, sort_order)
select c.id, v.slug, v.name_ar, v.name_fr, v.svg, v.is_round,
       v.a, v.b, v.c, v.d, v.e, v.f, v.so
from (values
  ('chairs','swivel-chair','كرسي دوّار','Fauteuil pivotant','swivel-chair.svg',false, 70,100, 70,100, 70, 90, 6),
  ('sofas', 'round-sofa',  'كنبة دائرية','Canapé rond',     'round-sofa.svg',  true, 110,180,110,180, 60, 90, 7),
  ('sofas', 'l-sofa',      'أريكة زاوية L','Canapé d''angle','l-sofa.svg',     false,200,450,150,400, 60,100, 8),
  ('other', 'pouf',        'بوف','Pouf',                    'pouf.svg',        true,  35, 60, 35, 60, 35, 50, 9),
  ('tables','side-table',  'طاولة جانبية','Table d''appoint','side-table.svg', false, 30, 70, 30, 70, 35, 70,10)
) as v(cat, slug, name_ar, name_fr, svg, is_round, a, b, c, d, e, f, so)
join public.categories c on c.slug = v.cat
on conflict (slug) do nothing;

-- ---------- 2. الأقمشة ----------
alter table public.fabrics
  add column if not exists fabric_type text not null default 'other'
    check (fabric_type in ('boucle','velvet','chenille','corduroy','leather','linen','jacquard','other')),
  add column if not exists code text,          -- رمز الكتالوج
  add column if not exists supplier text,
  add column if not exists is_print boolean not null default false;

-- بعد إضافة أقمشتك: اربطها بكل الأنواع، ثم احذف ما لا يناسب
-- insert into public.fabric_furniture_types
--   select f.id, t.id from public.fabrics f cross join public.furniture_types t
--   on conflict do nothing;

-- ---------- 3. نظام الخيارات ----------
create table public.option_groups (
  id                serial primary key,
  furniture_type_id int  not null references public.furniture_types(id) on delete cascade,
  key               text not null,                 -- headboard, storage ...
  name_ar           text not null,
  name_fr           text,
  is_required       boolean not null default true,
  sort_order        int not null default 0,
  unique (furniture_type_id, key)
);

create table public.option_values (
  id           serial primary key,
  group_id     int  not null references public.option_groups(id) on delete cascade,
  key          text not null,                      -- arched, lift ...
  name_ar      text not null,
  name_fr      text,
  is_available boolean not null default true,
  sort_order   int not null default 0,
  unique (group_id, key)
);

-- اختيارات الزبون لكل قطعة: {"headboard":"arched","storage":"lift"}
alter table public.order_items
  add column if not exists options jsonb not null default '{}'::jsonb;

alter table public.option_groups enable row level security;
alter table public.option_values enable row level security;
create policy "public read groups" on public.option_groups for select using (true);
create policy "public read values" on public.option_values for select using (is_available);
create policy "admin all groups" on public.option_groups for all using (public.is_admin()) with check (public.is_admin());
create policy "admin all values" on public.option_values for all using (public.is_admin()) with check (public.is_admin());

-- ---------- 4. بيانات الخيارات الأولية ----------
insert into public.option_groups (furniture_type_id, key, name_ar, is_required, sort_order)
select t.id, v.key, v.name_ar, v.req, v.so
from (values
  ('single-bed','headboard','شكل رأس السرير',true,1),
  ('single-bed','headboard_height','ارتفاع رأس السرير',true,2),
  ('single-bed','storage','التخزين',true,3),
  ('single-bed','trundle','سرير سحّاب',false,4),
  ('double-bed','headboard','شكل رأس السرير',true,1),
  ('double-bed','headboard_height','ارتفاع رأس السرير',true,2),
  ('double-bed','storage','التخزين',true,3),
  ('l-sofa','stitch','نمط الخياطة',true,1),
  ('l-sofa','storage','التخزين',true,2),
  ('l-sofa','base','القاعدة',true,3),
  ('round-sofa','stitch','نمط الخياطة',true,1),
  ('swivel-chair','stitch','نمط الخياطة',true,1)
) as v(slug, key, name_ar, req, so)
join public.furniture_types t on t.slug = v.slug
on conflict do nothing;

-- القيم تُطبَّق على كل نوع لديه مجموعة بنفس المفتاح
insert into public.option_values (group_id, key, name_ar, sort_order)
select g.id, v.vkey, v.name_ar, v.so
from (values
  ('headboard','arched','مقوّس',1), ('headboard','plain','مربّع سادة',2),
  ('headboard','channels','خطوط عمودية',3), ('headboard','tufted','كابتونيه',4),
  ('headboard','winged','مجنّح',5),
  ('headboard_height','std','عادي',1), ('headboard_height','tall','مرتفع',2),
  ('storage','none','بدون',1), ('storage','lift','غطاء يُرفع',2), ('storage','drawers','أدراج',3),
  ('trundle','none','بدون',1), ('trundle','pull','سرير سحّاب',2),
  ('stitch','plain','سادة',1), ('stitch','channels','خطوط عمودية',2),
  ('stitch','puffy','مكعبات منتفخة',3), ('stitch','ribbed','أخاديد عريضة',4),
  ('base','wood','خشب',1), ('base','gold-trim','شريط ذهبي',2)
) as v(gkey, vkey, name_ar, so)
join public.option_groups g on g.key = v.gkey
on conflict do nothing;

-- ---------- 5. دالة الطلب المحدّثة (تتحقق من الخيارات) ----------
create or replace function public.create_order(p_customer jsonb, p_items jsonb)
returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_order_id uuid;
  v_number   text;
  it         jsonb;
  opts       jsonb;
  ft         public.furniture_types%rowtype;
  v_len int; v_wid int; v_hei int; v_qty int; v_fabric int;
begin
  if length(trim(coalesce(p_customer->>'name',''))) < 2 then
    raise exception 'invalid_name';
  end if;
  if coalesce(p_customer->>'phone','') !~ '^[0-9+ ]{8,16}$' then
    raise exception 'invalid_phone';
  end if;
  if jsonb_typeof(p_items) <> 'array'
     or jsonb_array_length(p_items) not between 1 and 20 then
    raise exception 'invalid_items';
  end if;

  for it in select * from jsonb_array_elements(p_items) loop
    select * into ft from public.furniture_types
      where id = (it->>'furniture_type_id')::int and is_active;
    if not found then raise exception 'invalid_furniture_type'; end if;

    v_len := (it->>'length_cm')::int;
    v_wid := (it->>'width_cm')::int;
    v_hei := (it->>'height_cm')::int;
    v_qty := (it->>'quantity')::int;

    if ft.is_round and v_wid <> v_len then
      raise exception 'round_requires_equal_dimensions';
    end if;
    if v_len not between ft.min_length and ft.max_length
       or v_wid not between ft.min_width  and ft.max_width
       or v_hei not between ft.min_height and ft.max_height then
      raise exception 'dimensions_out_of_range';
    end if;
    if v_qty not between 1 and 50 then raise exception 'invalid_quantity'; end if;

    v_fabric := nullif(it->>'fabric_id','')::int;
    if v_fabric is not null and not exists (
      select 1 from public.fabrics f
      join public.fabric_furniture_types x on x.fabric_id = f.id
      where f.id = v_fabric and f.is_available and x.furniture_type_id = ft.id
    ) then
      raise exception 'invalid_fabric';
    end if;

    -- الخيارات
    opts := coalesce(it->'options', '{}'::jsonb);
    if jsonb_typeof(opts) <> 'object' then raise exception 'invalid_options'; end if;

    if exists (
      select 1 from public.option_groups g
      where g.furniture_type_id = ft.id and g.is_required and not (opts ? g.key)
    ) then raise exception 'missing_option'; end if;

    if exists (
      select 1 from jsonb_each_text(opts) e
      where not exists (
        select 1 from public.option_groups g
        join public.option_values v on v.group_id = g.id
        where g.furniture_type_id = ft.id and g.key = e.key
          and v.key = e.value and v.is_available)
    ) then raise exception 'invalid_option'; end if;
  end loop;

  insert into public.orders (customer_name, phone, address, notes, budget)
  values (
    trim(p_customer->>'name'),
    trim(p_customer->>'phone'),
    nullif(trim(p_customer->>'address'), ''),
    nullif(trim(p_customer->>'notes'), ''),
    nullif(p_customer->>'budget','')::numeric
  )
  returning id, order_number into v_order_id, v_number;

  insert into public.order_items
    (order_id, furniture_type_id, fabric_id, wood_finish_id,
     length_cm, width_cm, height_cm, quantity, notes, snapshot_path, options)
  select v_order_id,
         (e->>'furniture_type_id')::int,
         nullif(e->>'fabric_id','')::int,
         nullif(e->>'wood_finish_id','')::int,
         (e->>'length_cm')::int, (e->>'width_cm')::int, (e->>'height_cm')::int,
         (e->>'quantity')::int,
         nullif(e->>'notes',''),
         nullif(e->>'snapshot_path',''),
         coalesce(e->'options', '{}'::jsonb)
  from jsonb_array_elements(p_items) e;

  insert into public.order_status_log (order_id, old_status, new_status)
  values (v_order_id, null, 'new');

  return jsonb_build_object('id', v_order_id, 'order_number', v_number);
end $$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;


-- <<< END supabase/schema_v2.sql

-- >>> BEGIN supabase/03_rate_limits.sql

-- =====================================================
-- rate_limits - حد الطلبات لكل IP (من الـ spec، شغّله بعد schema_v2.sql)
-- يقرأه الخادم عبر service_role فقط (بدون سياسات = لا وصول من العميل)
-- =====================================================

create table public.rate_limits (
  ip_hash    text not null,
  created_at timestamptz not null default now()
);

create index on public.rate_limits (ip_hash, created_at desc);

alter table public.rate_limits enable row level security;


-- <<< END supabase/03_rate_limits.sql

-- >>> admin account (created in Auth: admin@habib.test)
insert into public.admins (user_id) values ('24b15e9e-f7de-4588-a527-a4b3f3a3fc12') on conflict do nothing;
