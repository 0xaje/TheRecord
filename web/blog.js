// Select the last heading above the reading line, including long sections.
export function activeSectionId(sections, readingLine) {
  let current = sections[0]?.id;
  for (const section of sections) {
    if (section.top > readingLine) break;
    current = section.id;
  }
  return current;
}

if (typeof document !== "undefined") {
  const navigation = document.querySelector('.blog-navigation');
  const menu = document.querySelector('#blog-menu-toggle');
  const links = [...document.querySelectorAll('.blog-toc a')];
  const sections = [...document.querySelectorAll('.blog-body > section')];
  const screen = document.querySelector('[data-screen="blog"]');
  if (navigation && menu && links.length && sections.length && screen) {
    const close = () => {
      navigation.dataset.open = 'false';
      menu.setAttribute('aria-expanded', 'false');
    };
    menu.addEventListener('click', () => {
      const open = menu.getAttribute('aria-expanded') !== 'true';
      navigation.dataset.open = String(open);
      menu.setAttribute('aria-expanded', String(open));
    });
    navigation.addEventListener('click', event => {
      if (event.target.closest('a')) close();
    });
    navigation.addEventListener('keydown', event => {
      if (event.key === 'Escape') { close(); menu.focus(); }
    });
    let queued = false;
    const update = () => {
      queued = false;
      if (screen.hidden || !screen.getClientRects().length) return;
      const mobile = window.matchMedia('(max-width:760px)').matches;
      const line = Math.max(Math.min(window.innerHeight * .18, 160), 96,
        mobile ? menu.getBoundingClientRect().bottom + 12 : 0);
      const id = activeSectionId(sections.map(section => ({
        id: section.id, top: section.getBoundingClientRect().top,
      })), line);
      for (const link of links) {
        if (link.hash === '#' + id) {
          link.setAttribute('aria-current', 'location');
          menu.textContent = 'Reading: ' + link.textContent;
        } else link.removeAttribute('aria-current');
      }
    };
    const schedule = () => {
      if (!queued) { queued = true; window.requestAnimationFrame(update); }
    };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('hashchange', schedule);
    window.addEventListener('popstate', schedule);
    window.matchMedia('(max-width:760px)').addEventListener('change', close);
    new MutationObserver(schedule).observe(screen, { attributes: true, attributeFilter: ['hidden'] });
    schedule();
  }
}
