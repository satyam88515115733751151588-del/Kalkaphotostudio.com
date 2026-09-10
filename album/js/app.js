/* ============================================================
   app.js — SPA controller for the local album builder
   ============================================================ */

const LAYOUTS = [
  { id: 'grid', name: 'Standard grid', desc: 'Even squares in three columns.', swatch: 'swatch-grid' },
  { id: 'masonry', name: 'Masonry', desc: 'Flowing columns, natural photo heights.', swatch: 'swatch-masonry' },
  { id: 'large', name: 'Large-image grid', desc: 'Two columns, bigger prints.', swatch: 'swatch-large' },
  { id: 'full', name: 'Full-screen gallery', desc: 'One wide photo per row.', swatch: 'swatch-full' },
  { id: 'slideshow', name: 'Slideshow strip', desc: 'Horizontal scroll, cinematic feel.', swatch: 'swatch-slideshow' },
  { id: 'magazine', name: 'Magazine layout', desc: 'Asymmetric editorial spread.', swatch: 'swatch-magazine' }
];

let state = {
  currentAlbumId: null,
  draggedPhotoId: null
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

/* ---------------- Toast ---------------- */
let toastTimer = null;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3200);
}

/* ---------------- Theme ---------------- */
function initTheme() {
  const stored = localStorage.getItem('kab_builder_theme');
  if (stored) document.documentElement.setAttribute('data-theme', stored);
  $('#btn-theme').addEventListener('click', () => {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('kab_builder_theme', next);
  });
}

/* ---------------- Navigation ---------------- */
function showView(name) {
  $('#view-dashboard').hidden = name !== 'dashboard';
  $('#view-editor').hidden = name !== 'editor';
  if (name === 'dashboard') renderDashboard();
}

/* ---------------- Dashboard ---------------- */
function renderDashboard() {
  const albums = Object.values(Store.getAlbums()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  const grid = $('#album-grid');
  const empty = $('#empty-state');
  $('#album-count-line').textContent = albums.length
    ? `${albums.length} album${albums.length === 1 ? '' : 's'} saved locally.`
    : 'No albums yet.';

  if (!albums.length) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = albums.map(album => {
    const cover = album.photos.find(p => p.id === album.coverPhotoId) || album.photos[0];
    const coverUrl = cover ? thumbUrl(cover.url) : '';
    return `
      <div class="album-card" data-id="${album.id}">
        <div class="album-card__cover" style="${coverUrl ? `background-image:url('${coverUrl}')` : ''}">
          ${coverUrl ? '' : 'No cover yet'}
        </div>
        <div class="album-card__body">
          <p class="album-card__title">${escapeHtml(album.title)}</p>
          <p class="album-card__meta">${album.photos.length} photo${album.photos.length === 1 ? '' : 's'}${album.eventType ? ' · ' + escapeHtml(album.eventType) : ''}</p>
        </div>
      </div>`;
  }).join('');

  $$('.album-card', grid).forEach(card => {
    card.addEventListener('click', () => openAlbum(card.dataset.id));
  });
}

function thumbUrl(url) {
  if (!url || !url.includes('/upload/')) return url;
  return url.replace('/upload/', '/upload/q_auto,f_auto,c_fill,w_500,h_400/');
}

function escapeHtml(str = '') {
  return String(str).replace(/[&<>"']/g, s => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[s]));
}

/* ---------------- Editor: open / load ---------------- */
function openAlbum(id) {
  state.currentAlbumId = id;
  const album = Store.getAlbum(id);
  if (!album) { toast('Album not found'); showView('dashboard'); return; }

  $('#editor-title-text').innerHTML = `<em>${escapeHtml(album.title)}</em>`;
  $('#f-title').value = album.title || '';
  $('#f-client').value = album.clientName || '';
  $('#f-event-type').value = album.eventType || '';
  $('#f-event-date').value = album.eventDate || '';
  $('#f-description').value = album.description || '';
  $('#f-studio').value = album.studioName || '';
  $('#logo-filename').textContent = album.logoUrl ? 'Logo uploaded' : 'No logo uploaded';

  renderPhotoGrid();
  renderLayoutGrid();
  setActiveTab('details');
  showView('editor');
}

function currentAlbum() {
  return Store.getAlbum(state.currentAlbumId);
}

/* ---------------- Tabs ---------------- */
function setActiveTab(tabId) {
  $$('.tab').forEach(t => t.classList.toggle('is-active', t.dataset.tab === tabId));
  $$('.tab-panel').forEach(p => p.classList.toggle('is-active', p.dataset.panel === tabId));
  if (tabId === 'preview') renderPreview();
}

/* ---------------- Details form ---------------- */
function bindDetailsForm() {
  const fields = [
    ['f-title', 'title'], ['f-client', 'clientName'], ['f-event-type', 'eventType'],
    ['f-event-date', 'eventDate'], ['f-description', 'description'], ['f-studio', 'studioName']
  ];
  fields.forEach(([elId, key]) => {
    $('#' + elId).addEventListener('input', debounce((e) => {
      const patch = { [key]: e.target.value };
      Store.updateAlbum(state.currentAlbumId, patch);
      if (key === 'title') $('#editor-title-text').innerHTML = `<em>${escapeHtml(e.target.value || 'Untitled album')}</em>`;
    }, 300));
  });
}

function debounce(fn, ms) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), ms); };
}

