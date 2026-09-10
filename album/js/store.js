/* ============================================================
   store.js — localStorage-backed persistence
   Albums are saved as project data in the browser's localStorage.
   No backend or database is required for this prototype.
   ============================================================ */

const Store = (() => {
  const ALBUMS_KEY = 'kab_albums_v1';
  const SETTINGS_KEY = 'kab_settings_v1';

  function uid(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function getAlbums() {
    try {
      const raw = localStorage.getItem(ALBUMS_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      console.error('Could not read albums', e);
      return {};
    }
  }

  function saveAlbums(albums) {
    localStorage.setItem(ALBUMS_KEY, JSON.stringify(albums));
  }

  function getAlbum(id) {
    return getAlbums()[id] || null;
  }

  function createAlbum(title) {
    const albums = getAlbums();
    const id = uid('album');
    const now = new Date().toISOString();
    albums[id] = {
      id,
      title: title || 'Untitled album',
      clientName: '',
      eventType: '',
      eventDate: '',
      description: '',
      studioName: '',
      logoUrl: '',
      coverPhotoId: null,
      layout: 'grid',
      createdAt: now,
      updatedAt: now,
      photos: [] // { id, url, publicId, order }
    };
    saveAlbums(albums);
    return albums[id];
  }

  function updateAlbum(id, patch) {
    const albums = getAlbums();
    if (!albums[id]) return null;
    albums[id] = { ...albums[id], ...patch, updatedAt: new Date().toISOString() };
    saveAlbums(albums);
    return albums[id];
  }

  function deleteAlbum(id) {
    const albums = getAlbums();
    delete albums[id];
    saveAlbums(albums);
  }

  function addPhoto(albumId, photo) {
    const albums = getAlbums();
    const album = albums[albumId];
    if (!album) return null;
    const order = album.photos.length;
    const record = { id: uid('photo'), order, ...photo };
    album.photos.push(record);
    if (!album.coverPhotoId) album.coverPhotoId = record.id;
    album.updatedAt = new Date().toISOString();
    saveAlbums(albums);
    return record;
  }

  function removePhoto(albumId, photoId) {
    const albums = getAlbums();
    const album = albums[albumId];
    if (!album) return;
    album.photos = album.photos.filter(p => p.id !== photoId).map((p, i) => ({ ...p, order: i }));
    if (album.coverPhotoId === photoId) {
      album.coverPhotoId = album.photos.length ? album.photos[0].id : null;
    }
    album.updatedAt = new Date().toISOString();
    saveAlbums(albums);
  }

  function reorderPhotos(albumId, orderedIds) {
    const albums = getAlbums();
    const album = albums[albumId];
    if (!album) return;
    const byId = Object.fromEntries(album.photos.map(p => [p.id, p]));
    album.photos = orderedIds.map((id, i) => ({ ...byId[id], order: i }));
    album.updatedAt = new Date().toISOString();
    saveAlbums(albums);
  }

  function setCover(albumId, photoId) {
    updateAlbum(albumId, { coverPhotoId: photoId });
  }

  function getSettings() {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      return raw ? JSON.parse(raw) : { cloudName: '', uploadPreset: '' };
    } catch (e) {
      return { cloudName: '', uploadPreset: '' };
    }
  }

  function saveSettings(settings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }

  return {
    getAlbums, saveAlbums, getAlbum, createAlbum, updateAlbum, deleteAlbum,
    addPhoto, removePhoto, reorderPhotos, setCover,
    getSettings, saveSettings, uid
  };
})();
