// Gallery page: a photo wall from CONFIG.GALLERY with a keyboard-friendly viewer.
const photos = cfg.GALLERY || [];
const lb = $('lb');
let current = 0;

function show(i) {
  current = (i + photos.length) % photos.length;
  $('lb-img').src = photos[current].src;
  $('lb-img').alt = photos[current].alt || '';
  $('lb-count').textContent = `${current + 1} of ${photos.length}`;
}

function open(i) {
  show(i);
  if (!lb.open) lb.showModal();
}

renderHeader('gallery');
if (!photos.length) {
  $('wall').outerHTML = '<p class="empty-note">No photos yet. Add some to the GALLERY list in js/config.js.</p>';
} else {
  $('wall').innerHTML = photos.map((p, i) =>
    `<button class="shot" data-i="${i}" aria-label="Open photo ${i + 1}"><img src="${esc(p.src)}" alt="${esc(p.alt || '')}" loading="lazy"></button>`
  ).join('');
  $('wall').addEventListener('click', (e) => {
    const b = e.target.closest('.shot');
    if (b) open(+b.dataset.i);
  });
}
$('lb-close').onclick = () => lb.close();
$('lb-prev').onclick = () => show(current - 1);
$('lb-next').onclick = () => show(current + 1);
lb.addEventListener('click', (e) => { if (e.target === lb) lb.close(); });
lb.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') show(current - 1);
  if (e.key === 'ArrowRight') show(current + 1);
});
