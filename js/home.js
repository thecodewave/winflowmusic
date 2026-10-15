// Home page: fills the hero from config.js, shows the latest published song and the streaming links.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Split the name into letters so they can rise in one by one and lift under the pointer.
function buildName() {
  const el = $('name');
  el.setAttribute('aria-label', cfg.ARTIST_NAME);
  el.innerHTML = [...cfg.ARTIST_NAME]
    .map((c, i) => `<span class="ch" aria-hidden="true" style="--i:${i}">${c === ' ' ? '&nbsp;' : esc(c)}</span>`)
    .join('');
  const initial = (cfg.ARTIST_NAME.match(/[\p{L}\p{N}]/u) || [''])[0].toUpperCase();
  $('intro-photo').dataset.initial = initial;
}

// Size the name so it spans the full width of the page, whatever its length.
function fitName() {
  const el = $('name');
  // On wide screens the name must stay in the column beside the portrait, never over it.
  const wide = window.matchMedia('(min-width:761px)').matches;
  const room = $('intro').clientWidth - (wide ? $('intro-photo').getBoundingClientRect().width + 40 : 0);
  el.style.fontSize = '100px';
  const letters = [...el.children];
  if (!letters.length) return;
  const width = letters[letters.length - 1].getBoundingClientRect().right - letters[0].getBoundingClientRect().left;
  const size = Math.max(48, Math.min(200, (100 * room) / width));
  el.style.fontSize = size + 'px';
  document.documentElement.style.setProperty('--name-size', size + 'px');
}

// Letters near the pointer lift slightly, like a flow rolling through the name.
function wireWave() {
  if (reduceMotion || !window.matchMedia('(hover:hover)').matches) return;
  const intro = $('intro');
  const letters = [...$('name').children];
  intro.addEventListener('pointermove', (e) => {
    const size = parseFloat($('name').style.fontSize) || 100;
    for (const l of letters) {
      const r = l.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const lift = Math.max(0, 1 - d / (size * 1.4));
      l.style.translate = `0 ${(-lift * size * 0.09).toFixed(1)}px`;
    }
  });
  intro.addEventListener('pointerleave', () => letters.forEach((l) => (l.style.translate = '')));
}

function renderStream() {
  const list = (cfg.LINKS && cfg.LINKS.Streaming) || [];
  if (!list.length) return;
  $('stream-links').innerHTML = list
    .map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}</a>`)
    .join('');
  $('stream').hidden = false;
}

// Fill the backdrop with rows of the label name.
function buildBackdrop() {
  $('bg').innerHTML = Array.from({ length: 9 }, () => `<span>${'Beatline Records \u00a0 '.repeat(6)}</span>`).join('');
}

async function init() {
  buildBackdrop();
  renderHeader('home');
  $('genre').textContent = cfg.GENRE;
  $('bio').textContent = cfg.BIO;
  buildName();
  fitName();
  (document.fonts ? document.fonts.ready : Promise.resolve()).then(fitName);
  window.addEventListener('resize', fitName);
  wireWave();
  renderStream();
  try {
    const [latest] = await getSongs();
    if (!latest) return log('no published songs yet');
    $('latest-play').hidden = false;
    $('latest-title').textContent = latest.title;
    const cover = mediaUrl(latest.cover_path);
    if (cover) {
      $('latest-cover').src = cover;
      document.querySelector('.record').style.setProperty('--cover', `url("${cover}")`);
    }
    $('latest-play').href = `songs.html?song=${latest.id}`;
  } catch (e) { log('home: could not load latest song', e); }
}
init();