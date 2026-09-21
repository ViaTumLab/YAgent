(() => {
  'use strict';
  if (!navigator.userAgent.includes('Mac')) return;
  document.documentElement.classList.add('is-mac');
  document.title = 'YAgent';
})();
