-- DIAGNOSTIC: run this first in Supabase SQL Editor and paste the results back
-- (or use it to see your real column names)

select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

select table_name, column_name, data_type
from information_schema.columns
where table_schema = 'public'
  and table_name in ('shops', 'shop_members', 'shop_memebers', 'profiles', 'users_profile', 'subscriptions')
order by table_name, ordinal_position;

select tgname, pg_get_triggerdef(oid)
from pg_trigger
where tgrelid = 'auth.users'::regclass
  and not tgisinternal;
