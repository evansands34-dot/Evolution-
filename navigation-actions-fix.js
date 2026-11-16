/* Restore the navigation actions independently of the storefront's main click handler. */
(() => {
  'use strict';

  function closeDialog() {
    document.querySelector('#navigationActionDialog')?.remove();
  }

  function openDialog(title, content) {
    closeDialog();
    const backdrop = document.createElement('div');
    backdrop.id = 'navigationActionDialog';
    backdrop.setAttribute('role', 'presentation');
    backdrop.style.cssText = 'position:fixed;inset:0;z-index:2000;display:grid;place-items:center;padding:16px;background:rgba(0,0,0,.72)';

    const dialog = document.createElement('section');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'navigationActionTitle');
    dialog.style.cssText = 'width:min(520px,100%);max-height:min(80vh,680px);overflow:auto;padding:22px;color:#f5f5f5;background:#171719;border:1px solid #38383b;border-radius:16px;box-shadow:0 18px 60px #000b';

    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:16px;margin-bottom:16px';
    const heading = document.createElement('h2');
    heading.id = 'navigationActionTitle';
    heading.textContent = title;
    heading.style.cssText = 'margin:0;font-size:1.25rem';
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Close';
    close.setAttribute('aria-label', 'Close dialog');
    close.style.cssText = 'padding:8px 12px;color:#f5f5f5;background:#29292d;border:0;border-radius:8px;cursor:pointer';
    close.addEventListener('click', closeDialog);
    header.append(heading, close);
    dialog.append(header, content);
    backdrop.append(dialog);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeDialog(); });
    document.body.append(backdrop);
    close.focus();
  }

  function showHistory() {
    let history = [];
    try {
      const stored = JSON.parse(localStorage.getItem('evoSearchHistory') || '[]');
      if (Array.isArray(stored)) history = stored.filter(item => typeof item === 'string');
    } catch { /* Treat invalid browser storage as empty history. */ }

    const content = document.createElement('div');
    if (!history.length) {
      const empty = document.createElement('p');
      empty.textContent = 'Searches you make will appear here.';
      empty.style.color = '#aaa';
      content.append(empty);
    } else {
      const list = document.createElement('div');
      list.style.cssText = 'display:grid;gap:8px';
      history.forEach(query => {
        const link = document.createElement('a');
        link.href = `shop.html?q=${encodeURIComponent(query)}`;
        link.textContent = `⌕  ${query}`;
        link.style.cssText = 'display:block;padding:10px 12px;color:#f5f5f5;background:#242426;border-radius:9px;text-decoration:none';
        list.append(link);
      });
      content.append(list);
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.textContent = 'Clear search history';
      clear.style.cssText = 'margin-top:14px;padding:9px 12px;color:#f5f5f5;background:#29292d;border:0;border-radius:8px;cursor:pointer';
      clear.addEventListener('click', () => {
        try { localStorage.setItem('evoSearchHistory', '[]'); } catch { /* Ignore unavailable storage. */ }
        closeDialog();
      });
      content.append(clear);
    }
    openDialog('Your search history', content);
  }

  function showCustomerService() {
    const content = document.createElement('div');
    const intro = document.createElement('p');
    intro.textContent = "We're here to help with products, orders, and returns.";
    const details = document.createElement('p');
    details.textContent = 'This demo storefront does not have a connected support inbox. Demo orders and return requests are available from the account menu; checkout does not process real payments.';
    details.style.cssText = 'color:#aaa;line-height:1.6';
    content.append(intro, details);
    openDialog('Customer service', content);
  }

  document.addEventListener('click', event => {
    const action = event.target instanceof Element ? event.target.closest('[data-action]') : null;
    const name = action?.dataset.action;
    if (name !== 'history' && name !== 'support') return;

    event.preventDefault();
    event.stopImmediatePropagation();
    if (name === 'history') showHistory();
    else showCustomerService();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeDialog();
  });
})();
