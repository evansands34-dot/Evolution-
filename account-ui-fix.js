/* Account menu and account dialogs: interactive enhancements for the existing storefront header. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const read = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  };
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function updateAccountLabel() {
    const user = read('evoUser', null);
    const button = $('#profileButton');
    if (!button) return;
    const name = user?.name?.trim() || 'Account';
    const label = button.querySelector('.profile-name');
    if (label) label.textContent = name.split(/\s+/)[0];
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-haspopup', 'menu');
  }

  function closeMenu() {
    const menu = $('#profileMenu');
    const button = $('#profileButton');
    menu?.classList.remove('open');
    button?.setAttribute('aria-expanded', 'false');
  }

  function closeDialog() {
    $('#accountUiDialog')?.remove();
  }

  function openDialog(title, content) {
    closeDialog();
    closeMenu();
    const backdrop = document.createElement('div');
    backdrop.id = 'accountUiDialog';
    backdrop.className = 'account-ui-backdrop';
    const dialog = document.createElement('section');
    dialog.className = 'account-ui-dialog';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-labelledby', 'accountUiTitle');
    const headingRow = document.createElement('header');
    headingRow.className = 'account-ui-heading';
    const heading = document.createElement('h2');
    heading.id = 'accountUiTitle';
    heading.textContent = title;
    const close = document.createElement('button');
    close.className = 'account-ui-close';
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.textContent = '×';
    close.addEventListener('click', closeDialog);
    headingRow.append(heading, close);
    dialog.append(headingRow, content);
    backdrop.append(dialog);
    backdrop.addEventListener('click', event => { if (event.target === backdrop) closeDialog(); });
    document.body.append(backdrop);
    close.focus();
  }

  function showSettings() {
    const user = read('evoUser', null);
    if (!user) { window.location.href = 'signin.html'; return; }
    const content = document.createElement('div');
    content.innerHTML = `<p class="account-ui-muted">Your demo profile is saved in this browser.</p>
      <form id="accountUiSettingsForm" class="account-ui-form">
        <label for="accountUiName">Account name</label>
        <input id="accountUiName" name="name" maxlength="80" required value="${escapeHtml(user.name || '')}">
        <label for="accountUiEmail">Email</label>
        <input id="accountUiEmail" value="${escapeHtml(user.email || '')}" disabled>
        <button class="account-ui-primary" type="submit">Save settings</button>
      </form>`;
    content.querySelector('#accountUiSettingsForm').addEventListener('submit', event => {
      event.preventDefault();
      const name = content.querySelector('#accountUiName').value.trim();
      if (!name) return;
      user.name = name;
      if (!write('evoUser', user)) return;
      updateAccountLabel();
      closeDialog();
    });
    openDialog('Account settings', content);
  }

  function showOrders() {
    const orders = read('evoOrders', []);
    const content = document.createElement('div');
    if (!Array.isArray(orders) || orders.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'account-ui-muted';
      empty.textContent = 'No demo orders yet. Orders placed through demo checkout will appear here.';
      content.append(empty);
    } else {
      const list = document.createElement('div');
      list.className = 'account-ui-orders';
      orders.forEach(order => {
        const card = document.createElement('article');
        card.className = 'account-ui-order';
        const title = document.createElement('strong');
        title.textContent = `Order ${order.id || ''}`;
        const date = document.createElement('p');
        date.className = 'account-ui-muted';
        date.textContent = order.created ? new Date(order.created).toLocaleDateString() : 'Demo order';
        const itemSummary = document.createElement('p');
        itemSummary.textContent = Array.isArray(order.items) ? order.items.map(item => `${item.quantity || 1} × ${item.name || 'Item'}`).join(', ') : '';
        card.append(title, date, itemSummary);
        if (!order.returnRequested) {
          const request = document.createElement('button');
          request.className = 'account-ui-secondary';
          request.type = 'button';
          request.textContent = 'Request a demo return';
          request.addEventListener('click', () => {
            const currentOrders = read('evoOrders', []);
            const match = Array.isArray(currentOrders) && currentOrders.find(entry => entry.id === order.id);
            if (match) {
              match.returnRequested = true;
              write('evoOrders', currentOrders);
              showOrders();
            }
          });
          card.append(request);
        } else {
          const status = document.createElement('p');
          status.className = 'account-ui-muted';
          status.textContent = 'Demo return requested';
          card.append(status);
        }
        list.append(card);
      });
      content.append(list);
    }
    openDialog('Recent orders & returns', content);
  }

  document.addEventListener('click', event => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;

    const profileButton = target.closest('#profileButton');
    if (profileButton) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const menu = $('#profileMenu');
      if (!menu) return;
      const willOpen = !menu.classList.contains('open');
      menu.classList.toggle('open', willOpen);
      profileButton.setAttribute('aria-expanded', String(willOpen));
      return;
    }

    const action = target.closest('#profileMenu [data-action]')?.dataset.action;
    if (action === 'settings' || action === 'orders') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (action === 'settings') showSettings();
      else showOrders();
      return;
    }

    if (!target.closest('#profileMenu')) closeMenu();
    if (target.closest('#accountUiDialog [data-close-account-dialog]')) closeDialog();
  }, true);

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') { closeDialog(); closeMenu(); }
  });

  updateAccountLabel();
})();
