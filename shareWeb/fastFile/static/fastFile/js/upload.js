/* fastFile — upload page */
(() => {
  const form = document.getElementById('form-upload');
  const drop = document.getElementById('dropzone');
  const input = document.getElementById('file');
  const chosen = document.getElementById('dz-file');
  const nameInput = document.getElementById('fileName');
  const usePass = document.getElementById('use-password');
  const collapse = document.getElementById('password-collapse');
  const pass = document.getElementById('password');
  const conf = document.getElementById('confirmation');
  const progress = document.getElementById('upload-progress');
  const btn = document.getElementById('upload-btn');

  const showFile = () => {
    const f = input.files[0];
    if (!f) { chosen.classList.remove('show'); return; }
    const kb = f.size / 1024;
    const size = kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
    chosen.querySelector('em').textContent = `${f.name} · ${size}`;
    chosen.classList.remove('show'); void chosen.offsetWidth; chosen.classList.add('show');
    if (!nameInput.value.trim()) nameInput.value = f.name.replace(/\.[^.]+$/, '');
  };
  input.addEventListener('change', showFile);

  ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('drag'); }));
  ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('drag'); }));
  drop.addEventListener('drop', (e) => {
    if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; showFile(); }
  });

  const syncPass = () => {
    collapse.classList.toggle('open', usePass.checked);
    pass.required = conf.required = usePass.checked;
    if (usePass.checked) setTimeout(() => pass.focus(), 250);
    else { pass.value = ''; conf.value = ''; }
  };
  usePass.addEventListener('change', syncPass);

  conf.addEventListener('input', () => conf.setCustomValidity(conf.value && conf.value !== pass.value ? 'Passwords must match' : ''));

  form.addEventListener('submit', (e) => {
    if (!input.files.length) { e.preventDefault(); ff.toast('Choose a file first', 'error'); drop.classList.add('drag'); setTimeout(() => drop.classList.remove('drag'), 600); return; }
    e.preventDefault();
    const xhr = new XMLHttpRequest();
    xhr.open('POST', form.action);
    progress.classList.add('show');
    ff.loading(btn, true);
    xhr.upload.addEventListener('progress', (ev) => {
      if (ev.lengthComputable) progress.firstElementChild.style.width = `${(ev.loaded / ev.total) * 100}%`;
    });
    xhr.addEventListener('load', () => {
      const url = new URL(xhr.responseURL);
      if (url.pathname !== '/upload') { window.location.href = xhr.responseURL; return; }
      document.open(); document.write(xhr.responseText); document.close();
    });
    xhr.addEventListener('error', () => { ff.loading(btn, false); ff.toast('Upload failed — check your connection', 'error'); });
    xhr.send(new FormData(form));
  });
})();