/* ---------------- Logo upload ---------------- */
function bindLogoUpload() {
  $('#btn-upload-logo').addEventListener('click', () => {
    const settings = Store.getSettings();
    if (!settings.cloudName || !settings.uploadPreset) { openSettings(); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files[0];
      if (!file) return;
      toast('Uploading logo…');
      try {
        const result = await CloudinaryUpload.uploadFile(file, settings);
        Store.updateAlbum(state.currentAlbumId, { logoUrl: result.url });
        $('#logo-filename').textContent = 'Logo uploaded';
        toast('Logo uploaded');
      } catch (err) {
        toast(err.message || 'Logo upload failed');
      }
    };
    input.click();
  });
}

/* ---------------- Photos ---------------- */
function renderPhotoGrid() {
  const album = currentAlbum();
  const grid = $('#photo-grid');
  const photos = [...album.photos].sort((a, b) => a.order - b.order);
  grid.innerHTML = photos.map(p => `
    <div class="photo-tile ${p.id === album.coverPhotoId ? 'is-cover' : ''}" draggable="true" data-id="${p.id}">
      ${p.id === album.coverPhotoId ? '<span class="photo-tile__cover-badge">Cover</span>' : ''}
      <img src="${thumbUrl(p.url)}" alt="">
      <div class="photo-tile__bar">
        <button class="photo-tile__btn" data-action="cover" title="Set as cover">★</button>
        <button class="photo-tile__btn" data-action="delete" title="Delete">✕</button>
      </div>
    </div>`).join('');

  $$('.photo-tile', grid).forEach(tile => {
    tile.addEventListener('dragstart', () => {
      state.draggedPhotoId = tile.dataset.id;
      tile.classList.add('is-dragging');
    });
    tile.addEventListener('dragend', () => tile.classList.remove('is-dragging'));
    tile.addEventListener('dragover', (e) => e.preventDefault());
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetId = tile.dataset.id;
      if (!state.draggedPhotoId || state.draggedPhotoId === targetId) return;
      reorderByDrop(state.draggedPhotoId, targetId);
    });
    tile.querySelector('[data-action="cover"]').addEventListener('click', () => {
      Store.setCover(state.currentAlbumId, tile.dataset.id);
      renderPhotoGrid();
      toast('Cover photo updated');
    });
    tile.querySelector('[data-action="delete"]').addEventListener('click', () => {
      Store.removePhoto(state.currentAlbumId, tile.dataset.id);
      renderPhotoGrid();
    });
  });
}

function reorderByDrop(draggedId, targetId) {
  const album = currentAlbum();
  const ordered = [...album.photos].sort((a, b) => a.order - b.order).map(p => p.id);
  const from = ordered.indexOf(draggedId);
  const to = ordered.indexOf(targetId);
  ordered.splice(from, 1);
  ordered.splice(to, 0, draggedId);
  Store.reorderPhotos(state.currentAlbumId, ordered);
  renderPhotoGrid();
}

function bindPhotoUpload() {
  const dropzone = $('#dropzone');
  const fileInput = $('#file-input');

  dropzone.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => handleFiles(Array.from(fileInput.files)));

  ['dragenter', 'dragover'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.add('is-dragover'); }));
  ['dragleave', 'drop'].forEach(evt =>
    dropzone.addEventListener(evt, (e) => { e.preventDefault(); dropzone.classList.remove('is-dragover'); }));
  dropzone.addEventListener('drop', (e) => {
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  });
}

async function handleFiles(files) {
  if (!files.length) return;
  const settings = Store.getSettings();
  if (!settings.cloudName || !settings.uploadPreset) {
    toast('Add Cloudinary settings first');
    openSettings();
    return;
  }

  const progressWrap = $('#upload-progress');
  const bar = $('#upload-progress-bar');
  const label = $('#upload-progress-label');
  progressWrap.hidden = false;

  for (let i = 0; i < files.length; i++) {
    label.textContent = `Uploading ${i + 1} of ${files.length}…`;
    try {
      const result = await CloudinaryUpload.uploadFile(files[i], settings, (pct) => {
        bar.style.setProperty('--pct', pct + '%');
      });
      Store.addPhoto(state.currentAlbumId, { url: result.url, publicId: result.publicId });
      renderPhotoGrid();
    } catch (err) {
      toast(err.message || 'Upload failed');
    }
  }

  bar.style.setProperty('--pct', '0%');
  progressWrap.hidden = true;
  label.textContent = '';
  toast('Upload complete');
}

