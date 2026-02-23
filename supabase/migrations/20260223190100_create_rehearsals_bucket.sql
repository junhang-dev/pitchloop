insert into storage.buckets (id, name, public, file_size_limit)
values ('rehearsals', 'rehearsals', false, 209715200)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit;