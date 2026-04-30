create extension if not exists pgmq;

do $$
begin
  perform pgmq.create('backend_events');
exception
  when duplicate_table then
    null;
  when duplicate_schema then
    null;
end $$;

