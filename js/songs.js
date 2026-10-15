// Songs page: tracklist + audio/video player. All state lives in one object so it is easy to inspect.
const state = { songs: [], index: 0, mode: 'audio' };   // mode: 'audio' | 'video'

async function init() {
  renderHeader('songs');
  try {
    state.songs = await getSongs();
  } catch (e) {
    $('now').textContent = 'Could not load songs. Check js/config.js and the browser console.';
    return;
  }
  if (!state.songs.length) { $('now').textContent = 'No songs yet. Check back soon.'; return; }

  const wanted = new URLSearchParams(location.search).get('song');   // set by the Home page link
  const i = state.songs.findIndex((s) => s.id === wanted);
  if (i >= 0) state.index = i;

  $('tracks').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-index]');
    if (btn) { state.index = Number(btn.dataset.index); render(); }
  });
  $('tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-mode]');
    if (btn && !btn.disabled) { state.mode = btn.dataset.mode; render(); }
  });
  render();
}

function render() {
  log('render', { index: state.index, mode: state.mode });
  const song = state.songs[state.index];
  const vid = song.video_path;                                      // uploaded video file (may be empty)
  if (state.mode === 'video' && !vid) state.mode = 'audio';       // no video for this song

  $('tabs').querySelectorAll('[data-mode]').forEach((b) => {
    b.classList.toggle('on', b.dataset.mode === state.mode);
    if (b.dataset.mode === 'video') b.disabled = !vid;
  });

  $('stage').innerHTML = state.mode === 'video'
    ? `<video controls preload="metadata" playsinline poster="${esc(mediaUrl(song.cover_path))}" src="${esc(mediaUrl(vid))}"></video>`
    : `<img class="cover" src="${esc(mediaUrl(song.cover_path))}" alt="Cover art for ${esc(song.title)}">`;
  $('audio-wrap').innerHTML = state.mode === 'audio'
    ? `<audio controls preload="none" src="${esc(mediaUrl(song.audio_path))}"></audio>` : '';
  $('now-title').textContent = song.title;

  $('tracks').innerHTML = state.songs.map((s, i) =>
    `<button class="track ${i === state.index ? 'on' : ''}" data-index="${i}">` +
    `<img src="${esc(mediaUrl(s.cover_path))}" alt=""><span>${esc(s.title)}</span></button>`).join('');
}
init();
