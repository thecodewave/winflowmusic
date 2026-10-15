# Setup (about 15 minutes)

1. Create a free project at supabase.com. Copy **Project URL** and **anon public key** (Settings > API) into `js/config.js`.
2. **SQL Editor** > New query > paste this > Run:

```sql
-- Safe to run more than once.
create table if not exists songs (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_date date,
  youtube_url text,
  cover_path text,
  video_path text,
  audio_path text not null,
  published boolean not null default false,
  created_at timestamptz not null default now()
);
alter table songs add column if not exists video_path text;   -- for databases created before video uploads
alter table songs enable row level security;

drop policy if exists "public reads published" on songs;
create policy "public reads published" on songs for select using (published = true);
drop policy if exists "admin full access" on songs;
create policy "admin full access" on songs for all to authenticated using (true) with check (true);

insert into storage.buckets (id, name, public) values ('media', 'media', true)
  on conflict (id) do update set public = true;

drop policy if exists "admin uploads" on storage.objects;
create policy "admin uploads" on storage.objects for insert to authenticated with check (bucket_id = 'media');
drop policy if exists "admin updates" on storage.objects;
create policy "admin updates" on storage.objects for update to authenticated using (bucket_id = 'media');
drop policy if exists "admin deletes" on storage.objects;
create policy "admin deletes" on storage.objects for delete to authenticated using (bucket_id = 'media');
```
(Copy only the lines inside the box, not the three backtick lines. They are formatting, not SQL.)
3. **Authentication > Users > Add user**: create his email + password.
4. **Authentication > Sign In / Providers**: turn OFF "Allow new users to sign up". Otherwise anyone can create an account and upload.
5. Put his photo at `images/artist.jpg`.
6. Test locally: open the folder in VS Code and use the Live Server extension (or run `python3 -m http.server`), then open `/admin.html`.
7. Host free on Netlify, Vercel or Cloudflare Pages: drag the whole folder in.

## Debugging
- Open the browser console (F12). Every step logs with the prefix `[site]`; set `DEBUG = false` in `js/app.js` to silence.
- Blank Songs page: check `js/config.js` values, and that at least one song is **Published**.
- Upload fails: re-run the storage policies in step 2. In the console, `window.__songs` shows what the admin page loaded.
- Video tab greyed out: that song has no video file uploaded.
- Video upload rejected: the file is too big for your Supabase plan. Compress it to MP4 (H.264), for example with HandBrake, and check the limit in Storage settings.



admin logs: winflow@gmail.com