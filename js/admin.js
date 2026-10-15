// Admin page: sign in, add songs (files go to Storage, details to the "songs" table), publish/unpublish, delete.
function setStatus(msg, isErr = false) {
  $('status').textContent = msg;
  $('status').classList.toggle('err', isErr);
  log(isErr ? 'ERROR:' : 'status:', msg);
}

async function init() {
  renderHeader('');
  const { data: { session } } = await db.auth.getSession();
  showPanel(!!session);
  db.auth.onAuthStateChange((_event, s) => showPanel(!!s));        // keeps the page in sync with login state
  $('login-form').addEventListener('submit', onLogin);
  $('logout').addEventListener('click', () => db.auth.signOut());
  $('song-form').addEventListener('submit', onAddSong);
  $('song-list').addEventListener('click', onListClick);
}

function showPanel(loggedIn) {
  $('login').hidden = loggedIn;
  $('panel').hidden = !loggedIn;
  if (loggedIn) loadList();
}

async function onLogin(e) {
  e.preventDefault();
  const { error } = await db.auth.signInWithPassword({ email: $('email').value, password: $('password').value });
  $('login-status').textContent = error ? `Sign in failed: ${error.message}` : '';
}

// Upload one file to the "media" bucket and return its path (saved in the table).
async function upload(file, folder) {
  const safeName = file.name.replace(/[^\w.\-]/g, '_');
  const path = `${folder}/${Date.now()}-${safeName}`;
  const { error } = await db.storage.from('media').upload(path, file, { cacheControl: '3600' });
  if (error) throw new Error(`Upload of ${file.name} failed: ${error.message}`);
  log('uploaded', path);
  return path;
}

async function onAddSong(e) {
  e.preventDefault();
  const publish = e.submitter && e.submitter.value === 'publish';  // which button was pressed
  const title = $('title').value.trim();
  const video = $('video').files[0];
  const audio = $('audio').files[0];
  const cover = $('cover').files[0];

  if (!title) return setStatus('Enter a song title.', true);
  if (!audio) return setStatus('Choose an audio file (MP3 or WAV).', true);
  const maxMb = cfg.MAX_VIDEO_MB;
  if (video && video.size > maxMb * 1024 * 1024) return setStatus(`That video is ${Math.round(video.size / 1048576)} MB. The limit is ${maxMb} MB. Compress it to MP4 and try again.`, true);

  try {
    setStatus('Uploading files...');
    const audio_path = await upload(audio, 'audio');
    const cover_path = cover ? await upload(cover, 'covers') : null;
    const video_path = video ? await upload(video, 'videos') : null;
    setStatus('Saving song...');
    const { error } = await db.from('songs').insert({
      title, video_path, release_date: $('release').value || null,
      audio_path, cover_path, published: publish
    });
    if (error) throw new Error(`Saving failed: ${error.message}`);
    $('song-form').reset();
    setStatus(publish ? 'Published.' : 'Saved as draft.');
    loadList();
  } catch (err) { setStatus(err.message, true); }
}

async function loadList() {
  try {
    const songs = await getSongs({ admin: true });
    window.__songs = songs;                                        // handy for debugging in the console
    $('song-list').innerHTML = songs.length ? songs.map((s) =>
      `<div class="row"><div class="grow"><div>${esc(s.title)}</div><div class="muted">${s.published ? 'Published' : 'Draft'}</div></div>` +
      `<button class="btn ghost" data-action="toggle" data-id="${s.id}">${s.published ? 'Unpublish' : 'Publish'}</button>` +
      `<button class="btn ghost" data-action="delete" data-id="${s.id}">Delete</button></div>`).join('')
      : '<p class="muted">No songs yet. Add the first one.</p>';
  } catch (err) { setStatus(`Could not load songs: ${err.message}`, true); }
}

async function onListClick(e) {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;
  const song = window.__songs.find((s) => s.id === btn.dataset.id);
  try {
    if (btn.dataset.action === 'toggle') {
      const { error } = await db.from('songs').update({ published: !song.published }).eq('id', song.id);
      if (error) throw error;
      setStatus(song.published ? 'Unpublished.' : 'Published.');
    } else {
      if (!confirm(`Delete "${song.title}"? This cannot be undone.`)) return;
      const files = [song.audio_path, song.cover_path, song.video_path].filter(Boolean);
      if (files.length) await db.storage.from('media').remove(files);
      const { error } = await db.from('songs').delete().eq('id', song.id);
      if (error) throw error;
      setStatus('Deleted.');
    }
    loadList();
  } catch (err) { setStatus(`Action failed: ${err.message}`, true); }
}
init();
