// Connect page: builds the link lists from CONFIG.LINKS (edit links in config.js).
renderHeader('connect');
$('links').innerHTML = Object.entries(cfg.LINKS).map(([group, items]) =>
  `<section><h2>${esc(group)}</h2>` +
  items.map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.name)}<span aria-hidden="true">&#8599;</span></a>`).join('') +
  `</section>`
).join('');
