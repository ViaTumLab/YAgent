(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.querySelector('#navigation');
  const setMenu = (open) => {
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    navigation.classList.toggle('is-open', open);
  };
  menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  navigation.addEventListener('click', (event) => {
    if (event.target.closest('a')) setMenu(false);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') {
      setMenu(false);
      menuButton.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.header')) setMenu(false);
  });
  window.matchMedia('(min-width: 641px)').addEventListener('change', () => setMenu(false));
  document.querySelectorAll('[role="tablist"]').forEach((tablist) => {
    const tabs = [...tablist.querySelectorAll('[role="tab"]')];
    const activateTab = (tab, focus = false) => {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
        document.getElementById(item.getAttribute('aria-controls')).hidden = !selected;
      });
      if (focus) tab.focus();
    };
    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        const next = { ArrowRight: (index + 1) % tabs.length, ArrowLeft: (index + tabs.length - 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
        if (next !== undefined) { event.preventDefault(); activateTab(tabs[next], true); }
      });
    });
  });
  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  let clearStatus;
  copyButton.addEventListener('click', async () => {
    clearTimeout(clearStatus);
    try {
      await navigator.clipboard.writeText('axiom@viatumlab.com');
      copyButton.textContent = '已复制 ✓';
      copyStatus.textContent = '邮箱已复制，可以粘贴到邮件客户端。';
    } catch { copyStatus.textContent = '请手动复制邮箱，或点击上方链接发送邮件。'; }
    clearStatus = setTimeout(() => { copyButton.textContent = '复制邮箱'; copyStatus.textContent = ''; }, 5000);
  });
  document.querySelector('#year').textContent = String(new Date().getFullYear());
})();
