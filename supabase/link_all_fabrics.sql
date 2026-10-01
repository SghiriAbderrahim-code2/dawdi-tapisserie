-- اربط كل الأقمشة المتاحة بكل أنواع الأثاث
-- (شغّلها مرة واحدة بعد إضافة أقمشتك — آمنة للتكرار)
insert into public.fabric_furniture_types (fabric_id, furniture_type_id)
select f.id, t.id
from public.fabrics f
cross join public.furniture_types t
where f.is_available
on conflict do nothing;
