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