/* ---------------- Layout tab ---------------- */
function renderLayoutGrid() {
  const album = currentAlbum();
  const grid = $('#layout-grid');
  grid.innerHTML = LAYOUTS.map(l => `
    <div class="layout-card ${album.layout === l.id ? 'is-selected' : ''}" data-id="${l.id}">
      <div class="layout-card__swatch ${l.swatch}"></div>
      <p class="layout-card__name">${l.name}</p>
      <p class="layout-card__desc">${l.desc}</p>
    </div>`).join('');

  $$('.layout-card', grid).forEach(card => {
    card.addEventListener('click', () => {
      Store.updateAlbum(state.currentAlbumId, { layout: card.dataset.id });
      renderLayoutGrid();
    });
  });
}

/* ---------------- Preview ---------------- */
function renderPreview() {
  const album = currentAlbum();
  const html = AlbumExport.buildAlbumHTML(album);
  $('#preview-frame').srcdoc = html;
}

/* ---------------- Modal manager ----------------
   Central helpers so only one modal-backdrop is ever visible at a
   time, and every modal can be dismissed the same three ways:
   its own Cancel button, clicking the dark backdrop, or Escape. */
const MODAL_IDS = ['settings-backdrop', 'new-album-backdrop'];

function closeAllModals() {
  MODAL_IDS.forEach(id => { $('#' + id).hidden = true; });
}

function openModal(id) {
  closeAllModals();
  $('#' + id).hidden = false;
}

function closeModal(id) {
  $('#' + id).hidden = true;
}

function bindModalDismissal() {
  MODAL_IDS.forEach(id => {
    const backdrop = $('#' + id);
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal(id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    MODAL_IDS.forEach(id => { if (!$('#' + id).hidden) closeModal(id); });
  });
}

/* ---------------- Settings modal ---------------- */
function openSettings() {
  const settings = Store.getSettings();
  $('#s-cloud-name').value = settings.cloudName || '';
  $('#s-upload-preset').value = settings.uploadPreset || '';
  openModal('settings-backdrop');
}
function bindSettingsModal() {
  $('#btn-settings').addEventListener('click', openSettings);
  $('#btn-settings-cancel').addEventListener('click', () => closeModal('settings-backdrop'));
  $('#btn-settings-save').addEventListener('click', () => {
    Store.saveSettings({
      cloudName: $('#s-cloud-name').value.trim(),
      uploadPreset: $('#s-upload-preset').value.trim()
    });
    closeModal('settings-backdrop');
    toast('Settings saved');
  });
}

/* ---------------- New album modal ---------------- */
function bindNewAlbumModal() {
  const open = () => { $('#n-title').value = ''; openModal('new-album-backdrop'); $('#n-title').focus(); };
  $('#btn-new-album').addEventListener('click', open);
  $('#btn-new-album-empty').addEventListener('click', open);
  $('#btn-new-album-cancel').addEventListener('click', () => closeModal('new-album-backdrop'));
  $('#btn-new-album-create').addEventListener('click', () => {
    const title = $('#n-title').value.trim() || 'Untitled album';
    try {
      const album = Store.createAlbum(title);
      closeModal('new-album-backdrop');
      openAlbum(album.id);
    } catch (err) {
      closeModal('new-album-backdrop');
      toast('Could not create album — please try again');
    }
  });
  $('#n-title').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('#btn-new-album-create').click();
  });
}

/* ---------------- Editor header actions ---------------- */
function bindEditorHeader() {
  $('#btn-back-dashboard').addEventListener('click', () => showView('dashboard'));
  $('#btn-delete-album').addEventListener('click', () => {
    if (!confirm('Delete this album? This cannot be undone.')) return;
    Store.deleteAlbum(state.currentAlbumId);
    toast('Album deleted');
    showView('dashboard');
  });
  $('#btn-export').addEventListener('click', () => {
    const album = currentAlbum();
    if (!album.photos.length) { toast('Add at least one photo before exporting'); return; }
    AlbumExport.downloadAlbum(album);
    toast('Album exported');
  });
}

/* ---------------- Tabs binding ---------------- */
function bindTabs() {
  $$('.tab').forEach(tab => tab.addEventListener('click', () => setActiveTab(tab.dataset.tab)));
}

/* ---------------- Init ---------------- */
function init() {
  initTheme();
  bindTabs();
  bindDetailsForm();
  bindLogoUpload();
  bindPhotoUpload();
  bindSettingsModal();
  bindNewAlbumModal();
  bindModalDismissal();
  bindEditorHeader();
  showView('dashboard');
}

document.addEventListener('DOMContentLoaded', init);
