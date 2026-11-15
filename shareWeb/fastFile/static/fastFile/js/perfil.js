/* fastFile — profile inbox */
(() => {
  const removeItem = (li) => {
    li.classList.add('removing');
    setTimeout(() => {
      const list = li.parentElement;
      li.remove();
      if (!list.querySelector('.inbox-item')) {
        const empty = document.createElement('li');
        empty.className = 'inbox-empty';
        empty.textContent = list.id === 'requests-list' ? 'No pending requests.' : "You're all caught up.";
        list.appendChild(empty);
      }
    }, 300);
  };

  document.querySelectorAll('#requests-list .decide button').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const li = btn.closest('.inbox-item');
      const accept = btn.dataset.decision === 'True';
      ff.loading(btn, true);
      const { data } = await ff.post('/allowUser', { id: li.dataset.id, decision: btn.dataset.decision, caller: li.dataset.user });
      if (data.respost === 'made') {
        ff.toast(accept ? `${li.dataset.user} can now download it` : `Request from ${li.dataset.user} rejected`, accept ? 'success' : 'info');
        removeItem(li);
        const counter = document.getElementById('pending-count');
        if (counter) counter.textContent = Math.max(0, parseInt(counter.textContent, 10) - 1);
      } else {
        ff.loading(btn, false);
        ff.toast(data.respost || 'Something went wrong', 'error');
      }
    });
  });

  const clear = document.getElementById('clear-notes');
  if (clear) {
    clear.addEventListener('click', async () => {
      ff.loading(clear, true);
      const { data } = await ff.post('/deleteMessages');
      if (data.respost === 'deleted') {
        document.querySelectorAll('#notes-list .inbox-item').forEach((li, i) => setTimeout(() => removeItem(li), i * 60));
        clear.remove();
        ff.toast('Notifications cleared', 'success');
      } else {
        ff.loading(clear, false);
      }
    });
  }
})();
