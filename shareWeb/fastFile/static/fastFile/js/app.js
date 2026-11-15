/* fastFile — shared UI behaviour */
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isAuth = document.body.dataset.auth === '1';

  window.ff = {
    icons() { if (window.lucide) window.lucide.createIcons(); },

    csrf() {
      const meta = document.querySelector('meta[name="csrf-token"]');
      return meta ? meta.content : '';
    },

    async post(url, body) {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': ff.csrf() },
        body: JSON.stringify(body || {}),
        redirect: 'manual',
      });
      if (res.type === 'opaqueredirect') { window.location.href = '/login?next=' + encodeURIComponent(location.pathname); throw new Error('auth'); }
      let data = {};
      try { data = await res.json(); } catch (_) {}
      return { status: res.status, data };
    },

    toast(message, type = 'info') {
      const icons = { success: 'circle-check', error: 'circle-alert', info: 'info' };
      const wrap = document.getElementById('toasts');
      const el = document.createElement('div');
      el.className = `toast ${type}`;
      el.innerHTML = `<span class="toast-icon"><i data-lucide="${icons[type]}"></i></span><span></span>`;
      el.lastElementChild.textContent = message;
      wrap.appendChild(el);
      ff.icons();
      setTimeout(() => { el.classList.add('out'); el.addEventListener('animationend', () => el.remove(), { once: true }); }, 3200);
    },

    loading(btn, on) { if (btn) { btn.classList.toggle('loading', on); btn.disabled = on; } },
  };

  ff.icons();

  /* password visibility toggles */
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.toggle-pass');
    if (!btn) return;
    const input = btn.parentElement.querySelector('input');
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.innerHTML = `<i data-lucide="${show ? 'eye-off' : 'eye'}"></i>`;
    ff.icons();
  });

  /* count-up stats */
  const counters = document.querySelectorAll('[data-count]');
  if (!reduceMotion) {
    counters.forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      if (target < 2) return;
      const start = performance.now();
      const dur = 1100;
      const tick = (now) => {
        const t = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased).toLocaleString();
        if (t < 1) requestAnimationFrame(tick);
      };
      el.textContent = '0';
      requestAnimationFrame(tick);
    });
  }

  /* unlock with password */
  const modal = document.getElementById('unlock-modal');
  let currentFile = null;

  async function unlock(name, input, btn) {
    const password = input.value.trim();
    if (!password) { input.classList.add('shake'); setTimeout(() => input.classList.remove('shake'), 400); input.focus(); return; }
    ff.loading(btn, true);
    try {
      const { status, data } = await ff.post('/requests', { type: 'lock', name, password });
      if (data.respost === 'ok' || status === 302) {
        ff.toast('Unlocked! Opening file…', 'success');
        setTimeout(() => { window.location.href = `/file/${encodeURIComponent(name)}`; }, 600);
      } else {
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 400);
        ff.toast(data.respost === 'password incorrect' ? 'Wrong password, try again.' : (data.respost || 'Something went wrong'), 'error');
        input.select();
      }
    } catch (_) { /* redirected to login */ }
    finally { ff.loading(btn, false); }
  }

  document.addEventListener('click', (e) => {
    const lock = e.target.closest('[data-unlock]');
    if (lock && modal) {
      if (!isAuth) { window.location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
      currentFile = lock.dataset.unlock;
      modal.querySelector('#unlock-name').textContent = currentFile;
      const input = modal.querySelector('input');
      input.value = '';
      modal.showModal();
      input.focus();
    }
    if (e.target.closest('[data-close]')) e.target.closest('dialog').close();
  });

  if (modal) {
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.close(); });
    modal.querySelector('form').addEventListener('submit', (e) => {
      e.preventDefault();
      unlock(currentFile, modal.querySelector('input'), modal.querySelector('button[type=submit]'));
    });
  }

  const inline = document.getElementById('inline-unlock');
  if (inline) {
    inline.addEventListener('submit', (e) => {
      e.preventDefault();
      unlock(inline.dataset.name, inline.querySelector('input'), inline.querySelector('button[type=submit]'));
    });
  }

  /* ask owner for access */
  document.addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-request]');
    if (!btn) return;
    if (!isAuth) { window.location.href = '/login?next=' + encodeURIComponent(location.pathname); return; }
    ff.loading(btn, true);
    try {
      const { data } = await ff.post('/requests', { type: 'admin-permition', name: btn.dataset.request });
      ff.loading(btn, false);
      if (data.respost === 'ok') {
        ff.toast('Request sent to the owner!', 'success');
        btn.disabled = true;
        btn.innerHTML = '<i data-lucide="hourglass"></i><span>Requested</span>';
        ff.icons();
      } else if (data.respost === 'has permission') {
        ff.toast('You already have access.', 'info');
      } else {
        ff.toast(data.respost || 'Something went wrong', 'error');
      }
    } catch (_) { ff.loading(btn, false); }
  });

  /* download feedback */
  const dl = document.getElementById('download-btn');
  if (dl) dl.addEventListener('click', () => ff.toast('Download started', 'success'));
})();
