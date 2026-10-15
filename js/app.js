// Shared helpers used by every page. Load order: supabase CDN -> config.js -> app.js -> page script.
const DEBUG = true;                        // set false to silence console logs
const cfg = window.CONFIG;
const $ = (id) => document.getElementById(id);
function log(...args) { if (DEBUG) console.log('[site]', ...args); }

// One Supabase client for the whole site.
const db = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);

// Escape text before putting it into innerHTML (stops broken markup and script injection).
function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Public URL for a file saved in the "media" storage bucket.
function mediaUrl(path) {
  return path ? db.storage.from('media').getPublicUrl(path).data.publicUrl : '';
}

// Pull the 11-character video id out of any common YouTube link. Returns null if not found.
function youtubeId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

// Fetch songs, newest first. The public site only sees published songs; admin sees all.
async function getSongs({ admin = false } = {}) {
  let q = db.from('songs').select('*')
    .order('release_date', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });
  if (!admin) q = q.eq('published', true);
  const { data, error } = await q;
  if (error) { log('getSongs failed:', error); throw error; }
  log('loaded songs:', data.length);
  return data;
}

// Top bar shared by all pages. "active" highlights the current page.
function renderHeader(active) {
  const link = (key, href, label) => `<a href="${href}" class="${key === active ? 'active' : ''}">${label}</a>`;
  $('site-header').innerHTML =
    `<a class="brand" href="index.html">${esc(cfg.ARTIST_NAME)}</a>` +
    `<nav>${link('home', 'index.html', 'Home')}${link('songs', 'songs.html', 'Songs')}${link('gallery', 'gallery.html', 'Gallery')}${link('connect', 'connect.html', 'Connect')}</nav>`;
  document.title = `${cfg.ARTIST_NAME} | ${document.title}`;
}
