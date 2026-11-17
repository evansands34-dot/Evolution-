/* Repair the storefront's overlay interactions without changing its search/header layout. */
(() => {
  'use strict';

  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  };
  const closeOverlay = id => document.getElementById(id)?.remove();
  const safeText = value => String(value ?? '');

  function openInfoDialog(title, contentBuilder) {
    closeOverlay('storefrontInfoOverlay');
    const backdrop = document.createElement('div');
    backdrop.id = 'storefrontInfoOverlay';
    backdrop.className = 'storefront-overlay';
    const dialog = document.createElement('section');
    dialog.className = 'storefront-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const head = document.createElement('header');
    head.className = 'storefront-dialog-head';
    const heading = document.createElement('h2');
    heading.textContent = title;
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'storefront-dialog-close';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', () => closeOverlay('storefrontInfoOverlay'));
    head.append(heading, close);
    const body = document.createElement('div');
    body.className = 'storefront-dialog-body';
    contentBuilder(body);
    dialog.append(head, body);
    backdrop.append(dialog);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) backdrop.remove(); });
    document.body.append(backdrop);
    close.focus();
  }

  function showHistory() {
    openInfoDialog('Search history', body => {
      const history = read('evoSearchHistory', []);
      if (!Array.isArray(history) || history.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'storefront-muted';
        empty.textContent = 'Your searches will appear here.';
        body.append(empty);
        return;
      }
      const list = document.createElement('div');
      list.className = 'storefront-history-list';
      history.filter(query => typeof query === 'string').forEach(query => {
        const link = document.createElement('a');
        link.href = `shop.html?q=${encodeURIComponent(query)}`;
        link.textContent = `⌕  ${query}`;
        list.append(link);
      });
      const clear = document.createElement('button');
      clear.type = 'button';
      clear.className = 'storefront-dialog-action';
      clear.textContent = 'Clear search history';
      clear.addEventListener('click', () => {
        try { localStorage.setItem('evoSearchHistory', '[]'); } catch { /* Storage may be disabled. */ }
        closeOverlay('storefrontInfoOverlay');
      });
      body.append(list, clear);
    });
  }

  function showSupport() {
    openInfoDialog('Customer service', body => {
      const intro = document.createElement('p');
      intro.textContent = 'We’re here to help with products, orders, and returns.';
      const note = document.createElement('p');
      note.className = 'storefront-muted';
      note.textContent = 'This demo storefront has no connected support inbox. Demo orders and return requests are available from your account menu.';
      body.append(intro, note);
    });
  }

  function showAccountDialog(title, text, settings = false) {
    openInfoDialog(title, body => {
      const user = read('evoUser', null);
      if (!user) {
        const note = document.createElement('p');
        note.textContent = 'Please sign in to use account features.';
        body.append(note);
        return;
      }
      if (settings) {
        const form = document.createElement('form');
        form.className = 'storefront-account-form';
        const label = document.createElement('label');
        label.htmlFor = 'storefrontAccountName';
        label.textContent = 'Account name';
        const input = document.createElement('input');
        input.id = 'storefrontAccountName';
        input.name = 'name';
        input.required = true;
        input.maxLength = 80;
        input.value = safeText(user.name);
        const email = document.createElement('p');
        email.className = 'storefront-muted';
        email.textContent = `Email: ${safeText(user.email || 'not provided')}`;
        const save = document.createElement('button');
        save.type = 'submit';
        save.className = 'storefront-dialog-action';
        save.textContent = 'Save settings';
        form.append(label, input, email, save);
        form.addEventListener('submit', event => {
          event.preventDefault();
          const name = input.value.trim();
          if (!name) return;
          user.name = name;
          try { localStorage.setItem('evoUser', JSON.stringify(user)); }
          catch { return; }
          syncAccountName();
          closeOverlay('storefrontInfoOverlay');
        });
        body.append(form);
        return;
      }
      const orders = read('evoOrders', []);
      if (!Array.isArray(orders) || orders.length === 0) {
        const empty = document.createElement('p');
        empty.className = 'storefront-muted';
        empty.textContent = 'No demo orders yet.';
        body.append(empty);
        return;
      }
      const list = document.createElement('div');
      list.className = 'storefront-history-list';
      orders.forEach(order => {
        const item = document.createElement('article');
        item.className = 'storefront-order';
        const summary = Array.isArray(order.items) ? order.items.map(line => `${line.quantity || 1} × ${line.name || 'Item'}`).join(', ') : '';
        item.textContent = `${text}: ${order.id || 'Demo order'}${summary ? ` — ${summary}` : ''}`;
        list.append(item);
      });
      body.append(list);
    });
  }

  function syncAccountName() {
    const button = document.querySelector('#profileButton');
    if (!button) return;
    let label = button.querySelector('.profile-name');
    if (!label) {
      label = document.createElement('span');
      label.className = 'profile-name';
      const cartLink = button.parentElement?.querySelector('a[href="cart.html"]');
      button.insertBefore(label, cartLink || null);
    }
    const user = read('evoUser', null);
    label.textContent = safeText(user?.name?.trim().split(/\s+/)[0] || 'Account');
    button.setAttribute('aria-haspopup', 'menu');
    button.setAttribute('aria-expanded', 'false');
  }

  function accountMenu() {
    const profile = document.querySelector('.profile');
    if (!profile) return null;
    let menu = document.getElementById('profileMenu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'profileMenu';
      menu.className = 'profile-menu';
      menu.setAttribute('role', 'menu');
      menu.innerHTML = '<button type="button" role="menuitem" data-store-account="settings">Account settings</button><button type="button" role="menuitem" data-store-account="orders">Recent orders &amp; returns</button><button type="button" role="menuitem" data-store-account="signout">Sign out</button>';
      profile.append(menu);
    }
    return menu;
  }

  function openAiChat() {
    if (document.getElementById('aiDrawer')) return;
    const drawer = document.createElement('section');
    drawer.id = 'aiDrawer';
    drawer.className = 'ai-drawer';
    drawer.setAttribute('role', 'dialog');
    drawer.setAttribute('aria-label', 'Evo AI chat');
    drawer.innerHTML = '<header class="ai-head"><div><strong>Evo AI</strong><div>Your Evolution shopping assistant</div></div><button class="close" type="button" aria-label="Close chat">×</button></header><div class="ai-messages" id="aiMessages"><div class="bubble">Hi! I’m Evo AI. Ask me to find products or compare listed prices.</div></div><form class="ai-form" id="aiForm"><input name="question" type="text" placeholder="Ask about products…" aria-label="Message Evo AI" autocomplete="off" required><button class="button" type="submit">Send</button></form>';
    document.body.append(drawer);
    drawer.querySelector('.close').addEventListener('click', () => drawer.remove());
    drawer.querySelector('input').focus();
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const aiButton = target.closest('[data-action="ai"], #aiButton, .ai-teaser button');
    if (aiButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      openAiChat();
      return;
    }

    const profileButton = target.closest('#profileButton');
    if (profileButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const menu = accountMenu();
      const opening = !menu.classList.contains('open');
      menu.classList.toggle('open', opening);
      profileButton.setAttribute('aria-expanded', String(opening));
      return;
    }

    const accountAction = target.closest('#profileMenu [data-store-account]')?.dataset.storeAccount;
    if (accountAction) {
      event.preventDefault();
      event.stopImmediatePropagation();
      document.getElementById('profileMenu')?.classList.remove('open');
      if (accountAction === 'settings') showAccountDialog('Account settings', '', true);
      else if (accountAction === 'orders') showAccountDialog('Recent orders & returns', 'Order', false);
      else {
        try { localStorage.removeItem('evoUser'); } catch { /* Ignore unavailable storage. */ }
        window.location.reload();
      }
      return;
    }

    const action = target.closest('[data-action]')?.dataset.action;
    if (action === 'history' || action === 'support') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (action === 'history') showHistory(); else showSupport();
      return;
    }

    if (!target.closest('.profile')) document.getElementById('profileMenu')?.classList.remove('open');
  }, true);

  document.addEventListener('submit', event => {
    if (event.target?.id !== 'siteSearchForm') return;
    const input = event.target.querySelector('#siteSearch');
    const query = input?.value.trim();
    if (!query) return;
    try {
      const history = read('evoSearchHistory', []);
      const next = [query, ...(Array.isArray(history) ? history.filter(item => item !== query) : [])].slice(0, 20);
      localStorage.setItem('evoSearchHistory', JSON.stringify(next));
    } catch { /* Search navigation still works if storage is unavailable. */ }
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      closeOverlay('storefrontInfoOverlay');
      document.getElementById('aiDrawer')?.remove();
      document.getElementById('profileMenu')?.classList.remove('open');
    }
  });

  syncAccountName();
  accountMenu();
})();
