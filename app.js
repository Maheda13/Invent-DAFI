// ============================================================
// KONFIGURASI - ganti dengan URL Web App Apps Script Anda
// ============================================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbxdLWKDp1r34CNrZjEyCDK2gV6D8JYIC7ZDDNmUuOeLGczAN9JFTnD4RCJVfrQgLYJU/exec'
};

// ============================================================
// FITUR LABEL STICKER INVENTARIS (DIBEKUKAN SEMENTARA)
// Ubah nilai menjadi true jika sistem sudah siap dan stabil
// untuk memunculkan tombol cetak stiker QR Code pada tabel barang & ruangan.
// ============================================================
const FEATURE_LABEL_STICKER = false;

let STATE = {
  token: localStorage.getItem('sidafi_token') || null,
  user: JSON.parse(localStorage.getItem('sidafi_user') || 'null'),
  barangPage: 1,
  ruanganList: [],
  barangList: [],
  referensiList: [],
  pengaturan: {}
};

const INSTITUSI_LIST = ['SMP', 'MA', 'Pesantren'];
function institusiOptions(selected) {
  return '<option value="">-- pilih institusi --</option>' + INSTITUSI_LIST.map(function (inst) {
    return '<option value="' + inst + '"' + (inst === selected ? ' selected' : '') + '>' + inst + '</option>';
  }).join('');
}
document.getElementById('filter-institusi').innerHTML = '<option value="">Semua Institusi</option>' +
  INSTITUSI_LIST.map(function (inst) { return '<option value="' + inst + '">' + inst + '</option>'; }).join('');

// ============================================================
// IKON (SVG inline, tanpa dependensi eksternal - supaya tetap
// ringan & tidak rusak kalau CDN ikon down). Gaya stroke minimal
// konsisten, dipakai di navigasi & tombol aksi.
// ============================================================
const ICONS = {
  home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/>',
  box: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>',
  swap: '<path d="M7 3L3 7l4 4"/><path d="M3 7h13"/><path d="M17 21l4-4-4-4"/><path d="M21 17H8"/>',
  alertTriangle: '<path d="M12 3l10 18H2z"/><line x1="12" y1="9" x2="12" y2="14"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
  wrench: '<path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.8 2.8-2-2 2.8-2.8z"/>',
  trash: '<path d="M3 6h18"/><path d="M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/>',
  archive: '<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8"/><line x1="10" y1="12" x2="14" y2="12"/>',
  building: '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21v-4h6v4"/><line x1="8" y1="7" x2="9" y2="7"/><line x1="15" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="9" y2="11"/><line x1="15" y1="11" x2="16" y2="11"/>',
  tag: '<path d="M20.6 13.4L11 3.8A2 2 0 009.6 3.2L3 3v6.6a2 2 0 00.6 1.4l9.6 9.6a2 2 0 002.8 0l4.6-4.6a2 2 0 000-2.8z"/><circle cx="7.5" cy="7.5" r="1.2"/>',
  users: '<circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 000-8"/><path d="M1 21v-2a4 4 0 014-4h8a4 4 0 014 4v2"/><path d="M23 21v-2a4 4 0 00-3-3.87"/>',
  sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
  logout: '<path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
  login: '<path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/>',
  edit: '<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4 12.5-12.5z"/>',
  clipboard: '<path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
  eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
  printer: '<path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
  undo: '<polyline points="9 10 4 15 9 20"/><path d="M20 4v7a4 4 0 01-4 4H4"/>',
  check: '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
  clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
  arrowDownCircle: '<circle cx="12" cy="12" r="10"/><polyline points="8 12 12 16 16 12"/><line x1="12" y1="8" x2="12" y2="16"/>',
  arrowUpCircle: '<circle cx="12" cy="12" r="10"/><polyline points="16 12 12 8 8 12"/><line x1="12" y1="16" x2="12" y2="8"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  menu: '<line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>',
  bell: '<path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>',
  userCircle: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="9" r="3"/><path d="M6.5 19a6 6 0 0111 0"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  fileText: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
  upload: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
  download: '<path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
};

function icon(name, size) {
  size = size || 15;
  return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
    'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
    (ICONS[name] || '') + '</svg>';
}
// Tombol dengan ikon + label pendek, dipakai untuk aksi baris tabel/nav.
function iconLabel(name, label) {
  return icon(name) + (label ? '<span>' + label + '</span>' : '');
}

// ---------------- API HELPER ----------------
// Catatan: Content-Type text/plain sengaja dipakai supaya browser TIDAK
// mengirim preflight OPTIONS (Apps Script tidak bisa menangani OPTIONS).
let activeRequests = 0;
function showLoading() {
  activeRequests++;
  document.getElementById('loading-bar').classList.remove('hidden');
}
function hideLoading() {
  activeRequests = Math.max(0, activeRequests - 1);
  if (activeRequests === 0) document.getElementById('loading-bar').classList.add('hidden');
}

async function api(action, payload) {
  showLoading();
  try {
    const res = await fetch(CONFIG.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: STATE.token, payload: payload || {} })
    });
    const data = await res.json();
    if (!data.success) {
      if (data.code === 'SESSION_EXPIRED') { handleSessionExpired(); }
      throw new Error(data.message || 'Terjadi kesalahan.');
    }
    return data;
  } finally {
    hideLoading();
  }
}

// Baris "Memuat..." dipasang sesaat sebelum request tabel dikirim,
// supaya pengguna tahu aplikasi sedang bekerja (bukan macet).
function showTableLoading(tbodySelector, colspan) {
  const tbody = document.querySelector(tbodySelector);
  if (tbody) tbody.innerHTML = '<tr class="table-loading-row"><td colspan="' + colspan + '">Memuat data...</td></tr>';
}

function toast(message, isError) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast' + (isError ? ' error' : '');
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 3200);
}

// Dipanggil otomatis saat backend menandai sesi sudah kadaluarsa (poin 3).
// Membersihkan token lokal dan langsung mengarahkan ke layar login,
// tanpa menunggu pengguna mengklik apa pun.
let sessionExpiredHandled = false;
function handleSessionExpired() {
  if (sessionExpiredHandled) return; // hindari trigger berkali-kali kalau ada beberapa request paralel
  sessionExpiredHandled = true;
  STATE.token = null; STATE.user = null;
  localStorage.removeItem('sidafi_token'); localStorage.removeItem('sidafi_user');
  document.getElementById('modal-overlay').classList.add('hidden');
  document.getElementById('print-preview-overlay').classList.add('hidden');
  document.getElementById('view-app').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
  document.getElementById('login-error').textContent = 'Sesi Anda telah berakhir. Silakan login kembali.';
}

// ---------------- LOGIN ----------------
document.getElementById('form-login').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  errEl.textContent = '';
  try {
    const res = await api('login', { username, password });
    STATE.token = res.token;
    STATE.user = res.user;
    sessionExpiredHandled = false;
    localStorage.setItem('sidafi_token', res.token);
    localStorage.setItem('sidafi_user', JSON.stringify(res.user));
    enterApp();
  } catch (err) {
    errEl.textContent = err.message;
  }
});

document.getElementById('btn-logout').addEventListener('click', async function () {
  try { await api('logout', {}); } catch (e) { /* abaikan */ }
  STATE.token = null; STATE.user = null;
  localStorage.removeItem('sidafi_token'); localStorage.removeItem('sidafi_user');
  document.getElementById('view-app').classList.add('hidden');
  document.getElementById('view-login').classList.remove('hidden');
});

// Menyisipkan ikon ke semua elemen ber-atribut data-icon (dipakai untuk
// tombol navigasi & logout yang markupnya statis di index.html).
function initNavIcons() {
  document.querySelectorAll('[data-icon]').forEach(function (el) {
    if (el.dataset.iconApplied) return;
    const iconName = el.dataset.icon;
    const svg = icon(iconName);
    const kbd = el.querySelector('kbd');
    let label = el.textContent.trim();
    if (kbd) {
      label = label.replace(/Ctrl\+K/g, '').trim();
      el.innerHTML = svg + '<span>' + escapeHtml(label) + '</span> ' + kbd.outerHTML;
    } else if (label) {
      el.innerHTML = svg + '<span>' + escapeHtml(label) + '</span>';
    } else {
      el.innerHTML = svg;
    }
    el.dataset.iconApplied = '1';
  });
}
initNavIcons(); // langsung dipanggil supaya tombol "Masuk" di layar login juga berikon

function enterApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('current-user-label').textContent = STATE.user.nama + ' — ' + STATE.user.role;
  initNavIcons();
  document.getElementById('notif-bell-icon').innerHTML = icon('bell');
  if (STATE.user.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(function (el) { el.classList.add('hidden'); });
  }
  if (STATE.user.role !== 'admin' && STATE.user.role !== 'penanggung_jawab') {
    document.querySelectorAll('.pjb-only').forEach(function (el) { el.classList.add('hidden'); });
  }
  if (STATE.user.role !== 'keuangan') {
    document.querySelectorAll('.keuangan-only').forEach(function (el) { el.classList.add('hidden'); });
  } else {
    document.querySelectorAll('.keuangan-only').forEach(function (el) { el.classList.remove('hidden'); });
    document.querySelectorAll('.write-action').forEach(function (el) { el.classList.add('hidden'); });
    refreshNotifBadge();
  }

  const cache = loadDataCache();
  if (cache) {
    // Perangkat ini sudah pernah sinkron sebelumnya - langsung tampil
    // instan dari cache lokal, lalu diam-diam refresh di latar belakang
    // supaya datanya tetap segar tanpa bikin pengguna menunggu.
    hydrateFromCache(cache);
    document.getElementById('view-app').classList.remove('hidden');
    switchView('dashboard');
    refreshBootstrapInBackground();
  } else {
    // Pertama kali login di perangkat ini - unduh data awal dengan
    // indikator progress, supaya akses berikutnya terasa lebih smooth.
    runFirstTimeSync();
  }
}

const DATA_CACHE_KEY = 'sidafi_data_cache_v1';

function loadDataCache() {
  try {
    const raw = localStorage.getItem(DATA_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) { return null; }
}

function saveDataCache() {
  try {
    localStorage.setItem(DATA_CACHE_KEY, JSON.stringify({
      ruangan: STATE.ruanganList,
      referensiKode: STATE.referensiList,
      pengaturan: STATE.pengaturan,
      cachedAt: Date.now()
    }));
  } catch (e) { /* storage penuh/nonaktif (mis. mode incognito) - abaikan, tidak fatal */ }
}

function hydrateFromCache(cache) {
  STATE.ruanganList = cache.ruangan || [];
  STATE.referensiList = cache.referensiKode || [];
  STATE.pengaturan = cache.pengaturan || {};
  renderGolonganFilterOptions();
}

function renderGolonganFilterOptions() {
  const golonganUnik = [...new Set(STATE.referensiList.map(function (r) { return r.golongan_barang; }))];
  const filterGol = document.getElementById('filter-golongan');
  filterGol.innerHTML = '<option value="">Semua Golongan</option>' +
    golonganUnik.map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');
}

// Sinkronisasi pertama kali di perangkat baru: tampilkan overlay dengan
// progress bar sambil mengambil data Ruangan + Referensi Kode + Pengaturan,
// lalu simpan ke cache lokal (localStorage) supaya login berikutnya di
// perangkat yang sama tidak perlu menunggu lagi.
async function runFirstTimeSync() {
  const overlay = document.getElementById('first-sync-overlay');
  const fill = document.getElementById('sync-progress-fill');
  const statusText = document.getElementById('sync-status-text');
  overlay.classList.remove('hidden');
  fill.style.width = '15%';
  statusText.textContent = 'Menyiapkan data ruangan & klasifikasi barang...';

  try {
    const res = await api('getBootstrapData', {});
    STATE.ruanganList = res.data.ruangan;
    STATE.referensiList = res.data.referensiKode;
    STATE.pengaturan = res.data.pengaturan || {};
    renderGolonganFilterOptions();

    fill.style.width = '75%';
    statusText.textContent = 'Menyimpan cache lokal untuk akses berikutnya...';
    saveDataCache();

    fill.style.width = '100%';
    statusText.textContent = 'Siap!';
  } catch (err) {
    // Tetap lanjut meski sinkronisasi awal gagal (mis. koneksi lambat) -
    // pengguna masih bisa pakai aplikasi, data akan diambil per-halaman
    // seperti biasa saat masing-masing tab dibuka.
    statusText.textContent = 'Gagal memuat sebagian data, melanjutkan...';
  }

  setTimeout(function () {
    overlay.classList.add('hidden');
    document.getElementById('view-app').classList.remove('hidden');
    switchView('dashboard');
  }, 300);
}

// Refresh diam-diam di latar belakang (tanpa overlay/loading bar) untuk
// pengguna yang datanya sudah di-hydrate dari cache - supaya data tetap
// segar tanpa mengganggu pengalaman yang sudah terasa instan.
async function refreshBootstrapInBackground() {
  try {
    const res = await api('getBootstrapData', {});
    STATE.ruanganList = res.data.ruangan;
    STATE.referensiList = res.data.referensiKode;
    STATE.pengaturan = res.data.pengaturan || {};
    renderGolonganFilterOptions();
    saveDataCache();
  } catch (e) { /* biarkan tetap pakai data cache lama kalau refresh gagal */ }
}

if (STATE.token && STATE.user) enterApp();

// ---------------- NAVIGASI TAB ----------------
document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { switchView(btn.dataset.view); closeMobileDrawer(); });
});

// ---------------- COLLAPSIBLE SIDEBAR ----------------
function initSidebarCollapse() {
  const isCollapsed = localStorage.getItem('sidafi_sidebar_collapsed') === '1';
  const sidebar = document.getElementById('sidebar');
  if (sidebar && isCollapsed) {
    sidebar.classList.add('collapsed');
  }
}
function toggleSidebarCollapse() {
  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('collapsed');
  localStorage.setItem('sidafi_sidebar_collapsed', sidebar.classList.contains('collapsed') ? '1' : '0');
}
const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
if (btnToggleSidebar) {
  btnToggleSidebar.addEventListener('click', toggleSidebarCollapse);
}
initSidebarCollapse();

// ---------------- DRAWER NAVIGASI MOBILE (hamburger menu) ----------------
function openMobileDrawer() {
  document.querySelector('.sidebar').classList.add('mobile-open');
  document.getElementById('mobile-nav-backdrop').classList.remove('hidden');
}
function closeMobileDrawer() {
  document.querySelector('.sidebar').classList.remove('mobile-open');
  document.getElementById('mobile-nav-backdrop').classList.add('hidden');
}
document.getElementById('btn-mobile-menu').addEventListener('click', openMobileDrawer);
document.getElementById('mobile-nav-backdrop').addEventListener('click', closeMobileDrawer);

function switchView(view) {
  document.querySelectorAll('.tab-btn').forEach(function (b) { b.classList.toggle('active', b.dataset.view === view); });
  document.querySelectorAll('.view-section').forEach(function (s) { s.classList.add('hidden'); });
  document.getElementById('section-' + view).classList.remove('hidden');

  if (view === 'dashboard') loadDashboard();
  if (view === 'barang') loadBarang();
  if (view === 'peminjaman') loadPeminjaman();
  if (view === 'kerusakan') loadKerusakan();
  if (view === 'perawatan') loadPerawatan();
  if (view === 'penghapusan') loadPenghapusan();
  if (view === 'stok') loadStok();
  if (view === 'ruangan') loadRuangan();
  if (view === 'referensi') loadReferensi();
  if (view === 'users') loadUsers();
  if (view === 'pengaturan') loadPengaturanForm();
  if (view === 'akun') loadAkunForm();
}

// ---------------- MODAL HELPER ----------------
function openModal(title, bodyHtml, sizeClass) {
  const card = document.querySelector('#modal-overlay .modal-card');
  if (card) {
    card.classList.remove('modal-xl', 'modal-lg');
    if (sizeClass) card.classList.add(sizeClass);
  }
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() {
  const card = document.querySelector('#modal-overlay .modal-card');
  if (card) card.classList.remove('modal-xl', 'modal-lg');
  document.getElementById('modal-overlay').classList.add('hidden');
}
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target.id === 'modal-overlay') closeModal();
});

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function badge(text) {
  const cls = String(text).toLowerCase().replace(/\s+/g, '-');
  return '<span class="badge badge-' + cls + '">' + text + '</span>';
}
function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function fmtDate(v) { if (!v) return '-'; const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('id-ID'); }

// Menyingkat daftar Nomor Inventaris yang berurutan, mis. empat nomor
// 02.01.03.2023.012 s/d .015 menjadi "02.01.03.2023.012-015". Nomor yang
// beda tahun/kode klasifikasi atau tidak berurutan dipisah koma. Dipakai
// di tabel KIR maupun konfirmasi setelah input barang jumlah banyak.
function formatNomorInventarisRanges(nomorList) {
  const byPrefix = {}; const order = [];
  nomorList.forEach(function (n) {
    const idx = n.lastIndexOf('.');
    const prefix = n.substring(0, idx);
    const urut = parseInt(n.substring(idx + 1), 10);
    if (!byPrefix[prefix]) { byPrefix[prefix] = []; order.push(prefix); }
    byPrefix[prefix].push(urut);
  });
  const parts = [];
  order.forEach(function (prefix) {
    const sorted = byPrefix[prefix].slice().sort(function (a, b) { return a - b; });
    let start = sorted[0], prev = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (i < sorted.length && sorted[i] === prev + 1) { prev = sorted[i]; continue; }
      const padStart = String(start).padStart(3, '0');
      parts.push(start === prev ? (prefix + '.' + padStart) : (prefix + '.' + padStart + '-' + String(prev).padStart(3, '0')));
      if (i < sorted.length) { start = sorted[i]; prev = sorted[i]; }
    }
  });
  return parts.join(', ');
}

// ---------------- INPUT MASK (poin 4: format terstandar) ----------------
// Nomor Inventaris: XX.XX.XX.XXXX.XXX — titik otomatis muncul saat mengetik angka.
function attachNomorInventarisMask(input) {
  const segmentLengths = [2, 2, 2, 4, 3];
  input.addEventListener('input', function () {
    const digits = input.value.replace(/\D/g, '');
    let out = '';
    let pos = 0;
    for (let i = 0; i < segmentLengths.length && pos < digits.length; i++) {
      if (i > 0) out += '.';
      out += digits.substr(pos, segmentLengths[i]);
      pos += segmentLengths[i];
    }
    input.value = out;
  });
}

// Harga: tampilkan dengan pemisah ribuan otomatis (mis. 1.500.000) saat mengetik,
// nilai mentah (angka murni) diambil lewat rawNumber() saat submit.
function attachRupiahMask(input) {
  input.addEventListener('input', function () {
    const digits = input.value.replace(/\D/g, '');
    input.value = digits ? Number(digits).toLocaleString('id-ID') : '';
  });
}
function rawNumber(input) { return input.value.replace(/\D/g, '') || '0'; }

// ---------------- DASHBOARD ----------------
const STATUS_COLORS = {
  tersedia: '#0F9D53',
  dipinjam: '#E5A63A',
  rusak: '#BF1219',
  diusulkan_hapus: '#7C5CD8',
  dihapus: '#9A9A9A'
};
const STATUS_LABELS = {
  tersedia: 'Tersedia', dipinjam: 'Dipinjam', rusak: 'Rusak',
  diusulkan_hapus: 'Diusulkan Hapus', dihapus: 'Dihapus'
};

async function loadDashboard() {
  const res = await api('dashboardSummary', {});
  const s = res.data;

  // Hero: dua angka paling penting
  document.getElementById('hero-grid').innerHTML =
    '<div class="hero-card">' +
      '<div class="hero-label">Total Barang Terdaftar</div>' +
      '<div class="hero-value">' + s.total_barang.toLocaleString('id-ID') + '</div>' +
      '<div class="hero-sub">unit aset tercatat di SIDAFI</div>' +
    '</div>' +
    '<div class="hero-card accent-red">' +
      '<div class="hero-label">Total Nilai Aset</div>' +
      '<div class="hero-value">' + rupiah(s.total_nilai) + '</div>' +
      '<div class="hero-sub">akumulasi harga perolehan</div>' +
    '</div>';

  // Kartu Progres Validasi Triwulanan (Opname)
  const opnameEl = document.getElementById('dash-opname-card');
  if (opnameEl) {
    const pct = s.progres_validasi_pct !== undefined ? s.progres_validasi_pct : 100;
    const isWarning = pct < 80;
    const validCount = Math.max(0, (s.total_barang || 0) - (s.barang_perlu_validasi || 0));
    opnameEl.innerHTML =
      '<div class="dash-opname-header">' +
        '<div>' +
          '<h3 class="dash-opname-title">' + icon('check', 18) + ' Siklus Validasi Opname Triwulan (3 Bulan)</h3>' +
          '<p class="dash-opname-sub">Progres verifikasi fisik aset secara berkala untuk menjaga keakuratan inventaris</p>' +
        '</div>' +
        '<div class="dash-opname-pct ' + (isWarning ? 'warning' : '') + '">' + pct + '%</div>' +
      '</div>' +
      '<div class="opname-progress-track">' +
        '<div class="opname-progress-fill ' + (isWarning ? 'warning' : '') + '" style="width:' + pct + '%"></div>' +
      '</div>' +
      '<div class="dash-opname-footer">' +
        '<span><strong>' + validCount.toLocaleString('id-ID') + '</strong> dari <strong>' + (s.total_barang || 0).toLocaleString('id-ID') + '</strong> barang telah tervalidasi</span>' +
        '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;">' +
          '<button class="btn btn-sm btn-outline-white" onclick="printBeritaAcaraOpname()">' + icon('printer', 14) + '<span>Cetak BA Opname</span></button>' +
          (s.barang_perlu_validasi > 0
            ? '<button class="btn btn-sm btn-outline-white" onclick="filterBarangPerluValidasi()">' + icon('alertTriangle', 14) + '<span>Lihat Perlu Validasi (' + s.barang_perlu_validasi + ')</span></button>'
            : '<span style="font-size:0.85rem;font-weight:600;opacity:0.95;">' + icon('check', 14) + ' Semua Aset Tervalidasi</span>') +
        '</div>' +
      '</div>';
  }

  // Status bar proporsional
  const statusKeys = ['tersedia', 'dipinjam', 'rusak', 'diusulkan_hapus', 'dihapus'];
  const total = statusKeys.reduce(function (sum, k) { return sum + (s[k] || 0); }, 0) || 1;
  document.getElementById('status-bar').innerHTML = statusKeys.map(function (k) {
    const pct = ((s[k] || 0) / total * 100).toFixed(1);
    return '<div class="status-bar-segment" style="width:' + pct + '%;background:' + STATUS_COLORS[k] + ';" title="' + STATUS_LABELS[k] + ': ' + s[k] + '"></div>';
  }).join('');
  document.getElementById('status-legend').innerHTML = statusKeys.map(function (k) {
    return '<span class="status-legend-item"><span class="status-legend-dot" style="background:' + STATUS_COLORS[k] + ';"></span>' +
      STATUS_LABELS[k] + ' (' + (s[k] || 0) + ')</span>';
  }).join('');

  // Distribusi Institusi & Top Ruangan
  const extraGridEl = document.getElementById('dash-extra-grid');
  if (extraGridEl) {
    const inst = s.institusi_breakdown || {};
    const instHtml = INSTITUSI_LIST.map(function (name) {
      const d = inst[name] || { count: 0, nilai: 0 };
      return '<div class="inst-card">' +
        '<div class="inst-name"><span class="badge badge-institusi">' + name + '</span></div>' +
        '<div class="inst-count">' + (d.count || 0).toLocaleString('id-ID') + ' <small>aset</small></div>' +
        '<div class="inst-nilai">' + rupiah(d.nilai || 0) + '</div>' +
      '</div>';
    }).join('');

    const topRooms = s.top_ruangan || [];
    let roomsHtml = '';
    if (topRooms.length === 0) {
      roomsHtml = '<p style="color:#888;font-size:0.85rem;padding:0.5rem 0;">Belum ada data ruangan.</p>';
    } else {
      roomsHtml = '<ul class="top-rooms-list">' + topRooms.map(function (r, idx) {
        const rName = roomName(r.kode_ruangan || r.ruangan);
        return '<li class="top-room-item">' +
          '<span class="top-room-rank">' + (idx + 1) + '</span>' +
          '<span class="top-room-name" title="' + escapeHtml(rName) + '">' + escapeHtml(rName) + '</span>' +
          '<span class="top-room-count">' + r.count + ' unit</span>' +
        '</li>';
      }).join('') + '</ul>';
    }

    extraGridEl.innerHTML =
      '<div class="dash-extra-card">' +
        '<h4 class="dash-extra-title">' + icon('building', 16) + ' Distribusi Aset per Institusi</h4>' +
        '<div class="inst-grid">' + instHtml + '</div>' +
      '</div>' +
      '<div class="dash-extra-card">' +
        '<h4 class="dash-extra-title">' + icon('archive', 16) + ' 5 Ruangan Terbanyak Aset</h4>' +
        roomsHtml +
      '</div>';
  }

  // Notice cards (aktif, bisa diklik ke tab terkait)
  const kerusakanIssue = s.kerusakan_belum_selesai > 0;
  const penghapusanIssue = s.penghapusan_menunggu > 0;
  const stokIssue = s.stok_menipis > 0;
  const incompleteCount = s.barang_tidak_lengkap || 0;
  const incompleteIssue = incompleteCount > 0;
  const validasiOverdueCount = s.barang_perlu_validasi || 0;
  const validasiIssue = validasiOverdueCount > 0 && (s.mode_validasi_aktif !== false);
  const siklusBulan = s.siklus_validasi_bulan || 3;

  document.getElementById('notice-grid').innerHTML =
    '<div class="notice-card ' + (kerusakanIssue ? 'has-issue' : 'all-clear') + '" onclick="switchView(\'kerusakan\')">' +
      '<div><div class="notice-text">Kerusakan Belum Selesai</div>' +
      '<div class="notice-sub">' + (kerusakanIssue ? 'Perlu tindak lanjut' : 'Semua kerusakan sudah ditangani') + '</div></div>' +
      '<div class="notice-count">' + s.kerusakan_belum_selesai + '</div>' +
    '</div>' +
    '<div class="notice-card ' + (penghapusanIssue ? 'has-issue' : 'all-clear') + '" onclick="switchView(\'penghapusan\')">' +
      '<div><div class="notice-text">Penghapusan Menunggu Keputusan</div>' +
      '<div class="notice-sub">' + (penghapusanIssue ? 'Menunggu persetujuan admin/kepsek' : 'Tidak ada usulan tertunda') + '</div></div>' +
      '<div class="notice-count">' + s.penghapusan_menunggu + '</div>' +
    '</div>' +
    '<div class="notice-card ' + (stokIssue ? 'has-issue' : 'all-clear') + '" onclick="switchView(\'stok\')">' +
      '<div><div class="notice-text">Stok Menipis</div>' +
      '<div class="notice-sub">' + (stokIssue ? 'Perlu segera direstok' : 'Semua stok masih aman') + '</div></div>' +
      '<div class="notice-count">' + s.stok_menipis + '</div>' +
    '</div>' +
    '<div class="notice-card ' + (incompleteIssue ? 'has-issue' : 'all-clear') + '" onclick="filterBarangIncomplete()">' +
      '<div><div class="notice-text">Data Belum Lengkap</div>' +
      '<div class="notice-sub">' + (incompleteIssue ? ((s.merk_kosong || 0) + ' tanpa merk, ' + (s.harga_kosong || 0) + ' tanpa harga') : 'Semua data barang lengkap') + '</div></div>' +
      '<div class="notice-count">' + incompleteCount + '</div>' +
    '</div>' +
    '<div class="notice-card ' + (validasiIssue ? 'has-issue' : 'all-clear') + '" onclick="filterBarangPerluValidasi()">' +
      '<div><div class="notice-text">Validasi Berkala (' + siklusBulan + ' Bulan)</div>' +
      '<div class="notice-sub">' + (validasiIssue ? validasiOverdueCount + ' barang perlu dicek ulang' : 'Semua aset tervalidasi (< ' + siklusBulan + ' bln)') + '</div></div>' +
      '<div class="notice-count">' + validasiOverdueCount + '</div>' +
    '</div>';
}

function filterBarangIncomplete() {
  switchView('barang');
  const sel = document.getElementById('filter-kelengkapan');
  if (sel) sel.value = 'tidak_lengkap';
  loadBarang(1);
}

function filterBarangPerluValidasi() {
  switchView('barang');
  const sel = document.getElementById('filter-validasi');
  if (sel) sel.value = 'perlu_validasi';
  loadBarang(1);
}

// ---------------- RUANGAN (dropdown cache) ----------------
async function loadRuanganDropdownData() {
  const res = await api('listRuangan', {});
  STATE.ruanganList = res.data;
  const golSelect = document.getElementById('filter-golongan');
  // filter golongan diisi setelah referensi termuat (lihat loadReferensiDropdownData)
}
function ruanganOptions(selected) {
  return STATE.ruanganList.map(function (r) {
    return '<option value="' + r.kode_ruangan + '"' + (r.kode_ruangan === selected ? ' selected' : '') + '>' +
      r.nama_ruangan + '</option>';
  }).join('');
}
function roomName(kodeRuangan) {
  const r = STATE.ruanganList.find(function (x) { return x.kode_ruangan === kodeRuangan; });
  return r ? r.nama_ruangan : (kodeRuangan || '-');
}
function roomInstitusi(kodeRuangan) {
  const r = STATE.ruanganList.find(function (x) { return x.kode_ruangan === kodeRuangan; });
  return r ? r.institusi : '';
}

// ---------------- REFERENSI KODE (dropdown cache) ----------------
async function loadReferensiDropdownData() {
  const res = await api('listReferensiKode', {});
  STATE.referensiList = res.data;

  const golonganUnik = [...new Set(STATE.referensiList.map(function (r) { return r.golongan_barang; }))];
  const filterGol = document.getElementById('filter-golongan');
  filterGol.innerHTML = '<option value="">Semua Golongan</option>' +
    golonganUnik.map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');
}

function golonganOptions(selected) {
  const golonganUnik = [...new Set(STATE.referensiList.map(function (r) { return r.golongan_barang; }))];
  return '<option value="">-- pilih golongan --</option>' + golonganUnik.map(function (g) {
    return '<option value="' + g + '"' + (g === selected ? ' selected' : '') + '>' + g + '</option>';
  }).join('');
}

function jenisBarangOptionsForGolongan(golongan, selected) {
  const list = STATE.referensiList.filter(function (r) { return r.golongan_barang === golongan; });
  return '<option value="">-- pilih jenis barang --</option>' + list.map(function (r) {
    return '<option value="' + r.jenis_barang + '" data-kode="' + r.kode_klasifikasi + '"' +
      (r.jenis_barang === selected ? ' selected' : '') + '>' + r.jenis_barang + '</option>';
  }).join('');
}

// ---------------- BARANG ----------------
let BARANG_SORT = { col: null, asc: true };

function renderBarangTableRows() {
  const tbody = document.querySelector('#table-barang tbody');
  if (!tbody) return;

  if (!STATE.barangList || STATE.barangList.length === 0) {
    const hasActiveFilter = Boolean(
      (document.getElementById('filter-search') && document.getElementById('filter-search').value) ||
      (document.getElementById('filter-institusi') && document.getElementById('filter-institusi').value) ||
      (document.getElementById('filter-golongan') && document.getElementById('filter-golongan').value) ||
      (document.getElementById('filter-kondisi') && document.getElementById('filter-kondisi').value) ||
      (document.getElementById('filter-status') && document.getElementById('filter-status').value) ||
      (document.getElementById('filter-kelengkapan') && document.getElementById('filter-kelengkapan').value) ||
      (document.getElementById('filter-validasi') && document.getElementById('filter-validasi').value)
    );
    tbody.innerHTML =
      '<tr><td colspan="10">' +
        '<div class="empty-state-card">' +
          '<div class="empty-state-icon">' + icon('archive', 32) + '</div>' +
          '<div class="empty-state-title">Tidak ada barang yang cocok</div>' +
          '<div class="empty-state-desc">' + (hasActiveFilter ? 'Coba ubah atau bersihkan kriteria filter pencarian Anda.' : 'Belum ada data barang inventaris yang tersimpan.') + '</div>' +
          (hasActiveFilter ? '<button type="button" class="btn btn-sm btn-primary" onclick="resetBarangFilter()">' + icon('undo', 14) + '<span>Bersihkan Filter</span></button>' : '') +
        '</div>' +
      '</td></tr>';
    return;
  }

  tbody.innerHTML = STATE.barangList.map(function (b) {
    const noMerk = !b.spesifikasi || String(b.spesifikasi).trim() === '' || String(b.spesifikasi).trim() === '-';
    const noHarga = !b.harga || Number(b.harga) === 0;

    let badgeKelengkapan = '';
    if (noMerk && noHarga) {
      badgeKelengkapan = ' <span class="badge badge-warning" title="Merk/Spesifikasi & Harga perolehan belum diisi">Spek & Harga Kosong</span>';
    } else if (noMerk) {
      badgeKelengkapan = ' <span class="badge badge-warning" title="Merk/Spesifikasi belum diisi">Belum Ada Merk</span>';
    } else if (noHarga) {
      badgeKelengkapan = ' <span class="badge badge-warning" title="Harga perolehan belum diisi">Harga Rp 0</span>';
    }

    let badgeValidasi = '';
    if (b.is_overdue) {
      const hari = b.hari_sejak_validasi || 0;
      badgeValidasi = ' <span class="badge badge-overdue" title="Terakhir divalidasi: ' + fmtDate(b.terakhir_divalidasi) + ' (' + hari + ' hari lalu)">Perlu Validasi</span>';
    } else {
      badgeValidasi = ' <span class="badge badge-valid" title="Terakhir divalidasi: ' + fmtDate(b.terakhir_divalidasi) + '">Tervalidasi</span>';
    }

    const spekText = noMerk
      ? '<span style="color:#d97706;font-style:italic;font-size:11.5px;">(Merk/spek belum diisi)</span>'
      : '<span style="color:#64748b;font-size:11.5px;">' + escapeHtml(b.spesifikasi) + '</span>';

    const hargaText = noHarga
      ? '<span style="color:#d97706;font-weight:600;font-size:11.5px;">Rp 0 (Belum diisi)</span>'
      : rupiah(b.harga);

    return '<tr>' +
      '<td class="mono">' + b.nomor_inventaris + '</td>' +
      '<td><strong>' + escapeHtml(b.jenis_barang) + '</strong>' + badgeKelengkapan + badgeValidasi + '<br>' + spekText + '</td>' +
      '<td>' + (b.golongan_barang || '-') + '</td>' +
      '<td>' + badge(roomInstitusi(b.kode_ruangan)) + '</td>' +
      '<td>' + roomName(b.kode_ruangan) + '</td>' +
      '<td>' + badge(b.kondisi) + '</td>' +
      '<td>' + badge(b.status) + '</td>' +
      '<td class="col-wide">' + b.tahun_perolehan + '</td>' +
      '<td class="col-wide">' + hargaText + '</td>' +
      '<td class="row-actions">' +
        (STATE.user.role !== 'keuangan' ? '<button data-tooltip="Ubah" onclick="editBarang(\'' + b.nomor_inventaris + '\')">' + icon('edit') + '</button>' : '') +
        (STATE.user.role !== 'keuangan' ? '<button data-tooltip="Validasi Ulang Fisik Hari Ini (Reset Siklus 3 Bulan)" onclick="validasiBarangSingle(\'' + b.nomor_inventaris + '\')">' + icon('check') + '</button>' : '') +
        '<button data-tooltip="Cetak KIB" onclick="printKIB(\'' + b.nomor_inventaris + '\')">' + icon('printer') + '</button>' +
        (FEATURE_LABEL_STICKER ? '<button data-tooltip="Cetak Label Stiker" onclick="printLabelSticker(\'' + b.nomor_inventaris + '\')">' + icon('tag') + '</button>' : '') +
        (STATE.user.role === 'admin' ? '<button data-tooltip="Hapus Draf" onclick="hapusBarangDraft(\'' + b.nomor_inventaris + '\')">' + icon('trash') + '</button>' : '') +
      '</td></tr>';
  }).join('');
}

function sortBarangColumn(col, preserveDir) {
  if (!preserveDir) {
    if (BARANG_SORT.col === col) {
      BARANG_SORT.asc = !BARANG_SORT.asc;
    } else {
      BARANG_SORT.col = col;
      BARANG_SORT.asc = true;
    }
  }

  ['nomor_inventaris', 'jenis_barang', 'golongan_barang', 'kode_ruangan', 'kondisi', 'status', 'tahun_perolehan', 'harga'].forEach(function (c) {
    const iconEl = document.getElementById('sort-' + c);
    if (!iconEl) return;
    if (c === BARANG_SORT.col) {
      iconEl.textContent = BARANG_SORT.asc ? '▲' : '▼';
      iconEl.classList.add('active');
    } else {
      iconEl.textContent = '↕';
      iconEl.classList.remove('active');
    }
  });

  if (!STATE.barangList || STATE.barangList.length === 0) return;

  STATE.barangList.sort(function (a, b) {
    let valA = a[col] || '';
    let valB = b[col] || '';
    if (col === 'harga' || col === 'tahun_perolehan') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    } else if (col === 'kode_ruangan') {
      valA = roomName(valA).toLowerCase();
      valB = roomName(valB).toLowerCase();
    } else {
      valA = String(valA).toLowerCase();
      valB = String(valB).toLowerCase();
    }

    if (valA < valB) return BARANG_SORT.asc ? -1 : 1;
    if (valA > valB) return BARANG_SORT.asc ? 1 : -1;
    return 0;
  });

  renderBarangTableRows();
}

function resetBarangFilter() {
  ['filter-search', 'filter-institusi', 'filter-golongan', 'filter-kondisi', 'filter-status', 'filter-kelengkapan', 'filter-validasi'].forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  loadBarang(1);
}

function exportBarangCsv() {
  if (!STATE.barangList || STATE.barangList.length === 0) {
    toast('Tidak ada data barang untuk diekspor.', true);
    return;
  }
  const headers = ['Nomor Inventaris', 'Jenis Barang', 'Spesifikasi/Merk', 'Golongan', 'Institusi', 'Ruangan', 'Kondisi', 'Status', 'Tahun Perolehan', 'Harga Perolehan (Rp)', 'Sumber Dana'];
  const rows = STATE.barangList.map(function (b) {
    return [
      b.nomor_inventaris || '',
      b.jenis_barang || '',
      b.spesifikasi || '',
      b.golongan_barang || '',
      roomInstitusi(b.kode_ruangan) || '',
      roomName(b.kode_ruangan) || '',
      b.kondisi || '',
      b.status || '',
      b.tahun_perolehan || '',
      b.harga || 0,
      b.sumber_dana || ''
    ].map(function (val) {
      const s = String(val).replace(/"/g, '""');
      return '"' + s + '"';
    }).join(',');
  });

  const csvContent = '\uFEFF' + headers.map(function (h) { return '"' + h + '"'; }).join(',') + '\n' + rows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const today = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = 'SIDAFI_Data_Barang_' + today + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Data barang berhasil diekspor ke CSV.');
}

async function loadBarang(page) {
  showTableLoading('#table-barang tbody', 10);
  const filterKel = document.getElementById('filter-kelengkapan');
  const filterVal = document.getElementById('filter-validasi');
  const payload = {
    page: page || 1,
    pageSize: 20,
    search: document.getElementById('filter-search').value,
    institusi: document.getElementById('filter-institusi').value,
    golongan_barang: document.getElementById('filter-golongan').value,
    kondisi: document.getElementById('filter-kondisi').value,
    status: document.getElementById('filter-status').value,
    kelengkapan: filterKel ? filterKel.value : '',
    status_validasi: filterVal ? filterVal.value : ''
  };
  try {
    const res = await api('listBarang', payload);
    STATE.barangList = res.data;
    STATE.barangPage = payload.page;

    const hasActiveFilter = Boolean(
      payload.search || payload.institusi || payload.golongan_barang ||
      payload.kondisi || payload.status || payload.kelengkapan || payload.status_validasi
    );
    const btnReset = document.getElementById('btn-reset-barang-filter');
    if (btnReset) {
      btnReset.classList.toggle('hidden', !hasActiveFilter);
    }
    const resultCountEl = document.getElementById('barang-result-count');
    if (resultCountEl) {
      resultCountEl.innerHTML = 'Menampilkan <strong>' + res.data.length + '</strong> dari <strong>' + (res.total || 0) + '</strong> barang' + (hasActiveFilter ? ' <span style="color:var(--primary);font-weight:600;">(terfilter)</span>' : '');
    }

    if (BARANG_SORT.col) {
      sortBarangColumn(BARANG_SORT.col, true);
    } else {
      renderBarangTableRows();
    }

    const totalPages = Math.max(1, Math.ceil(res.total / res.pageSize));
    document.getElementById('pagination-barang').innerHTML = buildPagination(payload.page, totalPages, 'loadBarang');
  } catch (err) {
    toast(err.message, true);
    const tbody = document.querySelector('#table-barang tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;color:#ef4444;padding:24px;">Gagal memuat data barang: ' + escapeHtml(err.message) + ' <br><button type="button" class="btn-secondary btn-sm" style="margin-top:8px;" onclick="loadBarang(' + (page || 1) + ')">' + iconLabel('undo', 'Coba Lagi') + '</button></td></tr>';
    }
  }
}

// Komponen pagination ringkas: tombol Prev/Next + nomor halaman terbatas
// (halaman pertama, halaman sekitar posisi sekarang, halaman terakhir,
// dipisah "..." kalau ada yang dilompati) supaya tidak menumpuk puluhan
// tombol saat data banyak (mis. 50 halaman).
function buildPagination(current, total, fnName) {
  if (total <= 1) return '';

  function btn(page, label, extraClass) {
    return '<button class="' + (extraClass || '') + (page === current ? ' active' : '') + '" ' +
      (page ? 'onclick="' + fnName + '(' + page + ')"' : 'disabled') + '>' + label + '</button>';
  }

  let html = '<span class="pagination-info">Halaman ' + current + ' dari ' + total + '</span>';
  html += btn(current > 1 ? current - 1 : null, '‹ Sebelumnya', 'pg-nav');

  const pages = new Set([1, total, current, current - 1, current + 1]);
  let prevPage = 0;
  Array.from(pages).filter(function (p) { return p >= 1 && p <= total; })
    .sort(function (a, b) { return a - b; })
    .forEach(function (p) {
      if (prevPage && p - prevPage > 1) html += '<span class="pg-ellipsis">…</span>';
      html += btn(p, String(p));
      prevPage = p;
    });

  html += btn(current < total ? current + 1 : null, 'Berikutnya ›', 'pg-nav');
  return html;
}
['filter-search', 'filter-institusi', 'filter-golongan', 'filter-kondisi', 'filter-status', 'filter-kelengkapan', 'filter-validasi'].forEach(function (id) {
  const el = document.getElementById(id);
  if (el) {
    el.addEventListener('input', function () { loadBarang(1); });
    el.addEventListener('change', function () { loadBarang(1); });
  }
});

/* ==============================================================
 * FITUR UPLOAD FOTO (DROPZONE) DIBEKUKAN SEMENTARA
 * Alasan: bergantung pada DriveApp yang bermasalah di beberapa akun
 * Google Workspace sekolah ("Akses ditolak: DriveApp"). Form Barang
 * untuk sementara memakai input link manual (lihat barangForm()).
 * Fungsi-fungsi di bawah ini disimpan agar mudah diaktifkan lagi
 * begitu solusi DriveApp ditemukan - tinggal panggil attachDropzone()
 * lagi di btn-new-barang/editBarang, dan kembalikan markup dropzone
 * di barangForm().
 *
function dropzoneInnerHtml(url) {
  if (url) {
    return '<img class="dz-preview" src="' + url + '" onerror="this.style.display=\'none\'">' +
      '<div class="dz-filename">Foto tersimpan</div>' +
      '<span class="dz-remove" onclick="event.stopPropagation(); clearDropzone(this)">Hapus foto</span>';
  }
  return '<div class="dz-text">Klik atau <strong>seret file gambar</strong> ke sini</div>';
}

function clearDropzone(removeBtn) {
  const zone = removeBtn.closest('.dropzone');
  const hidden = zone.nextElementSibling;
  hidden.value = '';
  zone.innerHTML = dropzoneInnerHtml('');
}

function attachDropzone(zoneId, fileInputId, hiddenInputId, kategori) {
  const zone = document.getElementById(zoneId);
  const fileInput = document.getElementById(fileInputId);
  const hidden = document.getElementById(hiddenInputId);

  zone.addEventListener('click', function (e) {
    if (!e.target.classList.contains('dz-remove')) fileInput.click();
  });
  zone.addEventListener('dragover', function (e) { e.preventDefault(); zone.classList.add('dragover'); });
  zone.addEventListener('dragleave', function () { zone.classList.remove('dragover'); });
  zone.addEventListener('drop', function (e) {
    e.preventDefault(); zone.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleFotoFile(e.dataTransfer.files[0], zone, hidden, kategori);
  });
  fileInput.addEventListener('change', function () {
    if (fileInput.files.length) handleFotoFile(fileInput.files[0], zone, hidden, kategori);
  });
}

async function handleFotoFile(file, zone, hidden, kategori) {
  if (!file.type.startsWith('image/')) { toast('File harus berupa gambar.', true); return; }
  zone.innerHTML = '<div class="dz-text">Mengunggah...</div>';
  try {
    const base64 = await new Promise(function (resolve, reject) {
      const reader = new FileReader();
      reader.onload = function () { resolve(reader.result.split(',')[1]); };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const res = await api('uploadFoto', { base64: base64, mimeType: file.type, filename: file.name, kategori: kategori });
    hidden.value = res.url;
    zone.innerHTML = dropzoneInnerHtml(res.url);
    toast('Foto berhasil diunggah.');
  } catch (err) {
    zone.innerHTML = dropzoneInnerHtml('');
    toast(err.message, true);
  }
}
 * ============================================================== */

function barangForm(data, lockRoomCode) {
  data = data || {};
  const lockedBadge = lockRoomCode ? ' <span class="badge badge-valid" style="font-size:11px;margin-left:6px;">Terkunci di KIR</span>' : '';
  const roomFieldHtml = lockRoomCode ?
    '<label>Ruangan' + lockedBadge +
      '<select id="f-ruangan" disabled style="background:#f8fafc;cursor:not-allowed;">' + ruanganOptions(lockRoomCode) + '</select>' +
      '<input type="hidden" id="f-ruangan-locked" value="' + escapeHtml(lockRoomCode) + '">' +
    '</label>' :
    '<label>Ruangan<select id="f-ruangan">' + ruanganOptions(data.kode_ruangan) + '</select></label>';

  const cancelBtnHtml = lockRoomCode ?
    '<button type="button" class="btn-secondary" onclick="openKirEditor(\'' + escapeHtml(lockRoomCode) + '\')">' + iconLabel('xCircle', 'Kembali ke KIR') + '</button>' :
    '<button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>';

  return '<form id="form-barang">' +
    '<label>Golongan Barang<select id="f-golongan">' + golonganOptions(data.golongan_barang) + '</select></label>' +
    '<label>Jenis Barang<select id="f-jenis">' +
      (data.golongan_barang ? jenisBarangOptionsForGolongan(data.golongan_barang, data.jenis_barang) : '<option value="">-- pilih golongan dulu --</option>') +
    '</select></label>' +
    '<label>Kode Klasifikasi<input id="f-kode-klasifikasi" value="' + (data.kode_klasifikasi || '') + '" readonly style="background:#f4f4f4;"></label>' +
    (data.nomor_inventaris ? '' :
      '<label>Jumlah <span style="font-weight:400;color:#888;">(kalau beli beberapa unit sekaligus dengan spesifikasi sama)</span>' +
      '<input required type="number" min="1" id="f-jumlah" value="1"></label>') +
    '<label>Spesifikasi / Merk<input id="f-spesifikasi" value="' + (data.spesifikasi || '') + '" placeholder="Contoh: Daikin 1.5 PK"></label>' +
    '<label>Nama Satuan<input id="f-satuan" value="' + (data.nama_satuan || 'Unit') + '" placeholder="Unit, Buah, Set, dst."></label>' +
    '<label>Tahun Perolehan<input required id="f-tahun" type="number" value="' + (data.tahun_perolehan || new Date().getFullYear()) + '"></label>' +
    '<label>Sumber Dana<input id="f-sumber" value="' + (data.sumber_dana || '') + '" placeholder="BOS, Yayasan, dst."></label>' +
    '<label>Harga Perolehan (Rp)<input id="f-harga" type="text" inputmode="numeric" value="' + Number(data.harga || 0).toLocaleString('id-ID') + '"></label>' +
    '<label>No. Bukti / Nota<input id="f-bukti" value="' + (data.no_bukti_nota || '') + '"></label>' +
    '<label>Kondisi<select id="f-kondisi">' +
      ['baik', 'rusak ringan', 'rusak berat'].map(function (k) {
        return '<option value="' + k + '"' + (data.kondisi === k ? ' selected' : '') + '>' + k + '</option>';
      }).join('') + '</select></label>' +
    roomFieldHtml +
    '<label>Keterangan<textarea id="f-ket">' + (data.keterangan || '') + '</textarea></label>' +
    '<div class="modal-footer">' +
      cancelBtnHtml +
      '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button>' +
    '</div></form>';
}

function bindGolonganCascade() {
  document.getElementById('f-golongan').addEventListener('change', function () {
    const jenisSelect = document.getElementById('f-jenis');
    jenisSelect.innerHTML = jenisBarangOptionsForGolongan(this.value);
    document.getElementById('f-kode-klasifikasi').value = '';
  });
  document.getElementById('f-jenis').addEventListener('change', function () {
    const opt = this.options[this.selectedIndex];
    document.getElementById('f-kode-klasifikasi').value = opt.getAttribute('data-kode') || '';
  });
}

document.getElementById('btn-new-barang').addEventListener('click', function () {
  openModal('Barang Baru', barangForm());
  bindGolonganCascade();
  attachRupiahMask(document.getElementById('f-harga'));
  bindBarangFormSubmit(null);
});

function editBarang(nomorInventaris) {
  const data = STATE.barangList.find(function (b) { return b.nomor_inventaris === nomorInventaris; });
  openModal('Ubah Barang — ' + nomorInventaris, barangForm(data));
  bindGolonganCascade();
  attachRupiahMask(document.getElementById('f-harga'));
  bindBarangFormSubmit(nomorInventaris);
}

function bindBarangFormSubmit(nomorInventaris, onSuccess) {
  document.getElementById('form-barang').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const lockedEl = document.getElementById('f-ruangan-locked');
      const kodeRuanganVal = lockedEl ? lockedEl.value : document.getElementById('f-ruangan').value;
      const res = await api('saveBarang', {
        nomor_inventaris: nomorInventaris || undefined,
        golongan_barang: document.getElementById('f-golongan').value,
        jenis_barang: document.getElementById('f-jenis').value,
        kode_klasifikasi: document.getElementById('f-kode-klasifikasi').value,
        jumlah: nomorInventaris ? undefined : document.getElementById('f-jumlah').value,
        spesifikasi: document.getElementById('f-spesifikasi').value,
        nama_satuan: document.getElementById('f-satuan').value,
        tahun_perolehan: document.getElementById('f-tahun').value,
        sumber_dana: document.getElementById('f-sumber').value,
        harga: rawNumber(document.getElementById('f-harga')),
        no_bukti_nota: document.getElementById('f-bukti').value,
        kondisi: document.getElementById('f-kondisi').value,
        kode_ruangan: kodeRuanganVal,
        keterangan: document.getElementById('f-ket').value
      });
      closeModal();
      if (res.jumlah_ditambahkan > 1) {
        toast(res.jumlah_ditambahkan + ' barang berhasil ditambahkan (' + formatNomorInventarisRanges(res.nomor_list) + ')');
      } else {
        toast('Barang berhasil disimpan.');
      }
      if (typeof onSuccess === 'function') {
        onSuccess(res);
      } else {
        loadBarang(STATE.barangPage);
      }
    } catch (err) { toast(err.message, true); }
  });
}

// Blok tanda tangan 2 kolom. Kalau nama diisi, otomatis dicetak di
// bawah kolom tanda tangan; kalau kosong, tampil garis titik-titik.
function sigBlock(label, nama) {
  return '<div class="sig-block">' + label + ',<div class="sig-space"></div>' +
    '<div class="sig-name">' + (nama ? nama : '(.....................)') + '</div></div>';
}

// Gambar kop surat resmi berbeda per institusi, dipasang sebagai
// background penuh halaman A4. Konten dokumen (judul, tabel, tanda
// tangan) dibungkus .print-content dengan padding atas/bawah yang
// disesuaikan supaya tidak menimpa header & elemen di kop surat.
const KOP_SURAT_FILE = {
  'SMP': 'assets/kop-surat-smp.png',
  'MA': 'assets/kop-surat-ma.png',
  'Pesantren': 'assets/kop-surat-pesantren.png'
};
function printBgImage(institusi) {
  const file = KOP_SURAT_FILE[institusi] || KOP_SURAT_FILE['SMP'];
  return '<img class="print-bg" src="' + file + '" alt="Kop Surat">';
}

// Jabatan pimpinan berbeda per institusi (Kepala SMP / Kepala MA / Ketua Yayasan).
const PIMPINAN_JABATAN = { 'SMP': 'Kepala SMP', 'MA': 'Kepala MA', 'Pesantren': 'Ketua Yayasan' };
function pimpinanNama(institusi) { return STATE.pengaturan[institusi + '.pimpinan_nama'] || ''; }
function penanggungJawabNama(institusi) { return STATE.pengaturan[institusi + '.penanggungjawab_nama'] || ''; }

// ---------------- PRINT PREVIEW (KIB/KIR tanpa DriveApp) ----------------
function infoRow(label, value) {
  return '<tr><td class="dl-k">' + label + '</td><td class="dl-sep">:</td><td>' + (value || '-') + '</td></tr>';
}

function showPrintPreview(html, orientation) {
  document.getElementById('print-area').innerHTML = html;
  let pageStyle = document.getElementById('dynamic-page-style');
  if (!pageStyle) {
    pageStyle = document.createElement('style');
    pageStyle.id = 'dynamic-page-style';
    document.head.appendChild(pageStyle);
  }
  pageStyle.textContent = '@page { size: A4 ' + orientation + '; margin: 0; }';
  document.getElementById('print-preview-overlay').classList.remove('hidden');
}
document.getElementById('btn-close-print').addEventListener('click', function () {
  document.getElementById('print-preview-overlay').classList.add('hidden');
});
document.getElementById('btn-print-now').addEventListener('click', function () { window.print(); });

function roomAreaRuangan(kodeRuangan) {
  const r = STATE.ruanganList.find(function (x) { return x.kode_ruangan === kodeRuangan; });
  if (!r) return kodeRuangan || '-';
  return (r.area || '-') + ' - ' + (r.nama_ruangan || '-');
}

async function printKIB(nomorInventaris) {
  try {
    const [barangRes, perawatanRes] = await Promise.all([
      api('getBarang', { nomor_inventaris: nomorInventaris }),
      api('listPerawatan', { nomor_inventaris: nomorInventaris })
    ]);
    const b = barangRes.data;
    const riwayat = perawatanRes.data;

    const rows = [
      ['Nomor Inventaris', b.nomor_inventaris],
      ['Golongan Barang', b.golongan_barang],
      ['Jenis Barang', b.jenis_barang],
      ['Merk / Spesifikasi', b.spesifikasi],
      ['Tahun Perolehan', b.tahun_perolehan],
      ['Sumber Dana', b.sumber_dana],
      ['Harga Perolehan', rupiah(b.harga)],
      ['No. Transaksi / Nota', b.no_bukti_nota],
      ['Kondisi', b.kondisi],
      ['Lokasi', roomAreaRuangan(b.kode_ruangan)],
      ['Status', b.status],
      ['Keterangan', b.keterangan]
    ];

    const riwayatTableHtml = riwayat.length
      ? '<table class="print-data-table"><thead><tr>' +
          '<th>Tanggal</th><th>Jenis Perawatan</th><th>Pelaksana</th><th>Biaya</th><th>Keterangan</th>' +
        '</tr></thead><tbody>' +
        riwayat.map(function (r) {
          return '<tr><td>' + fmtDate(r.tanggal) + '</td><td>' + r.jenis_perawatan + '</td>' +
            '<td>' + (r.pelaksana || '-') + '</td><td>' + rupiah(r.biaya) + '</td>' +
            '<td>' + (r.keterangan || '-') + '</td></tr>';
        }).join('') + '</tbody></table>'
      : '<div class="print-empty-note">Belum ada riwayat perawatan untuk barang ini.</div>';

    const html = '<div class="print-page portrait">' + printBgImage(b.institusi) +
      '<div class="print-content">' +
      '<div class="print-title">KARTU INVENTARIS BARANG (KIB)</div>' +
      '<table class="print-info-table">' + rows.map(function (r, i) {
        return infoRow((i + 1) + '. ' + r[0], r[1]);
      }).join('') + '</table>' +
      '<div class="print-subtitle">13. Tabel Riwayat Perawatan</div>' +
      riwayatTableHtml +
      '<div class="print-date">Dicetak: ' + new Date().toLocaleDateString('id-ID') + '</div>' +
      '<div class="print-signature">' +
        sigBlock('Mengetahui,<br>' + (PIMPINAN_JABATAN[b.institusi] || 'Pimpinan'), pimpinanNama(b.institusi)) +
        sigBlock('Penanggung Jawab', penanggungJawabNama(b.institusi)) +
      '</div></div></div>';
    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

// ---------------- PEMINJAMAN ----------------
let PEMINJAMAN_CACHE = [];
async function loadPeminjaman() {
  showTableLoading('#table-peminjaman tbody', 8);
  const res = await api('listPeminjaman', {});
  PEMINJAMAN_CACHE = res.data;
  document.querySelector('#table-peminjaman tbody').innerHTML = res.data.map(function (p) {
    return '<tr>' +
      '<td class="item-name-cell">' + p.jenis_barang + '<span class="item-sub">' + p.nomor_inventaris + '</span></td>' +
      '<td>' + p.nama_peminjam + '</td><td>' + (p.keperluan || '-') + '</td>' +
      '<td>' + fmtDate(p.tanggal_pinjam) + '</td>' +
      '<td class="col-wide">' + roomName(p.ruangan_tujuan) + '</td>' +
      '<td class="col-wide">' + fmtDate(p.rencana_kembali) + '</td>' +
      '<td class="col-wide">' + badge(p.status) + '</td>' +
      '<td class="row-actions">' +
        '<button data-tooltip="Detail" onclick="detailPeminjaman(\'' + p.id_pinjam + '\')">' + icon('eye') + '</button>' +
        '<button data-tooltip="Cetak Surat Bukti Pinjam" onclick="printSuratPeminjaman(\'' + p.id_pinjam + '\')">' + icon('printer') + '</button>' +
      '</td></tr>';
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function detailPeminjaman(id) {
  const p = PEMINJAMAN_CACHE.find(function (x) { return x.id_pinjam === id; });
  if (!p) return;
  const rows = [
    ['ID Peminjaman', p.id_pinjam],
    ['Nomor Inventaris', p.nomor_inventaris],
    ['Jenis Barang', p.jenis_barang + (p.spesifikasi ? ' — ' + p.spesifikasi : '')],
    ['Nama Peminjam', p.nama_peminjam],
    ['Keperluan', p.keperluan || '-'],
    ['Ruangan Asal', roomName(p.ruangan_asal)],
    ['Ruangan Tujuan', roomName(p.ruangan_tujuan)],
    ['Tanggal Pinjam', fmtDate(p.tanggal_pinjam)],
    ['Rencana Kembali', fmtDate(p.rencana_kembali)],
    ['Tanggal Kembali Aktual', fmtDate(p.tanggal_kembali_aktual)],
    ['Kondisi Saat Pinjam', p.kondisi_saat_pinjam],
    ['Kondisi Saat Kembali', p.kondisi_saat_kembali || '-'],
    ['Status', p.status],
    ['Dicatat Oleh', p.dicatat_oleh]
  ];
  const detailHtml = '<div class="detail-list">' + rows.map(function (r) {
    return '<div class="detail-row"><span class="dl-label">' + r[0] + '</span><span class="dl-value">' + r[1] + '</span></div>';
  }).join('') + '</div>' +
  '<div class="modal-footer">' +
    '<button class="btn-secondary" onclick="printSuratPeminjaman(\'' + p.id_pinjam + '\')">' + iconLabel('printer', 'Cetak Surat Bukti Pinjam') + '</button>' +
    (p.status === 'dipinjam' && STATE.user.role !== 'keuangan' ? '<button class="btn-primary" onclick="closeModal(); kembalikanPinjam(\'' + p.id_pinjam + '\')">' + iconLabel('undo', 'Kembalikan Barang') + '</button>' : '') +
  '</div>';
  openModal('Detail Peminjaman', detailHtml);
}

document.getElementById('btn-new-peminjaman').addEventListener('click', function () {
  openModal('Ajukan Peminjaman', '<form id="form-pinjam">' +
    '<label>Nomor Inventaris<input required id="p-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Nama Peminjam<input required id="p-nama"></label>' +
    '<label>Keperluan<input id="p-keperluan" placeholder="Contoh: Mengajar PAI Kelas 7A"></label>' +
    '<label>Ruangan Tujuan<select id="p-tujuan">' + ruanganOptions() + '</select></label>' +
    '<label>Rencana Kembali<input type="date" id="p-rencana"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Ajukan') + '</button></div></form>');
  attachNomorInventarisMask(document.getElementById('p-kode'));

  document.getElementById('form-pinjam').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('ajukanPeminjaman', {
        nomor_inventaris: document.getElementById('p-kode').value,
        nama_peminjam: document.getElementById('p-nama').value,
        keperluan: document.getElementById('p-keperluan').value,
        ruangan_tujuan: document.getElementById('p-tujuan').value,
        rencana_kembali: document.getElementById('p-rencana').value
      });
      closeModal(); toast('Peminjaman berhasil diajukan.'); loadPeminjaman();
    } catch (err) { toast(err.message, true); }
  });
});

async function kembalikanPinjam(id) {
  openModal('Kembalikan Barang', '<form id="form-kembali">' +
    '<label>Kondisi Saat Kembali<select id="k-kondisi">' +
    '<option value="baik">Baik</option><option value="rusak ringan">Rusak Ringan</option><option value="rusak berat">Rusak Berat</option>' +
    '</select></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>');

  document.getElementById('form-kembali').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('kembalikanPeminjaman', { id_pinjam: id, kondisi_saat_kembali: document.getElementById('k-kondisi').value });
      closeModal(); toast('Barang berhasil dikembalikan.'); loadPeminjaman();
    } catch (err) { toast(err.message, true); }
  });
}

// ---------------- KERUSAKAN ----------------
let KERUSAKAN_CACHE = [];
async function loadKerusakan() {
  showTableLoading('#table-kerusakan tbody', 7);
  const res = await api('listKerusakan', {});
  KERUSAKAN_CACHE = res.data;
  document.querySelector('#table-kerusakan tbody').innerHTML = res.data.map(function (k) {
    return '<tr>' +
      '<td class="item-name-cell">' + k.jenis_barang + '<span class="item-sub">' + k.nomor_inventaris + '</span></td>' +
      '<td>' + roomName(k.kode_ruangan_barang) + '</td>' +
      '<td>' + fmtDate(k.tanggal_lapor) + '</td>' +
      '<td class="col-wide">' + k.pelapor + '</td>' +
      '<td class="col-wide">' + badge(k.tingkat_kerusakan) + '</td>' +
      '<td>' + badge(k.status_penanganan) + '</td>' +
      '<td class="row-actions"><button data-tooltip="Detail" onclick="detailKerusakan(\'' + k.id_lapor + '\')">' + icon('eye') + '</button></td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function detailKerusakan(id) {
  const k = KERUSAKAN_CACHE.find(function (x) { return x.id_lapor === id; });
  if (!k) return;
  const rows = [
    ['ID Laporan', k.id_lapor],
    ['Nomor Inventaris', k.nomor_inventaris],
    ['Jenis Barang', k.jenis_barang + (k.spesifikasi ? ' — ' + k.spesifikasi : '')],
    ['Ruangan', roomName(k.kode_ruangan_barang)],
    ['Tanggal Lapor', fmtDate(k.tanggal_lapor)],
    ['Pelapor', k.pelapor],
    ['Deskripsi', k.deskripsi],
    ['Tingkat Kerusakan', k.tingkat_kerusakan],
    ['Status Penanganan', k.status_penanganan],
    ['Tindak Lanjut', k.tindak_lanjut || '-'],
    ['Tanggal Selesai', fmtDate(k.tanggal_selesai)]
  ];
  const detailHtml = '<div class="detail-list">' + rows.map(function (r) {
    return '<div class="detail-row"><span class="dl-label">' + r[0] + '</span><span class="dl-value">' + r[1] + '</span></div>';
  }).join('') + '</div>' +
  (k.status_penanganan !== 'selesai' && STATE.user.role !== 'keuangan' ? '<div class="modal-footer"><button class="btn-primary" onclick="closeModal(); prosesKerusakan(\'' + k.id_lapor + '\')">' + iconLabel('check', 'Proses / Selesaikan') + '</button></div>' : '');
  openModal('Detail Kerusakan', detailHtml);
}

document.getElementById('btn-new-kerusakan').addEventListener('click', function () {
  openModal('Lapor Kerusakan', '<form id="form-rusak">' +
    '<label>Nomor Inventaris<input required id="r-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Tingkat Kerusakan<select id="r-tingkat"><option value="ringan">Ringan</option><option value="berat">Berat</option></select></label>' +
    '<label>Deskripsi<textarea required id="r-deskripsi"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Laporkan') + '</button></div></form>');
  attachNomorInventarisMask(document.getElementById('r-kode'));

  document.getElementById('form-rusak').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('laporKerusakan', {
        nomor_inventaris: document.getElementById('r-kode').value,
        tingkat_kerusakan: document.getElementById('r-tingkat').value,
        deskripsi: document.getElementById('r-deskripsi').value
      });
      closeModal(); toast('Kerusakan berhasil dilaporkan.'); loadKerusakan();
    } catch (err) { toast(err.message, true); }
  });
});

function prosesKerusakan(id) {
  openModal('Tindak Lanjut Kerusakan', '<form id="form-proses">' +
    '<label>Status<select id="pr-status"><option value="diproses">Diproses</option><option value="selesai">Selesai</option></select></label>' +
    '<label>Tindak Lanjut<textarea id="pr-tindak"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>');

  document.getElementById('form-proses').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('updateKerusakan', {
        id_lapor: id,
        status_penanganan: document.getElementById('pr-status').value,
        tindak_lanjut: document.getElementById('pr-tindak').value
      });
      closeModal(); toast('Status kerusakan diperbarui.'); loadKerusakan();
    } catch (err) { toast(err.message, true); }
  });
}

// ---------------- PERAWATAN ----------------
let PERAWATAN_CACHE = [];
async function loadPerawatan() {
  showTableLoading('#table-perawatan tbody', 7);
  const res = await api('listPerawatan', {});
  PERAWATAN_CACHE = res.data;
  document.querySelector('#table-perawatan tbody').innerHTML = res.data.map(function (p) {
    return '<tr>' +
      '<td class="item-name-cell">' + p.jenis_barang + '<span class="item-sub">' + p.nomor_inventaris + '</span></td>' +
      '<td>' + roomName(p.kode_ruangan_barang) + '</td>' +
      '<td>' + fmtDate(p.tanggal) + '</td><td>' + p.jenis_perawatan + '</td>' +
      '<td class="col-wide">' + (p.pelaksana || '-') + '</td>' +
      '<td class="col-wide">' + rupiah(p.biaya) + '</td>' +
      '<td class="row-actions"><button data-tooltip="Detail" onclick="detailPerawatan(\'' + p.id_rawat + '\')">' + icon('eye') + '</button></td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function detailPerawatan(id) {
  const p = PERAWATAN_CACHE.find(function (x) { return x.id_rawat === id; });
  if (!p) return;
  const rows = [
    ['ID Perawatan', p.id_rawat],
    ['Nomor Inventaris', p.nomor_inventaris],
    ['Jenis Barang', p.jenis_barang + (p.spesifikasi ? ' — ' + p.spesifikasi : '')],
    ['Ruangan', roomName(p.kode_ruangan_barang)],
    ['Tanggal', fmtDate(p.tanggal)],
    ['Jenis Perawatan', p.jenis_perawatan],
    ['Pelaksana', p.pelaksana || '-'],
    ['Biaya', rupiah(p.biaya)],
    ['Keterangan', p.keterangan || '-']
  ];
  openModal('Detail Perawatan', '<div class="detail-list">' + rows.map(function (r) {
    return '<div class="detail-row"><span class="dl-label">' + r[0] + '</span><span class="dl-value">' + r[1] + '</span></div>';
  }).join('') + '</div>');
}

document.getElementById('btn-new-perawatan').addEventListener('click', function () {
  openModal('Catat Perawatan', '<form id="form-rawat">' +
    '<label>Nomor Inventaris<input required id="w-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Jenis Perawatan<input required id="w-jenis" placeholder="Servis rutin, pembersihan, dll."></label>' +
    '<label>Pelaksana<input id="w-pelaksana"></label>' +
    '<label>Biaya (Rp)<input id="w-biaya" type="text" inputmode="numeric" value="0"></label>' +
    '<label>Kondisi Setelah Perawatan<select id="w-kondisi">' +
    '<option value="">-- tidak berubah --</option><option value="baik">Baik</option>' +
    '<option value="rusak ringan">Rusak Ringan</option></select></label>' +
    '<label>Keterangan<textarea id="w-ket"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>');
  attachNomorInventarisMask(document.getElementById('w-kode'));
  attachRupiahMask(document.getElementById('w-biaya'));

  document.getElementById('form-rawat').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('catatPerawatan', {
        nomor_inventaris: document.getElementById('w-kode').value,
        jenis_perawatan: document.getElementById('w-jenis').value,
        pelaksana: document.getElementById('w-pelaksana').value,
        biaya: rawNumber(document.getElementById('w-biaya')),
        kondisi_setelah: document.getElementById('w-kondisi').value,
        keterangan: document.getElementById('w-ket').value
      });
      closeModal(); toast('Perawatan berhasil dicatat.'); loadPerawatan();
    } catch (err) { toast(err.message, true); }
  });
});

// ---------------- PENGHAPUSAN ----------------
const KATEGORI_PENGHAPUSAN = ['Rusak Berat', 'Rusak Ringan', 'Hilang', 'Usang', 'Habis Pakai', 'Dihibahkan'];
let PENGHAPUSAN_CACHE = [];

async function loadPenghapusan() {
  showTableLoading('#table-penghapusan tbody', 7);
  const res = await api('listPenghapusan', {});
  PENGHAPUSAN_CACHE = res.data;
  document.querySelector('#table-penghapusan tbody').innerHTML = res.data.map(function (p) {
    return '<tr>' +
      '<td class="item-name-cell">' + p.jenis_barang + '<span class="item-sub">' + p.nomor_inventaris + '</span></td>' +
      '<td>' + badge(p.kategori) + '</td>' +
      '<td>' + fmtDate(p.tanggal_usulan) + '</td>' +
      '<td class="col-wide">' + p.diusulkan_oleh + '</td>' +
      '<td class="col-wide">' + (p.disetujui_oleh || '-') + '</td>' +
      '<td>' + badge(p.status) + '</td>' +
      '<td class="row-actions">' +
        '<button data-tooltip="Detail" onclick="detailPenghapusan(\'' + p.id_hapus + '\')">' + icon('eye') + '</button>' +
        (p.status === 'disetujui' ? '<button data-tooltip="Cetak Berita Acara Pemusnahan (BAP)" onclick="printBAP(\'' + p.id_hapus + '\')">' + icon('printer') + '</button>' : '') +
      '</td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function detailPenghapusan(id) {
  const p = PENGHAPUSAN_CACHE.find(function (x) { return x.id_hapus === id; });
  if (!p) return;
  const isApprover = STATE.user.role === 'admin' ||
    (STATE.user.role === 'kepala_sekolah' && STATE.user.institusi === p.institusi);
  const rows = [
    ['ID Penghapusan', p.id_hapus],
    ['Nomor Inventaris', p.nomor_inventaris],
    ['Jenis Barang', p.jenis_barang + (p.spesifikasi ? ' — ' + p.spesifikasi : '')],
    ['Institusi', p.institusi || '-'],
    ['Tanggal Usulan', fmtDate(p.tanggal_usulan)],
    ['Diusulkan Oleh', p.diusulkan_oleh],
    ['Kategori', p.kategori],
    ['Alasan', p.alasan],
    ['Status', p.status],
    ['Disetujui/Ditolak Oleh', p.disetujui_oleh || '-'],
    ['Tanggal Keputusan', fmtDate(p.tanggal_keputusan)],
    ['Nomor BA', p.nomor_ba || '-'],
    ['Keterangan', p.keterangan || '-']
  ];
  let footerHtml = '';
  if (p.status === 'diusulkan' && isApprover) {
    footerHtml = '<div class="modal-footer">' +
      '<button class="btn-secondary" onclick="closeModal(); putuskanHapus(\'' + p.id_hapus + '\',\'ditolak\')">' + iconLabel('xCircle', 'Tolak') + '</button>' +
      '<button class="btn-primary" onclick="closeModal(); putuskanHapus(\'' + p.id_hapus + '\',\'disetujui\')">' + iconLabel('check', 'Setujui') + '</button>' +
    '</div>';
  } else if (p.status === 'disetujui') {
    footerHtml = '<div class="modal-footer">' +
      '<button class="btn-primary" onclick="printBAP(\'' + p.id_hapus + '\')">' + iconLabel('printer', 'Cetak Berita Acara Pemusnahan (BAP)') + '</button>' +
    '</div>';
  }
  const detailHtml = '<div class="detail-list">' + rows.map(function (r) {
    return '<div class="detail-row"><span class="dl-label">' + r[0] + '</span><span class="dl-value">' + r[1] + '</span></div>';
  }).join('') + '</div>' + footerHtml;
  openModal('Detail Penghapusan', detailHtml);
}

document.getElementById('btn-new-penghapusan').addEventListener('click', function () {
  openModal('Ajukan Penghapusan Barang', '<form id="form-hapus">' +
    '<label>Nomor Inventaris<input required id="h-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Kategori<select id="h-kategori">' +
      KATEGORI_PENGHAPUSAN.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') +
    '</select></label>' +
    '<label>Alasan Penghapusan<textarea required id="h-alasan" placeholder="Rusak berat & tidak ekonomis diperbaiki, dst."></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Ajukan') + '</button></div></form>');
  attachNomorInventarisMask(document.getElementById('h-kode'));

  document.getElementById('form-hapus').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('ajukanPenghapusan', {
        nomor_inventaris: document.getElementById('h-kode').value,
        kategori: document.getElementById('h-kategori').value,
        alasan: document.getElementById('h-alasan').value
      });
      closeModal(); toast('Usulan penghapusan berhasil diajukan.'); loadPenghapusan();
    } catch (err) { toast(err.message, true); }
  });
});

function putuskanHapus(id, status) {
  const label = status === 'disetujui' ? 'Setujui' : 'Tolak';
  const iconName = status === 'disetujui' ? 'check' : 'xCircle';
  openModal(label + ' Penghapusan', '<form id="form-putus">' +
    (status === 'disetujui' ? '<label>Nomor Berita Acara<input id="d-ba"></label>' : '') +
    '<label>Catatan<textarea id="d-ket"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel(iconName, label) + '</button></div></form>');

  document.getElementById('form-putus').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('putuskanPenghapusan', {
        id_hapus: id, status: status,
        nomor_ba: document.getElementById('d-ba') ? document.getElementById('d-ba').value : '',
        keterangan: document.getElementById('d-ket').value
      });
      closeModal(); toast('Keputusan penghapusan tersimpan.'); loadPenghapusan();
    } catch (err) { toast(err.message, true); }
  });
}

// ---------------- RUANGAN ----------------
async function loadRuangan() {
  showTableLoading('#table-ruangan tbody', 7);
  try {
    const res = await api('listRuangan', {});
    STATE.ruanganList = res.data;

    const filterInst = document.getElementById('filter-ruangan-institusi');
    if (!filterInst.dataset.filled) {
      filterInst.innerHTML = '<option value="">Semua Institusi</option>' +
        INSTITUSI_LIST.map(function (i) { return '<option value="' + i + '">' + i + '</option>'; }).join('');
      filterInst.dataset.filled = '1';
    }
    renderRuanganTable();
  } catch (err) {
    toast(err.message, true);
    const tbody = document.querySelector('#table-ruangan tbody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:20px;">Gagal memuat data ruangan: ' + escapeHtml(err.message) + '</td></tr>';
    }
  }
}

function openDetailRuangan(kode) {
  switchView('ruangan');
  const input = document.getElementById('filter-ruangan-search');
  if (input) {
    input.value = kode;
    renderRuanganTable();
  }
}

function renderRuanganTable() {
  const search = document.getElementById('filter-ruangan-search').value.toLowerCase();
  const institusi = document.getElementById('filter-ruangan-institusi').value;
  const filtered = STATE.ruanganList.filter(function (r) {
    if (institusi && r.institusi !== institusi) return false;
    if (search) {
      const gabungan = [r.kode_ruangan, r.nama_ruangan, r.area, r.gedung].join(' ').toLowerCase();
      if (gabungan.indexOf(search) === -1) return false;
    }
    return true;
  });
  document.querySelector('#table-ruangan tbody').innerHTML = filtered.map(function (r) {
    return '<tr><td class="mono">' + r.kode_ruangan + '</td><td>' + badge(r.institusi) + '</td><td>' + (r.area || '-') + '</td>' +
      '<td>' + (r.gedung || '-') + '</td><td>' + r.nama_ruangan + '</td><td>' + (r.penanggung_jawab || '-') + '</td>' +
      '<td class="row-actions">' +
        (STATE.user.role !== 'keuangan' ? '<button data-tooltip="Edit KIR (Detail Barang Ruangan)" onclick="openKirEditor(\'' + r.kode_ruangan + '\')">' + icon('clipboard') + '</button> ' : '') +
        (STATE.user.role === 'admin' ? '<button data-tooltip="Ubah Data Ruangan" onclick="editRuangan(\'' + r.kode_ruangan + '\')">' + icon('edit') + '</button> ' : '') +
        '<button data-tooltip="Cetak KIR" onclick="printKIR(\'' + r.kode_ruangan + '\')">' + icon('printer') + '</button>' +
        (FEATURE_LABEL_STICKER ? ' <button data-tooltip="Cetak Semua Stiker Ruangan" onclick="printBatchLabelSticker(\'' + r.kode_ruangan + '\')">' + icon('tag') + '</button>' : '') +
      '</td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Tidak ada ruangan yang cocok.</td></tr>';
}

['filter-ruangan-search', 'filter-ruangan-institusi'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', renderRuanganTable);
  document.getElementById(id).addEventListener('change', renderRuanganTable);
});

function ruanganForm(data) {
  data = data || {};
  return '<form id="form-ruangan">' +
    '<label>Kode Ruangan<input required id="ru-kode" placeholder="SR.AR.7A" value="' + (data.kode_ruangan || '') + '" ' + (data.kode_ruangan ? 'readonly style="background:#f4f4f4;"' : '') + '></label>' +
    '<label>Institusi<select required id="ru-institusi">' + institusiOptions(data.institusi) + '</select></label>' +
    '<label>Area<input id="ru-area" placeholder="Sarirogo" value="' + (data.area || '') + '"></label>' +
    '<label>Gedung<input id="ru-gedung" placeholder="Arafah" value="' + (data.gedung || '') + '"></label>' +
    '<label>Nama Ruangan<input required id="ru-nama" value="' + (data.nama_ruangan || '') + '"></label>' +
    '<label>Penanggung Jawab<input id="ru-pj" value="' + (data.penanggung_jawab || '') + '"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>';
}

function bindRuanganFormSubmit() {
  document.getElementById('form-ruangan').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('saveRuangan', {
        kode_ruangan: document.getElementById('ru-kode').value,
        institusi: document.getElementById('ru-institusi').value,
        area: document.getElementById('ru-area').value,
        gedung: document.getElementById('ru-gedung').value,
        nama_ruangan: document.getElementById('ru-nama').value,
        penanggung_jawab: document.getElementById('ru-pj').value
      });
      closeModal(); toast('Ruangan berhasil disimpan.'); loadRuangan(); loadRuanganDropdownData();
    } catch (err) { toast(err.message, true); }
  });
}

document.getElementById('btn-new-ruangan').addEventListener('click', function () {
  openModal('Ruangan Baru', ruanganForm());
  bindRuanganFormSubmit();
});

function editRuangan(kode) {
  const data = STATE.ruanganList.find(function (r) { return r.kode_ruangan === kode; });
  openModal('Ubah Ruangan — ' + kode, ruanganForm(data));
  bindRuanganFormSubmit();
}

async function printKIR(kode) {
  try {
    const ruangan = STATE.ruanganList.find(function (r) { return r.kode_ruangan === kode; });
    const res = await api('listBarang', { kode_ruangan: kode, pageSize: 9999, status: '' });
    const items = res.data.filter(function (b) { return b.status !== 'dihapus'; });

    // Kelompokkan per (Jenis Barang + Spesifikasi) supaya barang sejenis
    // (mis. 20 kursi peserta didik) tampil sebagai satu baris dengan jumlah,
    // bukan diulang satu-satu per nomor inventaris.
    const groups = {};
    const groupOrder = [];
    items.forEach(function (b) {
      const key = b.jenis_barang + '|' + (b.spesifikasi || '');
      if (!groups[key]) {
        groups[key] = { jenis_barang: b.jenis_barang, spesifikasi: b.spesifikasi, satuan: b.nama_satuan, kondisi: {}, nomorList: [] };
        groupOrder.push(key);
      }
      const kondisi = b.kondisi || 'baik';
      groups[key].kondisi[kondisi] = (groups[key].kondisi[kondisi] || 0) + 1;
      groups[key].nomorList.push(b.nomor_inventaris);
    });

    const KONDISI_LABEL = { 'baik': 'Baik', 'rusak ringan': 'Rusak Ringan', 'rusak berat': 'Rusak Berat' };
    function formatKondisi(kondisiMap) {
      const keys = Object.keys(kondisiMap);
      if (keys.length === 1) return (KONDISI_LABEL[keys[0]] || keys[0]);
      return keys.map(function (k) { return (KONDISI_LABEL[k] || k) + ': ' + kondisiMap[k]; }).join(', ');
    }

    const bodyRows = groupOrder.map(function (key, idx) {
      const g = groups[key];
      const jumlah = Object.values(g.kondisi).reduce(function (a, b) { return a + b; }, 0);
      const namaBarang = g.jenis_barang + (g.spesifikasi ? ' — ' + g.spesifikasi : '');
      return '<tr><td>' + (idx + 1) + '</td><td class="mono" style="font-size:9px;">' + formatNomorInventarisRanges(g.nomorList) + '</td>' +
        '<td>' + namaBarang + '</td>' +
        '<td>' + jumlah + ' ' + (g.satuan || 'unit') + '</td>' +
        '<td>' + formatKondisi(g.kondisi) + '</td></tr>';
    }).join('') || '<tr><td colspan="5" style="text-align:center;">Belum ada barang di ruangan ini.</td></tr>';

    const institusiRuangan = ruangan ? ruangan.institusi : '';
    const html = '<div class="print-page portrait">' + printBgImage(institusiRuangan) +
      '<div class="print-content">' +
      '<div class="print-title">KARTU INVENTARIS RUANGAN (KIR)</div>' +
      '<table class="print-info-table">' +
        infoRow('1. Nama Ruangan', (ruangan ? ruangan.nama_ruangan : kode)) +
        infoRow('2. Penanggungjawab Ruangan', (ruangan ? ruangan.penanggung_jawab : '-')) +
      '</table>' +
      '<div class="print-subtitle">3. Tabel Inventaris</div>' +
      '<table class="print-data-table"><thead><tr>' +
        '<th>No.</th><th>Nomor Inventaris</th><th>Nama Barang</th><th>Jumlah</th><th>Kondisi</th>' +
      '</tr></thead><tbody>' + bodyRows + '</tbody></table>' +
      '<div class="print-date">Dicetak: ' + new Date().toLocaleDateString('id-ID') + '</div>' +
      '<div class="print-signature">' +
        sigBlock('Mengetahui,<br>' + (PIMPINAN_JABATAN[institusiRuangan] || 'Pimpinan'), pimpinanNama(institusiRuangan)) +
        sigBlock('Penanggung Jawab', penanggungJawabNama(institusiRuangan)) +
      '</div></div></div>';
    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

// ============================================================
// MODUL EDITOR DETAIL BARANG RUANGAN (KARTU INVENTARIS RUANGAN / KIR)
// Memungkinkan pengeditan spesifikasi, kondisi, harga, sumber dana,
// status, dan catatan seluruh barang dalam satu ruangan sekaligus.
// ============================================================

function openSelectRoomForKirEditor() {
  const options = (STATE.ruanganList || []).map(function (r) {
    return '<option value="' + r.kode_ruangan + '">' + r.kode_ruangan + ' — ' + r.nama_ruangan + ' (' + r.institusi + ')</option>';
  }).join('');

  const html = '<div style="display:flex;flex-direction:column;gap:14px;">' +
    '<p style="margin:0;font-size:13.5px;color:#475569;">Pilih ruangan yang ingin Anda tinjau dan edit detail barangnya dalam format Kartu Inventaris Ruangan (KIR):</p>' +
    '<label style="font-weight:600;font-size:13px;display:block;">Ruangan Target' +
      '<select id="select-kir-target-room" style="margin-top:6px;padding:9px 12px;font-size:13.5px;width:100%;border:1px solid var(--border);border-radius:var(--radius);">' + options + '</select>' +
    '</label>' +
    '<div class="modal-footer" style="margin-top:8px;">' +
      '<button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
      '<button type="button" class="btn-primary" onclick="proceedToKirEditor()">Buka Editor KIR Ruangan</button>' +
    '</div>' +
  '</div>';

  openModal('Pilih Ruangan untuk Edit KIR', html);
}

function proceedToKirEditor() {
  const sel = document.getElementById('select-kir-target-room');
  if (!sel || !sel.value) return;
  const kode = sel.value;
  closeModal();
  openKirEditor(kode);
}

async function openKirEditor(kodeRuangan) {
  try {
    const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
    const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;
    const pjRuangan = ruangan ? (ruangan.penanggung_jawab || '-') : '-';
    const instRuangan = ruangan ? (ruangan.institusi || '-') : '-';
    const lokasiRuangan = ruangan ? [ruangan.area, ruangan.gedung].filter(Boolean).join(' • ') : '-';

    openModal('Memuat KIR Ruangan...', '<div style="text-align:center;padding:40px;color:#64748b;">Mengambil data barang untuk ruangan <strong>' + escapeHtml(namaRuangan) + '</strong>...</div>', 'modal-xl');

    const res = await api('listBarang', { kode_ruangan: kodeRuangan, pageSize: 9999, status: '' });
    const items = (res.data || []).filter(function (b) { return b.status !== 'dihapus'; });

    // Analisis kelengkapan data & status validasi 3 bulan di ruangan ini
    let missingMerkCount = 0;
    let missingHargaCount = 0;
    let incompleteTotal = 0;
    let overdueInRoom = 0;

    items.forEach(function (b) {
      const noMerk = !b.spesifikasi || String(b.spesifikasi).trim() === '' || String(b.spesifikasi).trim() === '-';
      const noHarga = !b.harga || Number(b.harga) === 0;
      if (noMerk) missingMerkCount++;
      if (noHarga) missingHargaCount++;
      if (noMerk || noHarga) incompleteTotal++;
      if (b.is_overdue) overdueInRoom++;
    });

    let auditBadgeHtml = '';
    if (incompleteTotal > 0) {
      auditBadgeHtml = '<div class="kir-audit-badge alert" id="kir-audit-badge-status">' + icon('alertTriangle') +
        ' <span>' + incompleteTotal + ' dari ' + items.length + ' barang belum lengkap (' +
        missingMerkCount + ' tanpa merk, ' + missingHargaCount + ' tanpa harga)</span></div>';
    } else {
      auditBadgeHtml = '<div class="kir-audit-badge good" id="kir-audit-badge-status">' + icon('check') +
        ' <span>Semua data barang (' + items.length + ' unit) lengkap!</span></div>';
    }

    if (items.length === 0) {
      const emptyHtml = '<div class="kir-editor-wrap">' +
        '<div class="kir-header-card">' +
          '<div class="kir-header-info">' +
            '<div class="kir-header-title">' + escapeHtml(namaRuangan) + ' <span class="mono" style="font-size:12px;color:#64748b;">(' + escapeHtml(kodeRuangan) + ')</span></div>' +
            '<div class="kir-header-meta">' +
              '<span><strong>Institusi:</strong> ' + escapeHtml(instRuangan) + '</span>' +
              '<span><strong>Penanggung Jawab:</strong> ' + escapeHtml(pjRuangan) + '</span>' +
              '<span><strong>Lokasi:</strong> ' + escapeHtml(lokasiRuangan) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div style="text-align:center;padding:50px 20px;color:#64748b;background:#f8fafc;border-radius:var(--radius);border:1px dashed #cbd5e1;margin-top:14px;">' +
          '<div style="font-size:36px;color:#94a3b8;margin-bottom:8px;">' + icon('archive', 36) + '</div>' +
          '<p style="font-size:15px;font-weight:600;margin:0 0 6px;color:#1e293b;">Belum Ada Barang di Ruangan Ini</p>' +
          '<p style="font-size:13px;margin:0 0 18px;">Ruangan ini belum memiliki inventaris aset terdaftar.</p>' +
          '<div style="display:flex;gap:10px;justify-content:center;align-items:center;">' +
            (STATE.user.role !== 'keuangan' ?
              '<button type="button" class="btn-primary" onclick="openAddBarangToKir(\'' + escapeHtml(kodeRuangan) + '\')">' +
                iconLabel('plus', 'Tambah Barang ke Ruangan Ini') +
              '</button>' : '') +
            '<button type="button" class="btn-secondary" onclick="closeModal()">' +
              iconLabel('xCircle', 'Tutup') +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';
      openModal('Kartu Inventaris Ruangan (KIR) — ' + namaRuangan, emptyHtml, 'modal-xl');
      return;
    }

    const rowsHtml = items.map(function (b, idx) {
      const noMerk = !b.spesifikasi || String(b.spesifikasi).trim() === '' || String(b.spesifikasi).trim() === '-';
      const noHarga = !b.harga || Number(b.harga) === 0;
      const hasMissing = noMerk || noHarga;

      const kondisiOpts = ['baik', 'rusak ringan', 'rusak berat'].map(function (k) {
        const lbl = k === 'baik' ? 'Baik' : (k === 'rusak ringan' ? 'Rusak Ringan' : 'Rusak Berat');
        return '<option value="' + k + '"' + ((b.kondisi || 'baik') === k ? ' selected' : '') + '>' + lbl + '</option>';
      }).join('');

      const statusOpts = ['tersedia', 'dipinjam', 'rusak', 'diusulkan_hapus'].map(function (st) {
        const lbl = st === 'tersedia' ? 'Tersedia' : (st === 'dipinjam' ? 'Dipinjam' : (st === 'rusak' ? 'Rusak' : 'Diusulkan Hapus'));
        return '<option value="' + st + '"' + ((b.status || 'tersedia') === st ? ' selected' : '') + '>' + lbl + '</option>';
      }).join('');

      return '<tr data-no-inv="' + b.nomor_inventaris + '" class="kir-row ' + (hasMissing ? 'has-missing' : '') + '">' +
        '<td style="text-align:center;color:#64748b;font-size:12px;width:35px;">' + (idx + 1) + '</td>' +
        '<td class="mono" style="font-size:11.5px;white-space:nowrap;font-weight:600;width:145px;">' + b.nomor_inventaris + '</td>' +
        '<td style="width:160px;"><strong>' + escapeHtml(b.jenis_barang) + '</strong>' +
          (b.golongan_barang ? '<br><span style="font-size:10.5px;color:#64748b;">' + escapeHtml(b.golongan_barang) + '</span>' : '') +
        '</td>' +
        '<td>' +
          '<input type="text" class="kir-input kir-input-spek ' + (noMerk ? 'empty-highlight' : '') + '" ' +
            'value="' + (b.spesifikasi ? escapeHtml(b.spesifikasi) : '') + '" ' +
            'placeholder="Masukkan merk / spek..." ' +
            'oninput="onKirInputChanged(this, \'spek\')">' +
        '</td>' +
        '<td style="width:125px;">' +
          '<select class="kir-select kir-select-kondisi">' + kondisiOpts + '</select>' +
        '</td>' +
        '<td style="width:130px;">' +
          '<input type="number" class="kir-input kir-input-harga ' + (noHarga ? 'empty-highlight' : '') + '" ' +
            'value="' + (b.harga ? Number(b.harga) : '') + '" ' +
            'placeholder="0" min="0" ' +
            'oninput="onKirInputChanged(this, \'harga\')">' +
        '</td>' +
        '<td style="width:110px;">' +
          '<input type="text" class="kir-input kir-input-sumber" ' +
            'value="' + (b.sumber_dana ? escapeHtml(b.sumber_dana) : '') + '" ' +
            'placeholder="Sumber dana">' +
        '</td>' +
        '<td style="width:120px;">' +
          '<select class="kir-select kir-select-status">' + statusOpts + '</select>' +
        '</td>' +
        '<td style="width:130px;">' +
          '<input type="text" class="kir-input kir-input-ket" ' +
            'value="' + (b.keterangan ? escapeHtml(b.keterangan) : '') + '" ' +
            'placeholder="Catatan">' +
        '</td>' +
        '<td style="text-align:center;width:45px;">' +
          (STATE.user.role !== 'keuangan' ?
            '<button type="button" class="btn-row-del" onclick="hapusBarangDariKir(\'' + escapeHtml(b.nomor_inventaris) + '\',\'' + escapeHtml(kodeRuangan) + '\',\'' + escapeHtml(b.jenis_barang).replace(/'/g, "\\'") + '\')" title="Keluarkan atau Hapus Barang Ini">' +
              icon('trash', 13) +
            '</button>' : '') +
        '</td>' +
      '</tr>';
    }).join('');

    const bodyHtml = '<div class="kir-editor-wrap">' +
      '<div class="kir-header-card">' +
        '<div class="kir-header-info">' +
          '<div class="kir-header-title">' + escapeHtml(namaRuangan) + ' <span class="mono" style="font-size:12px;color:#64748b;">(' + escapeHtml(kodeRuangan) + ')</span></div>' +
          '<div class="kir-header-meta">' +
            '<span><strong>Institusi:</strong> ' + escapeHtml(instRuangan) + '</span>' +
            '<span><strong>Penanggung Jawab:</strong> ' + escapeHtml(pjRuangan) + '</span>' +
            '<span><strong>Total Barang:</strong> ' + items.length + ' item</span>' +
            '<span><strong>Siklus 3 Bulan:</strong> ' +
              (overdueInRoom > 0
                ? '<span class="badge badge-overdue" style="font-size:11px;">Perlu Validasi (' + overdueInRoom + ')</span>'
                : '<span class="badge badge-valid" style="font-size:11px;">Tervalidasi</span>') +
            '</span>' +
          '</div>' +
        '</div>' +
        auditBadgeHtml +
      '</div>' +

      '<div class="kir-toolbar">' +
        '<label style="display:inline-flex;align-items:center;gap:6px;">' + icon('search', 14) + '<span>Filter Cepat:</span>' +
          '<input type="text" id="kir-table-search" placeholder="Cari barang / nomor..." oninput="filterKirTable(this.value)">' +
        '</label>' +
        '<div style="border-left:1px solid #cbd5e1;height:24px;margin:0 4px;"></div>' +
        '<label>Set Semua Kondisi:' +
          '<select id="kir-bulk-kondisi">' +
            '<option value="baik">Baik</option>' +
            '<option value="rusak ringan">Rusak Ringan</option>' +
            '<option value="rusak berat">Rusak Berat</option>' +
          '</select>' +
          '<button type="button" class="btn-secondary btn-sm" onclick="applyBatchKirCondition()">' + iconLabel('check', 'Terapkan') + '</button>' +
        '</label>' +
        '<div style="border-left:1px solid #cbd5e1;height:24px;margin:0 4px;"></div>' +
        '<label>' +
          '<input type="checkbox" id="kir-filter-missing-only" onchange="toggleKirMissingOnly(this.checked)" style="width:auto!important;margin-right:4px!important;">' +
          'Hanya tampilkan yang belum lengkap' +
        '</label>' +
        '<div style="border-left:1px solid #cbd5e1;height:24px;margin:0 4px;"></div>' +
        '<button type="button" class="btn-primary btn-sm" onclick="validasiSemuaBarangRuangan(\'' + kodeRuangan + '\')" title="Tandai seluruh barang di ruangan ini telah diperiksa fisik dan reset siklus 3 bulan">' +
          iconLabel('check', 'Validasi Ruangan Ini (Reset 3 Bulan)') +
        '</button>' +
        (STATE.user.role !== 'keuangan' ?
          '<div style="border-left:1px solid #cbd5e1;height:24px;margin:0 4px;"></div>' +
          '<button type="button" class="btn-primary btn-sm" onclick="openAddBarangToKir(\'' + escapeHtml(kodeRuangan) + '\')" title="Tambah barang baru atau masukkan barang yang sudah ada ke ruangan ini">' +
            iconLabel('plus', 'Tambah Barang') +
          '</button>' : '') +
      '</div>' +

      '<div class="kir-table-wrap">' +
        '<table class="kir-table" id="table-kir-editor">' +
          '<thead><tr>' +
            '<th style="width:35px;text-align:center;">No.</th>' +
            '<th style="width:145px;">No. Inventaris</th>' +
            '<th style="width:160px;">Jenis Barang</th>' +
            '<th>Merk / Spesifikasi</th>' +
            '<th style="width:125px;">Kondisi</th>' +
            '<th style="width:130px;">Harga (Rp)</th>' +
            '<th style="width:110px;">Sumber Dana</th>' +
            '<th style="width:120px;">Status</th>' +
            '<th style="width:130px;">Keterangan</th>' +
            '<th style="width:45px;text-align:center;">Aksi</th>' +
          '</tr></thead>' +
          '<tbody>' + rowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +

      '<div class="kir-actions-bar" style="justify-content:space-between;align-items:center;">' +
        '<label style="display:flex;align-items:center;gap:6px;font-size:12.5px;color:#334155;margin:0;cursor:pointer;">' +
          '<input type="checkbox" id="kir-check-validate-all" checked style="width:auto!important;margin:0;">' +
          ' Sekaligus tandai divalidasi hari ini (reset pengingat 3 bulan)' +
        '</label>' +
        '<div style="display:flex;gap:8px;">' +
          '<button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
          '<button type="button" class="btn-primary" id="btn-save-kir" onclick="saveKirChanges(\'' + kodeRuangan + '\')">' +
            iconLabel('check', 'Simpan Perubahan KIR (' + items.length + ' Barang)') +
          '</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    openModal('Kartu Inventaris Ruangan (KIR) — ' + namaRuangan, bodyHtml, 'modal-xl');
  } catch (err) {
    toast(err.message, true);
  }
}

function onKirInputChanged(el, type) {
  const val = (el.value || '').trim();
  const row = el.closest('tr');
  if (type === 'spek') {
    if (val === '' || val === '-') {
      el.classList.add('empty-highlight');
    } else {
      el.classList.remove('empty-highlight');
    }
  } else if (type === 'harga') {
    if (val === '' || Number(val) === 0) {
      el.classList.add('empty-highlight');
    } else {
      el.classList.remove('empty-highlight');
    }
  }

  // Update status missing pada baris
  if (row) {
    const spekEl = row.querySelector('.kir-input-spek');
    const hargaEl = row.querySelector('.kir-input-harga');
    const isSpekMissing = spekEl ? (spekEl.value.trim() === '' || spekEl.value.trim() === '-') : false;
    const isHargaMissing = hargaEl ? (hargaEl.value.trim() === '' || Number(hargaEl.value) === 0) : false;
    if (isSpekMissing || isHargaMissing) {
      row.classList.add('has-missing');
    } else {
      row.classList.remove('has-missing');
    }
  }
}

function filterKirTable(query) {
  query = (query || '').toLowerCase().trim();
  const missingOnly = document.getElementById('kir-filter-missing-only') && document.getElementById('kir-filter-missing-only').checked;
  const rows = document.querySelectorAll('#table-kir-editor tbody tr');
  rows.forEach(function (row) {
    const text = row.textContent.toLowerCase();
    const isMissing = row.classList.contains('has-missing');
    const matchQuery = !query || text.indexOf(query) !== -1;
    const matchMissing = !missingOnly || isMissing;
    row.style.display = (matchQuery && matchMissing) ? '' : 'none';
  });
}

function toggleKirMissingOnly(checked) {
  const query = (document.getElementById('kir-table-search') ? document.getElementById('kir-table-search').value : '').toLowerCase().trim();
  const rows = document.querySelectorAll('#table-kir-editor tbody tr');
  rows.forEach(function (row) {
    const text = row.textContent.toLowerCase();
    const isMissing = row.classList.contains('has-missing');
    const matchQuery = !query || text.indexOf(query) !== -1;
    const matchMissing = !checked || isMissing;
    row.style.display = (matchQuery && matchMissing) ? '' : 'none';
  });
}

function applyBatchKirCondition() {
  const selVal = document.getElementById('kir-bulk-kondisi').value;
  const rows = document.querySelectorAll('#table-kir-editor tbody tr');
  let count = 0;
  rows.forEach(function (row) {
    if (row.style.display !== 'none') {
      const select = row.querySelector('.kir-select-kondisi');
      if (select) {
        select.value = selVal;
        count++;
      }
    }
  });
  toast('Kondisi ' + count + ' barang berhasil diubah menjadi: ' + selVal);
}

async function saveKirChanges(kodeRuangan) {
  const saveBtn = document.getElementById('btn-save-kir');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = 'Menyimpan perubahan...';
  }

  try {
    const rows = document.querySelectorAll('#table-kir-editor tbody tr');
    const items = [];
    rows.forEach(function (row) {
      const noInv = row.getAttribute('data-no-inv');
      const spek = row.querySelector('.kir-input-spek') ? row.querySelector('.kir-input-spek').value.trim() : '';
      const kondisi = row.querySelector('.kir-select-kondisi') ? row.querySelector('.kir-select-kondisi').value : 'baik';
      const harga = row.querySelector('.kir-input-harga') ? (Number(row.querySelector('.kir-input-harga').value) || 0) : 0;
      const sumber = row.querySelector('.kir-input-sumber') ? row.querySelector('.kir-input-sumber').value.trim() : '';
      const status = row.querySelector('.kir-select-status') ? row.querySelector('.kir-select-status').value : 'tersedia';
      const ket = row.querySelector('.kir-input-ket') ? row.querySelector('.kir-input-ket').value.trim() : '';

      items.push({
        nomor_inventaris: noInv,
        spesifikasi: spek,
        kondisi: kondisi,
        harga: harga,
        sumber_dana: sumber,
        status: status,
        keterangan: ket
      });
    });

    const validateAll = document.getElementById('kir-check-validate-all') && document.getElementById('kir-check-validate-all').checked;
    const res = await api('batchUpdateBarang', { kode_ruangan: kodeRuangan, items: items, validasi_ulang: validateAll });
    toast('✅ ' + (res.message || 'Perubahan data KIR berhasil disimpan!'));
    closeModal();

    // Refresh data tampilan jika halaman terkait sedang dibuka
    refreshBootstrapInBackground();
    loadDashboard();
    if (!document.getElementById('section-barang').classList.contains('hidden')) {
      loadBarang(STATE.barangPage || 1);
    }
    if (!document.getElementById('section-ruangan').classList.contains('hidden')) {
      renderRuanganTable();
    }
  } catch (err) {
    toast('Gagal menyimpan KIR: ' + err.message, true);
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = iconLabel('check', 'Coba Simpan Lagi');
    }
  }
}

// ---------------- KELOLA BARANG LANGSUNG DARI KIR RUANGAN (TAMBAH & HAPUS) ----------------

function openAddBarangToKir(kodeRuangan) {
  const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
  const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;
  const html =
    '<div style="padding:4px 0;">' +
      '<p style="font-size:13.5px;color:#475569;margin:0 0 14px;">Pilih metode penambahan barang untuk ruangan <strong>' + escapeHtml(namaRuangan) + '</strong> (' + escapeHtml(kodeRuangan) + '):</p>' +
      '<div class="doc-hub-grid" style="grid-template-columns:repeat(auto-fit, minmax(250px, 1fr));gap:14px;">' +
        '<div class="doc-hub-card" onclick="openBarangFormForKir(\'' + escapeHtml(kodeRuangan) + '\')">' +
          '<div class="doc-hub-icon">' + icon('plus', 22) + '</div>' +
          '<div class="doc-hub-title">Registrasi Barang Baru</div>' +
          '<div class="doc-hub-desc">Input barang baru hasil pengadaan/pembelian baru. Nomor inventaris dibuat otomatis dan langsung ditempatkan di ruangan ini.</div>' +
        '</div>' +
        '<div class="doc-hub-card" onclick="openPindahBarangKeKir(\'' + escapeHtml(kodeRuangan) + '\')">' +
          '<div class="doc-hub-icon">' + icon('swap', 22) + '</div>' +
          '<div class="doc-hub-title">Pindahkan Barang yang Ada</div>' +
          '<div class="doc-hub-desc">Pilih aset yang sudah terdaftar di sistem (dari gudang atau ruangan lain) untuk dialokasikan masuk ke ruangan ini.</div>' +
        '</div>' +
      '</div>' +
      '<div class="modal-footer" style="margin-top:18px;">' +
        '<button type="button" class="btn-secondary" onclick="openKirEditor(\'' + escapeHtml(kodeRuangan) + '\')">' +
          iconLabel('xCircle', 'Kembali ke KIR') +
        '</button>' +
      '</div>' +
    '</div>';
  openModal('Tambah Barang — ' + namaRuangan, html, 'modal-lg');
}

function openBarangFormForKir(kodeRuangan) {
  const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
  const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;
  openModal('Tambah Barang Baru ke ' + namaRuangan, barangForm({ kode_ruangan: kodeRuangan }, kodeRuangan));
  bindGolonganCascade();
  attachRupiahMask(document.getElementById('f-harga'));
  bindBarangFormSubmit(null, function () {
    loadBarang(STATE.barangPage);
    openKirEditor(kodeRuangan);
  });
}

async function openPindahBarangKeKir(kodeRuangan) {
  const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
  const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;

  openModal('Pindahkan Barang ke ' + namaRuangan, '<div style="text-align:center;padding:30px;color:#64748b;">Memuat data barang yang dapat dipindahkan...</div>', 'modal-lg');

  try {
    const res = await api('listBarang', { pageSize: 9999, status: '' });
    const all = res.data || [];
    // Ambil barang yang bukan dari ruangan ini dan belum dihapus
    const candidates = all.filter(function (b) {
      return b.kode_ruangan !== kodeRuangan && b.status !== 'dihapus';
    });
    window._pindahKirCandidates = candidates;
    window._pindahKirKodeRuangan = kodeRuangan;

    renderPindahKirModalContent(candidates, kodeRuangan, namaRuangan, '');
  } catch (err) {
    toast(err.message, true);
    openKirEditor(kodeRuangan);
  }
}

function renderPindahKirModalContent(candidates, kodeRuangan, namaRuangan, query) {
  const q = String(query || '').trim().toLowerCase();
  const filtered = q
    ? candidates.filter(function (b) {
        return (b.nomor_inventaris && b.nomor_inventaris.toLowerCase().indexOf(q) !== -1) ||
               (b.jenis_barang && b.jenis_barang.toLowerCase().indexOf(q) !== -1) ||
               (b.spesifikasi && b.spesifikasi.toLowerCase().indexOf(q) !== -1) ||
               (roomName(b.kode_ruangan).toLowerCase().indexOf(q) !== -1);
      })
    : candidates;

  const listRows = filtered.slice(0, 50).map(function (b) {
    const roomAsal = roomName(b.kode_ruangan) || b.kode_ruangan || 'Tanpa Ruangan';
    return '<div class="pindah-item-card" style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:#fff;gap:12px;">' +
      '<div style="min-width:0;flex:1;">' +
        '<div style="font-size:13px;font-weight:600;color:#1e293b;">' +
          escapeHtml(b.jenis_barang) +
          ' <span class="mono" style="font-size:11.5px;color:#64748b;font-weight:normal;">(' + escapeHtml(b.nomor_inventaris) + ')</span>' +
        '</div>' +
        '<div style="font-size:11.5px;color:#64748b;margin-top:2px;">' +
          'Lokasi Asal: <strong>' + escapeHtml(roomAsal) + '</strong>' +
          (b.spesifikasi ? ' • ' + escapeHtml(b.spesifikasi) : '') +
          ' • Kondisi: <span style="text-transform:capitalize;">' + escapeHtml(b.kondisi || 'baik') + '</span>' +
        '</div>' +
      '</div>' +
      '<button type="button" class="btn-primary btn-sm" onclick="eksekusiPindahBarangKeKir(\'' + escapeHtml(b.nomor_inventaris) + '\',\'' + escapeHtml(kodeRuangan) + '\')">' +
        iconLabel('swap', 'Pindahkan ke Sini') +
      '</button>' +
    '</div>';
  }).join('');

  const bodyHtml =
    '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<div style="display:flex;gap:10px;align-items:center;">' +
        '<input type="text" id="pindah-kir-search" class="kir-input" placeholder="Cari nomor inventaris, nama barang, atau ruangan asal..." value="' + escapeHtml(query || '') + '" oninput="onPindahKirSearchInput(this.value)" style="flex:1;padding:8px 12px!important;font-size:13px!important;">' +
      '</div>' +
      '<div style="font-size:12px;color:#64748b;">Menampilkan ' + filtered.length + ' barang yang dapat dialihkan ke <strong>' + escapeHtml(namaRuangan) + '</strong>:</div>' +
      '<div id="pindah-kir-container" style="max-height:42vh;overflow-y:auto;display:flex;flex-direction:column;gap:8px;padding-right:4px;">' +
        (filtered.length ? listRows : '<div style="text-align:center;padding:30px;color:#94a3b8;font-size:13px;">Tidak ada barang yang cocok dengan pencarian</div>') +
      '</div>' +
      '<div class="modal-footer" style="margin-top:10px;">' +
        '<button type="button" class="btn-secondary" onclick="openAddBarangToKir(\'' + escapeHtml(kodeRuangan) + '\')">' +
          iconLabel('undo', 'Kembali') +
        '</button>' +
        '<button type="button" class="btn-secondary" onclick="openKirEditor(\'' + escapeHtml(kodeRuangan) + '\')">' +
          iconLabel('xCircle', 'Tutup & Kembali ke KIR') +
        '</button>' +
      '</div>' +
    '</div>';

  openModal('Pindahkan Barang ke ' + namaRuangan, bodyHtml, 'modal-lg');
  const input = document.getElementById('pindah-kir-search');
  if (input && query) {
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }
}

function onPindahKirSearchInput(q) {
  const candidates = window._pindahKirCandidates || [];
  const kodeRuangan = window._pindahKirKodeRuangan;
  const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
  const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;
  renderPindahKirModalContent(candidates, kodeRuangan, namaRuangan, q);
}

async function eksekusiPindahBarangKeKir(nomorInventaris, kodeRuanganTujuan) {
  try {
    const candidates = window._pindahKirCandidates || [];
    let b = candidates.find(function (it) { return it.nomor_inventaris === nomorInventaris; });
    if (!b) {
      const resSingle = await api('getBarang', { nomor_inventaris: nomorInventaris });
      b = resSingle.data;
    }
    if (!b) throw new Error('Data barang tidak ditemukan.');

    const payload = Object.assign({}, b, { kode_ruangan: kodeRuanganTujuan });
    await api('saveBarang', payload);
    const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuanganTujuan; });
    const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuanganTujuan;
    toast('Barang ' + nomorInventaris + ' berhasil dialokasikan ke ' + namaRuangan + '.');
    loadBarang(STATE.barangPage);
    openKirEditor(kodeRuanganTujuan);
  } catch (err) {
    toast('Gagal memindahkan barang: ' + err.message, true);
  }
}

function hapusBarangDariKir(nomorInventaris, kodeRuangan, jenisBarang) {
  const ruangan = (STATE.ruanganList || []).find(function (r) { return r.kode_ruangan === kodeRuangan; });
  const namaRuangan = ruangan ? ruangan.nama_ruangan : kodeRuangan;

  // Ruangan tujuan lain untuk pengalihan (kecuali ruangan ini)
  const otherRooms = (STATE.ruanganList || []).filter(function (r) { return r.kode_ruangan !== kodeRuangan; });
  const roomOpts = otherRooms.map(function (r) {
    const isGudang = (r.nama_ruangan && r.nama_ruangan.toLowerCase().indexOf('gudang') !== -1) ||
                     (r.kode_ruangan && r.kode_ruangan.toLowerCase().indexOf('gudang') !== -1);
    return '<option value="' + escapeHtml(r.kode_ruangan) + '"' + (isGudang ? ' selected' : '') + '>' +
      escapeHtml(r.nama_ruangan) + ' (' + escapeHtml(r.kode_ruangan) + ')' +
    '</option>';
  }).join('');

  const isAdmin = STATE.user.role === 'admin';

  const bodyHtml =
    '<div style="padding:4px 0;">' +
      '<p style="font-size:13.5px;color:#1e293b;margin:0 0 14px;">' +
        'Pilih tindakan untuk barang <strong>' + escapeHtml(jenisBarang) + '</strong> (<span class="mono">' + escapeHtml(nomorInventaris) + '</span>) di ruangan <strong>' + escapeHtml(namaRuangan) + '</strong>:' +
      '</p>' +

      '<div style="background:#f8fafc;border:1px solid var(--border);border-radius:8px;padding:16px;margin-bottom:14px;">' +
        '<div style="font-weight:600;font-size:13px;color:#1e293b;margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
          icon('swap', 15) + '<span>Keluarkan & Alihkan ke Ruangan Lain (Misal: Gudang)</span>' +
        '</div>' +
        '<p style="font-size:12px;color:#64748b;margin:0 0 10px;">Barang dilepaskan dari KIR ini dan dipindahkan ke ruangan lain. Data aset & riwayat tetap aman tersimpan di SIDAFI.</p>' +
        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
          '<label style="margin:0;font-size:12px;font-weight:600;color:#334155;">Ruangan Tujuan:</label>' +
          '<select id="alih-kir-target" class="kir-select" style="min-width:220px;padding:7px 10px!important;">' +
            roomOpts +
          '</select>' +
          '<button type="button" class="btn-primary btn-sm" onclick="eksekusiAlihRuanganKir(\'' + escapeHtml(nomorInventaris) + '\',\'' + escapeHtml(kodeRuangan) + '\')">' +
            iconLabel('check', 'Alihkan Sekarang') +
          '</button>' +
        '</div>' +
      '</div>' +

      (isAdmin ?
        '<div style="background:#fffbfb;border:1px solid #fecaca;border-radius:8px;padding:16px;margin-bottom:14px;">' +
          '<div style="font-weight:600;font-size:13px;color:#dc2626;margin-bottom:4px;display:flex;align-items:center;gap:6px;">' +
            icon('trash', 15) + '<span>Hapus Permanen dari Sistem (Khusus Draf / Salah Input)</span>' +
          '</div>' +
          '<p style="font-size:12px;color:#64748b;margin:0 0 10px;">Hanya gunakan ini jika barang merupakan draf atau salah input. Jika barang rusak/tidak terpakai, gunakan menu Usulan Penghapusan.</p>' +
          '<button type="button" class="btn-primary btn-sm" style="background:#dc2626;border-color:#dc2626;" onclick="eksekusiHapusPermanenKir(\'' + escapeHtml(nomorInventaris) + '\',\'' + escapeHtml(kodeRuangan) + '\')">' +
            iconLabel('trash', 'Hapus Permanen') +
          '</button>' +
        '</div>' : '') +

      '<div class="modal-footer" style="margin-top:14px;">' +
        '<button type="button" class="btn-secondary" onclick="openKirEditor(\'' + escapeHtml(kodeRuangan) + '\')">' +
          iconLabel('xCircle', 'Batal & Kembali ke KIR') +
        '</button>' +
      '</div>' +
    '</div>';

  openModal('Kelola / Hapus Barang — ' + nomorInventaris, bodyHtml, 'modal-lg');
}

async function eksekusiAlihRuanganKir(nomorInventaris, kodeRuanganLama) {
  const targetSelect = document.getElementById('alih-kir-target');
  if (!targetSelect) return;
  const targetRoomCode = targetSelect.value;
  if (!targetRoomCode) {
    toast('Pilih ruangan tujuan terlebih dahulu.', true);
    return;
  }
  try {
    const resSingle = await api('getBarang', { nomor_inventaris: nomorInventaris });
    const b = resSingle.data;
    if (!b) throw new Error('Data barang tidak ditemukan.');
    const payload = Object.assign({}, b, { kode_ruangan: targetRoomCode });
    await api('saveBarang', payload);
    const targetRoomName = roomName(targetRoomCode) || targetRoomCode;
    toast('Barang ' + nomorInventaris + ' berhasil dialihkan ke ' + targetRoomName + '.');
    loadBarang(STATE.barangPage);
    openKirEditor(kodeRuanganLama);
  } catch (err) {
    toast('Gagal mengalihkan barang: ' + err.message, true);
  }
}

async function eksekusiHapusPermanenKir(nomorInventaris, kodeRuangan) {
  if (!confirm('Apakah Anda yakin ingin menghapus data ' + nomorInventaris + ' secara PERMANEN dari sistem?\n\nPERINGATAN: Tindakan ini tidak dapat dibatalkan.')) {
    return;
  }
  try {
    await api('deleteBarangDraft', { nomor_inventaris: nomorInventaris });
    toast('Barang ' + nomorInventaris + ' berhasil dihapus dari sistem.');
    loadBarang(STATE.barangPage);
    openKirEditor(kodeRuangan);
  } catch (err) {
    toast('Gagal menghapus barang: ' + err.message, true);
  }
}

// ---------------- VALIDASI FISIK INVENTARIS BERKALA (SIKLUS 3 BULAN) ----------------
async function validasiBarangSingle(nomorInventaris) {
  if (!confirm('Validasi fisik barang ' + nomorInventaris + ' bahwa kondisinya sesuai dan reset siklus pengingat 3 bulan?')) return;
  try {
    const res = await api('validasiBarang', { nomor_inventaris: nomorInventaris });
    toast('✅ ' + (res.message || 'Barang berhasil divalidasi!'));
    loadBarang(STATE.barangPage || 1);
    loadDashboard();
  } catch (err) {
    toast(err.message, true);
  }
}

async function validasiSemuaBarangRuangan(kodeRuangan) {
  const rName = roomName(kodeRuangan);
  if (!confirm('Tandai seluruh barang di ruangan ' + rName + ' telah diperiksa/divalidasi hari ini (reset siklus 3 bulan)?')) return;
  try {
    const res = await api('validasiBarang', { kode_ruangan: kodeRuangan });
    toast('✅ ' + (res.message || 'Seluruh barang di ruangan berhasil divalidasi!'));
    openKirEditor(kodeRuangan);
    loadDashboard();
    if (!document.getElementById('section-barang').classList.contains('hidden')) {
      loadBarang(STATE.barangPage || 1);
    }
  } catch (err) {
    toast(err.message, true);
  }
}

// ============================================================
// MODUL CETAK STIKER LABEL INVENTARIS DENGAN QR CODE (DIBEKUKAN SEMENTARA)
// Siap digunakan: aktifkan dengan mengubah FEATURE_LABEL_STICKER = true
// ============================================================
function buildSingleStickerHtml(b) {
  const inst = b.institusi || roomInstitusi(b.kode_ruangan) || 'SMP';
  const orgName = inst === 'MA' ? 'MA DARUL FIKRI SIDOARJO' : (inst === 'Pesantren' ? 'PESANTREN DARUL FIKRI' : 'SMP IT DARUL FIKRI');
  const qrData = encodeURIComponent('SIDAFI:' + b.nomor_inventaris + '|' + b.jenis_barang + '|' + roomName(b.kode_ruangan));
  const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=' + qrData;
  const qrFallback = 'https://quickchart.io/qr?size=140&text=' + qrData;

  return '<div class="sticker-card">' +
    '<div class="sticker-header">' +
      '<img src="assets/logo-dafi.png" class="sticker-logo" alt="DAFI">' +
      '<div class="sticker-head-text">' +
        '<div class="sticker-org">' + orgName + '</div>' +
        '<div class="sticker-suborg">INVENTARIS &amp; ASET SARPRAS</div>' +
      '</div>' +
    '</div>' +
    '<div class="sticker-body">' +
      '<div class="sticker-qr-wrap">' +
        '<img src="' + qrUrl + '" class="sticker-qr" alt="QR" onerror="this.src=\'' + qrFallback + '\'">' +
      '</div>' +
      '<div class="sticker-meta">' +
        '<div class="sticker-no">' + b.nomor_inventaris + '</div>' +
        '<div class="sticker-name">' + b.jenis_barang + '</div>' +
        '<div class="sticker-spec">' + (b.spesifikasi || '-') + '</div>' +
        '<div class="sticker-loc">Ruang: ' + roomName(b.kode_ruangan) + '</div>' +
        '<div class="sticker-year">Tahun: ' + (b.tahun_perolehan || '-') + ' • ' + (b.sumber_dana || 'Yayasan') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="sticker-footer">Dilarang Memindahkan Tanpa Izin Waka Sarpras</div>' +
  '</div>';
}

async function printLabelSticker(nomorInventaris) {
  try {
    const res = await api('getBarang', { nomor_inventaris: nomorInventaris });
    const b = res.data;
    const stickerHtml = buildSingleStickerHtml(b);
    const html = '<div class="print-page portrait" style="padding:15mm;min-height:auto;box-shadow:none;">' +
      '<div class="no-print" style="margin-bottom:15px;padding:10px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;font-size:12px;color:#991b1b;display:flex;align-items:center;justify-content:space-between;">' +
        '<span><strong>Pratinjau Label Stiker Tunggal:</strong> Siap dicetak pada kertas label stiker.</span>' +
      '</div>' +
      '<div class="sticker-grid-single">' + stickerHtml + '</div>' +
    '</div>';
    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

async function printBatchLabelSticker(kodeRuangan) {
  try {
    const ruangan = STATE.ruanganList.find(function (r) { return r.kode_ruangan === kodeRuangan; });
    const res = await api('listBarang', { kode_ruangan: kodeRuangan, pageSize: 9999, status: '' });
    const items = res.data.filter(function (b) { return b.status !== 'dihapus'; });
    if (!items.length) {
      toast('Tidak ada barang di ruangan ini untuk dicetak stikernya.', true);
      return;
    }

    const stickersHtml = items.map(function (b) {
      return buildSingleStickerHtml(b);
    }).join('');

    const html = '<div class="print-page portrait" style="padding:10mm 8mm;min-height:297mm;box-shadow:none;">' +
      '<div class="no-print" style="margin-bottom:12px;padding:8px 14px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;font-size:12px;color:#1e40af;display:flex;align-items:center;justify-content:space-between;">' +
        '<span><strong>Cetak Massal Label Ruangan:</strong> ' + (ruangan ? ruangan.nama_ruangan : kodeRuangan) + ' (' + items.length + ' label)</span>' +
      '</div>' +
      '<div class="sticker-grid-batch">' + stickersHtml + '</div>' +
    '</div>';
    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

// ---------------- REFERENSI KODE (admin) ----------------
async function loadReferensi() {
  showTableLoading('#table-referensi tbody', 5);
  const res = await api('listReferensiKode', {});
  STATE.referensiList = res.data;

  const golonganUnik = [...new Set(res.data.map(function (r) { return r.golongan_barang; }))];
  document.getElementById('filter-referensi-golongan').innerHTML = '<option value="">Semua Golongan</option>' +
    golonganUnik.map(function (g) { return '<option value="' + g + '">' + g + '</option>'; }).join('');

  renderReferensiTable();
}

function renderReferensiTable() {
  const search = document.getElementById('filter-referensi-search').value.toLowerCase();
  const golongan = document.getElementById('filter-referensi-golongan').value;
  const filtered = STATE.referensiList.filter(function (r) {
    if (golongan && r.golongan_barang !== golongan) return false;
    if (search) {
      const gabungan = (r.jenis_barang + ' ' + r.kode_klasifikasi).toLowerCase();
      if (gabungan.indexOf(search) === -1) return false;
    }
    return true;
  });
  document.querySelector('#table-referensi tbody').innerHTML = filtered.map(function (r) {
    return '<tr><td>' + r.golongan_barang + '</td><td class="mono">' + r.kode_golongan + '</td>' +
      '<td>' + r.jenis_barang + '</td><td class="mono">' + r.kode_klasifikasi + '</td>' +
      '<td class="row-actions"><button data-tooltip="Hapus" onclick="hapusReferensi(\'' + r.kode_klasifikasi + '\')">' + icon('trash') + '</button></td></tr>';
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">Tidak ada kode yang cocok.</td></tr>';
}

['filter-referensi-search', 'filter-referensi-golongan'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', renderReferensiTable);
  document.getElementById(id).addEventListener('change', renderReferensiTable);
});

document.getElementById('btn-new-referensi').addEventListener('click', function () {
  const golonganUnik = [...new Set(STATE.referensiList.map(function (r) { return r.golongan_barang; }))];
  openModal('Jenis Barang Baru', '<form id="form-referensi">' +
    '<label>Golongan Barang<input required id="rf-golongan" list="rf-golongan-list" placeholder="Pilih yang sudah ada, atau ketik golongan baru"></label>' +
    '<datalist id="rf-golongan-list">' + golonganUnik.map(function (g) { return '<option value="' + g + '">'; }).join('') + '</datalist>' +
    '<label>Kode Golongan <span style="font-weight:400;color:#888;">(isi hanya jika golongan di atas baru)</span><input id="rf-kode-golongan" placeholder="Contoh: 02.14"></label>' +
    '<label>Jenis Barang<input required id="rf-jenis" placeholder="Contoh: Proyektor"></label>' +
    '<p style="font-size:12px;color:#888;margin-top:-4px;">Kode Klasifikasi akan dibuat otomatis, melanjutkan nomor urut terakhir pada golongan tsb.</p>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>');

  document.getElementById('form-referensi').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      const res = await api('saveReferensiKode', {
        golongan_barang: document.getElementById('rf-golongan').value,
        kode_golongan: document.getElementById('rf-kode-golongan').value,
        jenis_barang: document.getElementById('rf-jenis').value
      });
      closeModal();
      toast('Jenis barang berhasil ditambahkan (kode: ' + res.kode_klasifikasi + ').');
      loadReferensi(); loadReferensiDropdownData();
    } catch (err) { toast(err.message, true); }
  });
});

async function hapusReferensi(kodeKlasifikasi) {
  if (!confirm('Hapus jenis barang dengan kode ' + kodeKlasifikasi + '? Barang yang sudah memakai kode ini di data Barang tidak akan terhapus.')) return;
  try {
    await api('deleteReferensiKode', { kode_klasifikasi: kodeKlasifikasi });
    toast('Jenis barang berhasil dihapus.'); loadReferensi(); loadReferensiDropdownData();
  } catch (err) { toast(err.message, true); }
}

// ---------------- USERS (admin) ----------------
let USERS_CACHE = [];
async function loadUsers() {
  showTableLoading('#table-users tbody', 7);
  const res = await api('listUsers', {});
  USERS_CACHE = res.data;
  document.querySelector('#table-users tbody').innerHTML = res.data.map(function (u) {
    return '<tr><td class="mono">' + u.username + '</td><td>' + u.nama + '</td>' +
      '<td>' + u.role + '</td><td>' + (u.institusi ? badge(u.institusi) : '-') + '</td>' +
      '<td>' + (u.kode_ruangan ? roomName(u.kode_ruangan) : '-') + '</td>' +
      '<td>' + badge(u.status) + '</td>' +
      '<td class="row-actions"><button data-tooltip="Ubah" onclick="editUser(\'' + u.username + '\')">' + icon('edit') + '</button></td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function roleOptions(selected) {
  const roles = [
    ['admin', 'Admin'],
    ['petugas', 'Petugas Ruangan'],
    ['penanggung_jawab', 'Penanggung Jawab Bidang'],
    ['kepala_sekolah', 'Kepala Unit'],
    ['keuangan', 'Divisi Keuangan (Yayasan)']
  ];
  return roles.map(function (r) {
    return '<option value="' + r[0] + '"' + (r[0] === selected ? ' selected' : '') + '>' + r[1] + '</option>';
  }).join('');
}

function userForm(data) {
  data = data || {};
  const isEdit = !!data.username;
  return '<form id="form-user">' +
    '<label>Username<input required id="u-username" value="' + (data.username || '') + '" ' + (isEdit ? 'readonly style="background:#f4f4f4;"' : '') + '></label>' +
    (isEdit ? '' : '<label>Password<input required type="password" id="u-password"></label>') +
    '<label>Nama Lengkap<input required id="u-nama" value="' + (data.nama || '') + '"></label>' +
    '<label>Role<select id="u-role">' + roleOptions(data.role) + '</select></label>' +
    '<label>Institusi <span style="font-weight:400;color:#888;">(untuk Kepala Unit &amp; Penanggung Jawab Bidang — akses satu institusi saja. Kosongkan untuk Admin &amp; Divisi Keuangan, karena keduanya otomatis lintas-institusi)</span><select id="u-institusi">' + institusiOptions(data.institusi) + '</select></label>' +
    '<label>Kode Ruangan <span style="font-weight:400;color:#888;">(khusus role Petugas — akses satu ruangan saja)</span><select id="u-ruangan"><option value="">-</option>' + ruanganOptions(data.kode_ruangan) + '</select></label>' +
    '<label>Email <span style="font-weight:400;color:#888;">(untuk notifikasi email — wajib diisi untuk role Divisi Keuangan)</span><input type="email" id="u-email" value="' + (data.email || '') + '" placeholder="nama@contoh.com"></label>' +
    '<label>Status<select id="u-status">' +
      '<option value="aktif"' + (data.status === 'aktif' || !isEdit ? ' selected' : '') + '>Aktif</option>' +
      '<option value="nonaktif"' + (data.status === 'nonaktif' ? ' selected' : '') + '>Nonaktif</option></select></label>' +
    '<label>' + (isEdit ? 'Reset Password (kosongkan jika tidak diubah)' : '') + '</label>' +
    (isEdit ? '<input type="password" id="u-newpass" style="margin-top:-16px;">' : '') +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>';
}

document.getElementById('btn-new-user').addEventListener('click', function () {
  openModal('Pengguna Baru', userForm());
  document.getElementById('form-user').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('createUser', {
        username: document.getElementById('u-username').value,
        password: document.getElementById('u-password').value,
        nama: document.getElementById('u-nama').value,
        role: document.getElementById('u-role').value,
        institusi: document.getElementById('u-institusi').value,
        kode_ruangan: document.getElementById('u-ruangan').value,
        email: document.getElementById('u-email').value
      });
      closeModal(); toast('Pengguna berhasil dibuat.'); loadUsers();
    } catch (err) { toast(err.message, true); }
  });
});

function editUser(username) {
  const data = USERS_CACHE.find(function (u) { return u.username === username; });
  openModal('Ubah Pengguna — ' + username, userForm(data));
  document.getElementById('form-user').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('updateUser', {
        username: username,
        nama: document.getElementById('u-nama').value,
        role: document.getElementById('u-role').value,
        institusi: document.getElementById('u-institusi').value,
        kode_ruangan: document.getElementById('u-ruangan').value,
        status: document.getElementById('u-status').value,
        email: document.getElementById('u-email').value,
        newPassword: document.getElementById('u-newpass').value || undefined
      });
      closeModal(); toast('Pengguna berhasil diperbarui.'); loadUsers();
    } catch (err) { toast(err.message, true); }
  });
}

// ---------------- PENGATURAN (admin, per institusi) ----------------
function loadPengaturanForm() {
  document.getElementById('pg-smp-pimpinan').value = STATE.pengaturan['SMP.pimpinan_nama'] || '';
  document.getElementById('pg-smp-waka').value = STATE.pengaturan['SMP.penanggungjawab_nama'] || '';
  document.getElementById('pg-ma-pimpinan').value = STATE.pengaturan['MA.pimpinan_nama'] || '';
  document.getElementById('pg-ma-waka').value = STATE.pengaturan['MA.penanggungjawab_nama'] || '';
  document.getElementById('pg-pesantren-pimpinan').value = STATE.pengaturan['Pesantren.pimpinan_nama'] || '';
  document.getElementById('pg-pesantren-waka').value = STATE.pengaturan['Pesantren.penanggungjawab_nama'] || '';

  const pgValAktif = document.getElementById('pg-validasi-aktif');
  if (pgValAktif) {
    pgValAktif.checked = STATE.pengaturan['validasi_pengingat_aktif'] !== '0';
  }
  const pgValSiklus = document.getElementById('pg-validasi-siklus');
  if (pgValSiklus) {
    pgValSiklus.value = STATE.pengaturan['validasi_siklus_bulan'] || '3';
  }
}

document.getElementById('form-pengaturan').addEventListener('submit', async function (e) {
  e.preventDefault();
  try {
    const pgValAktif = document.getElementById('pg-validasi-aktif');
    const pgValSiklus = document.getElementById('pg-validasi-siklus');
    const payload = {
      'SMP.pimpinan_nama': document.getElementById('pg-smp-pimpinan').value,
      'SMP.penanggungjawab_nama': document.getElementById('pg-smp-waka').value,
      'MA.pimpinan_nama': document.getElementById('pg-ma-pimpinan').value,
      'MA.penanggungjawab_nama': document.getElementById('pg-ma-waka').value,
      'Pesantren.pimpinan_nama': document.getElementById('pg-pesantren-pimpinan').value,
      'Pesantren.penanggungjawab_nama': document.getElementById('pg-pesantren-waka').value,
      'validasi_pengingat_aktif': pgValAktif ? (pgValAktif.checked ? '1' : '0') : '1',
      'validasi_siklus_bulan': pgValSiklus ? pgValSiklus.value : '3'
    };
    await api('savePengaturan', payload);
    STATE.pengaturan = Object.assign({}, STATE.pengaturan, payload);
    toast('Pengaturan berhasil disimpan.');
  } catch (err) { toast(err.message, true); }
});

// ---------------- STOK BARANG HABIS PAKAI ----------------
let STOK_CACHE = [];

async function loadStok() {
  showTableLoading('#table-stok tbody', 5);
  const payload = {
    search: document.getElementById('filter-stok-search').value,
    hanya_menipis: document.getElementById('filter-stok-menipis').checked
  };
  const res = await api('listStokItem', payload);
  STOK_CACHE = res.data;

  const canMasuk = STATE.user.role === 'admin' || STATE.user.role === 'penanggung_jawab';

  document.querySelector('#table-stok tbody').innerHTML = res.data.map(function (it) {
    const menipis = Number(it.stok_saat_ini) <= Number(it.stok_minimum);
    const stokDisplay = '<span class="' + (menipis ? 'badge badge-rusak-berat' : 'badge badge-baik') + '">' +
      it.stok_saat_ini + ' ' + it.satuan + '</span>';
    return '<tr><td>' + it.nama_barang + '</td><td>' + (it.kategori || '-') + '</td>' +
      '<td>' + stokDisplay + '</td><td>' + it.stok_minimum + ' ' + it.satuan + '</td>' +
      '<td class="row-actions">' +
        (canMasuk ? '<button data-tooltip="Barang Masuk" onclick="catatMutasi(\'' + it.kode_item + '\',\'masuk\')">' + icon('arrowDownCircle') + '</button>' : '') +
        (STATE.user.role !== 'keuangan' ? '<button data-tooltip="Barang Keluar" onclick="catatMutasi(\'' + it.kode_item + '\',\'keluar\')">' + icon('arrowUpCircle') + '</button>' : '') +
        '<button data-tooltip="Riwayat" onclick="riwayatStok(\'' + it.kode_item + '\')">' + icon('clock') + '</button>' +
        (canMasuk ? '<button data-tooltip="Ubah" onclick="editStokItem(\'' + it.kode_item + '\')">' + icon('edit') + '</button>' : '') +
      '</td></tr>';
  }).join('') || '<tr><td colspan="5" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

['filter-stok-search'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', function () { loadStok(); });
});
document.getElementById('filter-stok-menipis').addEventListener('change', function () { loadStok(); });

function stokItemForm(data) {
  data = data || {};
  const defaultInstitusi = data.institusi || (STATE.user.role !== 'admin' ? STATE.user.institusi : '');
  return '<form id="form-stok-item">' +
    '<label>Institusi<select id="si-institusi" ' + (STATE.user.role !== 'admin' ? 'disabled' : '') + '>' + institusiOptions(defaultInstitusi) + '</select></label>' +
    '<label>Nama Barang<input required id="si-nama" value="' + (data.nama_barang || '') + '" placeholder="Contoh: Kertas HVS A4"></label>' +
    '<label>Kategori<input id="si-kategori" value="' + (data.kategori || '') + '" placeholder="ATK, Listrik, dll."></label>' +
    '<label>Satuan<input required id="si-satuan" value="' + (data.satuan || '') + '" placeholder="Rim, Botol, Buah, dll."></label>' +
    '<label>Stok Minimum <span style="font-weight:400;color:#888;">(ambang batas peringatan menipis)</span><input required type="number" id="si-minimum" value="' + (data.stok_minimum || 0) + '"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel('check', 'Simpan') + '</button></div></form>';
}

function bindStokItemFormSubmit(kodeItem) {
  document.getElementById('form-stok-item').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('saveStokItem', {
        kode_item: kodeItem || undefined,
        institusi: document.getElementById('si-institusi').value,
        nama_barang: document.getElementById('si-nama').value,
        kategori: document.getElementById('si-kategori').value,
        satuan: document.getElementById('si-satuan').value,
        stok_minimum: document.getElementById('si-minimum').value
      });
      closeModal(); toast('Item stok berhasil disimpan.'); loadStok();
    } catch (err) { toast(err.message, true); }
  });
}

document.getElementById('btn-new-stok-item').addEventListener('click', function () {
  openModal('Item Stok Baru', stokItemForm());
  bindStokItemFormSubmit(null);
});

function editStokItem(kodeItem) {
  const data = STOK_CACHE.find(function (it) { return it.kode_item === kodeItem; });
  openModal('Ubah Item Stok — ' + (data ? data.nama_barang : ''), stokItemForm(data));
  bindStokItemFormSubmit(kodeItem);
}

function catatMutasi(kodeItem, jenis) {
  const data = STOK_CACHE.find(function (it) { return it.kode_item === kodeItem; });
  const label = jenis === 'masuk' ? 'Barang Masuk' : 'Barang Keluar';
  const iconName = jenis === 'masuk' ? 'arrowDownCircle' : 'arrowUpCircle';
  openModal('Catat ' + label + ' — ' + (data ? data.nama_barang : ''),
    '<form id="form-mutasi">' +
    '<p style="font-size:13px;color:#444;margin-top:-4px;">Stok saat ini: <strong>' + (data ? data.stok_saat_ini + ' ' + data.satuan : '-') + '</strong></p>' +
    '<label>Jumlah<input required type="number" min="1" id="mt-jumlah"></label>' +
    '<label>Keterangan<textarea id="mt-keterangan" placeholder="' + (jenis === 'masuk' ? 'Contoh: Pembelian dari toko ABC' : 'Contoh: Dipakai untuk ujian semester Kelas 9') + '"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + iconLabel(iconName, 'Catat ' + label) + '</button></div></form>');

  document.getElementById('form-mutasi').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('catatMutasiStok', {
        kode_item: kodeItem,
        jenis: jenis,
        jumlah: document.getElementById('mt-jumlah').value,
        keterangan: document.getElementById('mt-keterangan').value
      });
      closeModal(); toast(label + ' berhasil dicatat.'); loadStok();
    } catch (err) { toast(err.message, true); }
  });
}

async function riwayatStok(kodeItem) {
  const data = STOK_CACHE.find(function (it) { return it.kode_item === kodeItem; });
  try {
    const res = await api('listMutasiStok', { kode_item: kodeItem });
    const rowsHtml = res.data.length ? res.data.map(function (m) {
      const tanda = m.jenis === 'masuk' ? '+' : '-';
      return '<div class="detail-row"><span class="dl-label">' + fmtDate(m.tanggal) + ' — ' + m.dicatat_oleh + '</span>' +
        '<span class="dl-value">' + tanda + m.jumlah + (m.keterangan ? ' (' + m.keterangan + ')' : '') + '</span></div>';
    }).join('') : '<div class="print-empty-note" style="margin:0;">Belum ada riwayat mutasi.</div>';
    openModal('Riwayat Stok — ' + (data ? data.nama_barang : ''), '<div class="detail-list">' + rowsHtml + '</div>');
  } catch (err) { toast(err.message, true); }
}

// ---------------- NOTIFIKASI DIVISI KEUANGAN ----------------
async function refreshNotifBadge() {
  try {
    const res = await api('listNotifikasi', { limit: 50 });
    NOTIF_CACHE = res.data;
    const badge = document.getElementById('notif-unread-badge');
    if (res.unread > 0) {
      badge.textContent = res.unread > 99 ? '99+' : res.unread;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  } catch (err) { /* biarkan badge apa adanya kalau gagal, jangan ganggu pengguna */ }
}

let NOTIF_CACHE = [];
const NOTIF_TIPE_ICON = { pengadaan: 'box', peminjaman_lama: 'swap', penghapusan: 'trash' };
const NOTIF_TIPE_LABEL = { pengadaan: 'Pengadaan Barang', peminjaman_lama: 'Peminjaman Jangka Panjang', penghapusan: 'Usulan Penghapusan' };

async function openNotifPanel() {
  try {
    const res = await api('listNotifikasi', { limit: 50 });
    NOTIF_CACHE = res.data;
    const listHtml = NOTIF_CACHE.length ? NOTIF_CACHE.map(function (n) {
      const belumDibaca = n.dibaca !== true;
      return '<div class="notif-item ' + (belumDibaca ? 'notif-unread' : '') + '" onclick="bacaNotifikasi(\'' + n.id + '\')">' +
        '<div class="notif-item-icon">' + icon(NOTIF_TIPE_ICON[n.tipe] || 'box') + '</div>' +
        '<div class="notif-item-body">' +
          '<div class="notif-item-title">' + n.judul + (belumDibaca ? ' <span class="notif-dot"></span>' : '') + '</div>' +
          '<div class="notif-item-msg">' + n.pesan + '</div>' +
          '<div class="notif-item-time">' + NOTIF_TIPE_LABEL[n.tipe] + ' — ' + fmtDate(n.waktu) + '</div>' +
        '</div></div>';
    }).join('') : '<div class="print-empty-note" style="margin:20px;">Belum ada notifikasi.</div>';

    openModal('Notifikasi Divisi Keuangan',
      '<div class="notif-list">' + listHtml + '</div>' +
      (NOTIF_CACHE.some(function (n) { return n.dibaca !== true; })
        ? '<div class="modal-footer"><button class="btn-secondary" onclick="bacaSemuaNotifikasi()">' + iconLabel('check', 'Tandai Semua Dibaca') + '</button></div>'
        : '')
    );
  } catch (err) { toast(err.message, true); }
}

async function bacaNotifikasi(id) {
  try {
    await api('markNotifikasiRead', { id: id });
    refreshNotifBadge();
    openNotifPanel();
  } catch (err) { toast(err.message, true); }
}

async function bacaSemuaNotifikasi() {
  try {
    await api('markNotifikasiRead', {});
    closeModal();
    refreshNotifBadge();
    toast('Semua notifikasi ditandai sudah dibaca.');
  } catch (err) { toast(err.message, true); }
}

document.getElementById('btn-notif-bell').addEventListener('click', openNotifPanel);

// ---------------- AKUN SAYA (semua role) ----------------
const ROLE_LABEL = {
  admin: 'Admin',
  petugas: 'Petugas Ruangan',
  penanggung_jawab: 'Penanggung Jawab Bidang',
  kepala_sekolah: 'Kepala Unit',
  keuangan: 'Divisi Keuangan (Yayasan)'
};

function tanggungJawabLabel() {
  const u = STATE.user;
  if (u.role === 'admin' || u.role === 'keuangan') return 'Semua Institusi (Lintas Institusi)';
  if (u.role === 'petugas') return roomName(u.kode_ruangan) + (u.kode_ruangan ? '' : ' (belum diatur admin)');
  if (u.role === 'penanggung_jawab' || u.role === 'kepala_sekolah') {
    return (u.institusi || '-') + ' (seluruh ruangan di institusi ini)';
  }
  return '-';
}

function loadAkunForm() {
  document.getElementById('ak-nama').value = STATE.user.nama || '';
  document.getElementById('ak-username').value = STATE.user.username || '';
  document.getElementById('ak-role').value = ROLE_LABEL[STATE.user.role] || STATE.user.role;
  document.getElementById('ak-tanggungjawab').value = tanggungJawabLabel();
  document.getElementById('ak-password-baru').value = '';
  document.getElementById('ak-password-konfirmasi').value = '';
}

document.getElementById('form-akun').addEventListener('submit', async function (e) {
  e.preventDefault();
  const passwordBaru = document.getElementById('ak-password-baru').value;
  const passwordKonfirmasi = document.getElementById('ak-password-konfirmasi').value;
  if (passwordBaru && passwordBaru !== passwordKonfirmasi) {
    toast('Konfirmasi password baru tidak cocok.', true);
    return;
  }
  try {
    const res = await api('updateOwnAccount', {
      nama: document.getElementById('ak-nama').value,
      newUsername: document.getElementById('ak-username').value,
      newPassword: passwordBaru || undefined
    });
    if (res.requireRelogin) {
      toast('Data akun berhasil diubah. Silakan login ulang.');
      setTimeout(function () {
        STATE.token = null; STATE.user = null;
        localStorage.removeItem('sidafi_token'); localStorage.removeItem('sidafi_user');
        document.getElementById('view-app').classList.add('hidden');
        document.getElementById('view-login').classList.remove('hidden');
      }, 1200);
    } else {
      STATE.user.nama = document.getElementById('ak-nama').value;
      localStorage.setItem('sidafi_user', JSON.stringify(STATE.user));
      document.getElementById('current-user-label').textContent = STATE.user.nama + ' — ' + STATE.user.role;
      toast('Data akun berhasil disimpan.');
    }
  } catch (err) { toast(err.message, true); }
});

// Hapus draf barang (admin only) - HANYA untuk membatalkan input yang
// salah/duplikat. Penghapusan resmi barang yang sudah dipakai/tercatat
// harus lewat alur Penghapusan (ajukan -> disetujui) supaya jejak
// audit tetap terjaga.
async function hapusBarangDraft(nomorInventaris) {
  if (!confirm('Hapus barang ' + nomorInventaris + ' secara PERMANEN dari data?\n\nHanya gunakan ini untuk membatalkan input yang salah/duplikat. Untuk barang yang sudah pernah dipakai/tercatat, gunakan alur Penghapusan resmi (menu Penghapusan) supaya riwayatnya tetap tersimpan.')) return;
  try {
    await api('deleteBarangDraft', { nomor_inventaris: nomorInventaris });
    toast('Barang berhasil dihapus.');
    loadBarang(STATE.barangPage);
  } catch (err) { toast(err.message, true); }
}

// ============================================================
// COMMAND PALETTE (Ctrl+K Quick Find) & SHORTCUTS
// ============================================================
const CMD_ACTIONS = [
  { type: 'nav', title: 'Dashboard Utama', desc: 'Ringkasan aset, status opname, dan peringatan', icon: 'home', action: function () { switchView('dashboard'); } },
  { type: 'nav', title: 'Data Barang Inventaris', desc: 'Daftar semua inventaris, pencarian, dan cetak KIB', icon: 'box', action: function () { switchView('barang'); } },
  { type: 'nav', title: 'Peminjaman Barang', desc: 'Kelola peminjaman dan pengembalian aset', icon: 'swap', action: function () { switchView('peminjaman'); } },
  { type: 'nav', title: 'Laporan Kerusakan', desc: 'Catatan barang rusak dan usulan perbaikan', icon: 'alertTriangle', action: function () { switchView('kerusakan'); } },
  { type: 'nav', title: 'Jadwal Perawatan', desc: 'Perawatan berkala inventaris sekolah', icon: 'wrench', action: function () { switchView('perawatan'); } },
  { type: 'nav', title: 'Penghapusan Aset', desc: 'Usulan dan berita acara penghapusan barang', icon: 'trash', action: function () { switchView('penghapusan'); } },
  { type: 'nav', title: 'Stok Habis Pakai', desc: 'Manajemen barang habis pakai dan logistik', icon: 'archive', action: function () { switchView('stok'); } },
  { type: 'nav', title: 'Daftar Ruangan & KIR', desc: 'Kartu Inventaris Ruangan (KIR) dan cetak stiker', icon: 'building', action: function () { switchView('ruangan'); } },
  { type: 'nav', title: 'Pengaturan Cetak & Validasi', desc: 'Konfigurasi pimpinan, waka sarpras, dan siklus validasi', icon: 'sliders', action: function () { switchView('pengaturan'); } },
  { type: 'action', title: 'Tambah Barang Baru', desc: 'Formulir input aset inventaris baru', icon: 'plus', action: function () {
    switchView('barang');
    const btn = document.getElementById('btn-new-barang');
    if (btn) btn.click();
  } },
  { type: 'action', title: 'Validasi Triwulan (Filter Perlu Cek)', desc: 'Tampilkan barang yang siklus validasinya > 3 bulan', icon: 'check', action: function () {
    filterBarangPerluValidasi();
  } },
  { type: 'action', title: 'Cari Data Belum Lengkap', desc: 'Tampilkan barang tanpa spesifikasi/merk atau harga Rp 0', icon: 'alertTriangle', action: function () {
    filterBarangIncomplete();
  } },
  { type: 'action', title: 'Ekspor Data Barang ke CSV', desc: 'Unduh data tabel inventaris saat ini ke format CSV/Excel', icon: 'archive', action: function () {
    exportBarangCsv();
  } },
  { type: 'action', title: 'Impor Data Barang (CSV / Excel)', desc: 'Wizard migrasi data inventaris dari spreadsheet lama', icon: 'clipboard', action: function () {
    openImportWizard();
  } },
  { type: 'action', title: 'Pusat Dokumen & Surat Sarpras', desc: 'Cetak SPPB, BAST, BAP, Bukti Peminjaman & BA Opname', icon: 'printer', action: function () {
    openPusatDokumenModal();
  } },
  { type: 'action', title: 'Buat Surat Pengadaan (SPPB)', desc: 'Surat permohonan pengadaan barang baru & disposisi pimpinan', icon: 'edit', action: function () {
    openModalSPPB();
  } },
  { type: 'action', title: 'Buat Berita Acara Serah Terima (BAST)', desc: 'Berita acara penerimaan barang baru atau hibah donatur', icon: 'check', action: function () {
    openModalBAST();
  } },
  { type: 'action', title: 'Cetak Berita Acara Pemusnahan (BAP)', desc: 'Dokumen berita acara penghapusan dan pemusnahan aset disetujui', icon: 'trash', action: function () {
    openBAPSelector();
  } },
  { type: 'action', title: 'Cetak Berita Acara Stock Opname', desc: 'Laporan resmi hasil verifikasi fisik inventaris triwulanan', icon: 'printer', action: function () {
    printBeritaAcaraOpname();
  } }
];

let selectedCmdIndex = 0;

function openCommandPalette() {
  const overlay = document.getElementById('cmd-palette-overlay');
  const input = document.getElementById('cmd-palette-input');
  if (!overlay || !input) return;
  overlay.classList.remove('hidden');
  input.value = '';
  selectedCmdIndex = 0;
  renderCommandPaletteResults('');
  setTimeout(function () { input.focus(); }, 50);
}

function closeCommandPalette() {
  const overlay = document.getElementById('cmd-palette-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function renderCommandPaletteResults(query) {
  const container = document.getElementById('cmd-palette-results');
  if (!container) return;
  const q = String(query || '').trim().toLowerCase();

  let matches = [];

  // 1. Aksi & Navigasi
  CMD_ACTIONS.forEach(function (item) {
    if (!q || item.title.toLowerCase().indexOf(q) !== -1 || item.desc.toLowerCase().indexOf(q) !== -1) {
      matches.push({
        type: item.type,
        badge: item.type === 'nav' ? 'Menu' : 'Aksi',
        title: item.title,
        desc: item.desc,
        icon: item.icon,
        run: item.action
      });
    }
  });

  // 2. Ruangan (jika dicari)
  if (q && STATE.ruanganList && STATE.ruanganList.length > 0) {
    STATE.ruanganList.forEach(function (r) {
      if ((r.nama_ruangan && r.nama_ruangan.toLowerCase().indexOf(q) !== -1) ||
          (r.kode_ruangan && r.kode_ruangan.toLowerCase().indexOf(q) !== -1)) {
        matches.push({
          type: 'ruangan',
          badge: 'Ruangan',
          title: r.nama_ruangan + ' (' + r.kode_ruangan + ')',
          desc: 'Institusi: ' + (r.institusi || '-') + ' | PJ: ' + (r.penanggung_jawab || '-'),
          icon: 'building',
          run: function () {
            switchView('ruangan');
            openDetailRuangan(r.kode_ruangan);
          }
        });
      }
    });
  }

  // 3. Barang yang sedang termuat (jika dicari)
  if (q && STATE.barangList && STATE.barangList.length > 0) {
    STATE.barangList.forEach(function (b) {
      if ((b.nomor_inventaris && b.nomor_inventaris.toLowerCase().indexOf(q) !== -1) ||
          (b.jenis_barang && b.jenis_barang.toLowerCase().indexOf(q) !== -1) ||
          (b.spesifikasi && b.spesifikasi.toLowerCase().indexOf(q) !== -1)) {
        matches.push({
          type: 'barang',
          badge: 'Barang',
          title: b.nomor_inventaris + ' — ' + b.jenis_barang,
          desc: (b.spesifikasi ? b.spesifikasi + ' | ' : '') + roomName(b.kode_ruangan) + ' | ' + b.status,
          icon: 'box',
          run: function () {
            switchView('barang');
            editBarang(b.nomor_inventaris);
          }
        });
      }
    });
  }

  if (matches.length === 0) {
    container.innerHTML = '<div class="cmd-palette-empty">Tidak ada menu atau data yang cocok dengan "' + escapeHtml(q) + '"</div>';
    window._currentCmdMatches = [];
    return;
  }

  const displayMatches = matches.slice(0, 15);
  window._currentCmdMatches = displayMatches;
  if (selectedCmdIndex >= displayMatches.length) selectedCmdIndex = 0;

  container.innerHTML = displayMatches.map(function (item, idx) {
    const isSel = idx === selectedCmdIndex ? ' selected' : '';
    return '<div class="cmd-palette-item' + isSel + '" onclick="execCmdPaletteIndex(' + idx + ')" onmouseenter="setCmdPaletteSelected(' + idx + ')">' +
      '<span class="cmd-palette-icon">' + icon(item.icon, 18) + '</span>' +
      '<div class="cmd-palette-info">' +
        '<div class="cmd-palette-name">' +
          escapeHtml(item.title) +
          ' <span class="cmd-palette-badge">' + item.badge + '</span>' +
        '</div>' +
        '<div class="cmd-palette-desc">' + escapeHtml(item.desc) + '</div>' +
      '</div>' +
    '</div>';
  }).join('');
}

function setCmdPaletteSelected(idx) {
  selectedCmdIndex = idx;
  const items = document.querySelectorAll('.cmd-palette-item');
  items.forEach(function (el, i) {
    el.classList.toggle('selected', i === idx);
  });
}

function execCmdPaletteIndex(idx) {
  closeCommandPalette();
  if (window._currentCmdMatches && window._currentCmdMatches[idx]) {
    window._currentCmdMatches[idx].run();
  }
}

// Event listener keyboard untuk Command Palette input
const cmdInput = document.getElementById('cmd-palette-input');
if (cmdInput) {
  cmdInput.addEventListener('input', function () {
    selectedCmdIndex = 0;
    renderCommandPaletteResults(cmdInput.value);
  });
  cmdInput.addEventListener('keydown', function (e) {
    const matches = window._currentCmdMatches || [];
    if (matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex + 1) % matches.length;
      setCmdPaletteSelected(selectedCmdIndex);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedCmdIndex = (selectedCmdIndex - 1 + matches.length) % matches.length;
      setCmdPaletteSelected(selectedCmdIndex);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      execCmdPaletteIndex(selectedCmdIndex);
    }
  });
}

const cmdOverlay = document.getElementById('cmd-palette-overlay');
if (cmdOverlay) {
  cmdOverlay.addEventListener('click', function (e) {
    if (e.target.id === 'cmd-palette-overlay') closeCommandPalette();
  });
}

// Global Keyboard Shortcuts (Ctrl+K, ESC)
window.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
    e.preventDefault();
    const overlay = document.getElementById('cmd-palette-overlay');
    if (overlay && !overlay.classList.contains('hidden')) {
      closeCommandPalette();
    } else {
      openCommandPalette();
    }
  } else if (e.key === 'Escape') {
    const cmdEl = document.getElementById('cmd-palette-overlay');
    if (cmdEl && !cmdEl.classList.contains('hidden')) {
      closeCommandPalette();
      return;
    }
    const modalEl = document.getElementById('modal-overlay');
    if (modalEl && !modalEl.classList.contains('hidden')) {
      closeModal();
      return;
    }
    const printEl = document.getElementById('print-preview-overlay');
    if (printEl && !printEl.classList.contains('hidden')) {
      printEl.classList.add('hidden');
      return;
    }
  }
});

// Mobile Floating Action Button (FAB)
function onMobileFabClick() {
  switchView('barang');
  const btn = document.getElementById('btn-new-barang');
  if (btn) btn.click();
}

// ============================================================
// HELPER DOKUMEN & PENOMORAN SURAT RESMI
// ============================================================
function romanMonth(d) {
  const m = (d || new Date()).getMonth();
  return ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][m];
}

function generateNoSurat(kodeDoc, inst) {
  const d = new Date();
  const randNum = String(Math.floor(100 + Math.random() * 900));
  const unit = inst || 'DAFI';
  return randNum + '/' + kodeDoc + '/' + unit + '/' + romanMonth(d) + '/' + d.getFullYear();
}

// ============================================================
// SMART CSV / EXCEL IMPORT WIZARD (MIGRASI DATA LAMA)
// ============================================================
let IMPORT_STATE = {
  rawItems: [],
  validItems: []
};

function openImportWizard() {
  if (!STATE.ruanganList || STATE.ruanganList.length === 0) {
    loadRuanganDropdownData();
  }
  IMPORT_STATE = { rawItems: [], validItems: [] };
  const html =
    '<div class="import-wizard-container">' +
      '<div class="import-zone" id="import-drop-zone">' +
        '<div class="import-zone-icon">' + icon('archive', 40) + '</div>' +
        '<div class="import-zone-title">Pilih File CSV Data Lama Anda</div>' +
        '<div class="import-zone-desc">Format file yang didukung: <strong>.csv</strong> (pemisah koma atau titik koma).</div>' +
        '<div style="display:flex;gap:10px;justify-content:center;align-items:center;flex-wrap:wrap;">' +
          '<label class="btn-primary" style="margin:0;cursor:pointer;">' +
            icon('upload', 15) + '<span>Pilih File CSV</span>' +
            '<input type="file" id="csv-file-input" accept=".csv" style="display:none;" onchange="handleCsvFileChange(this)">' +
          '</label>' +
          '<button type="button" class="btn-secondary" onclick="downloadCsvTemplate()">' +
            icon('download', 15) + '<span>Unduh Template CSV</span>' +
          '</button>' +
        '</div>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;">' +
        '<div>' +
          '<label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Penanganan Duplikasi Nomor Inventaris:</label>' +
          '<select id="import-conflict-mode" style="width:100%;font-size:12px;padding:6px;border:1px solid #cbd5e1;border-radius:4px;">' +
            '<option value="skip">Lewati (Abaikan jika nomor sudah ada)</option>' +
            '<option value="overwrite">Timpa (Perbarui data jika nomor sama)</option>' +
          '</select>' +
        '</div>' +
        '<div>' +
          '<label style="font-weight:600;font-size:12px;display:block;margin-bottom:4px;">Nomor Inventaris Kosong:</label>' +
          '<div style="font-size:12px;color:#475569;margin-top:8px;display:flex;align-items:center;gap:6px;">' +
            icon('check', 14) + ' <em>Otomatis dibuatkan sesuai standar SIDAFI ({klasifikasi}.{tahun}.{urut})</em>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<div id="import-preview-section" class="hidden"></div>' +
    '</div>';

  openModal('Impor Data Barang (Migrasi Data Lama)', html, 'modal-xl');
}

function downloadCsvTemplate() {
  const headers = ['nomor_inventaris', 'golongan_barang', 'jenis_barang', 'spesifikasi', 'nama_satuan', 'tahun_perolehan', 'kondisi', 'harga', 'kode_ruangan', 'sumber_dana', 'no_bukti_nota', 'keterangan'];
  const samples = [
    ['02.03.13.2023.001', 'Alat Kantor & Rumah Tangga', 'Kursi Kerja', 'Chitose Lipat Busa Hitam', 'Unit', '2023', 'baik', '250000', 'SMP.01', 'Yayasan', 'NOTA-001', 'Inventaris ruang guru'],
    ['', 'Komputer & Elektronik', 'Laptop Guru', 'Lenovo ThinkPad Core i5', 'Unit', '2023', 'baik', '7500000', 'SMP.02', 'BOS', 'NOTA-002', 'Nomor kosong otomatis digenerate'],
    ['', 'Komputer & Elektronik', 'Proyektor', 'Epson EB-X400 3300 Lumens', 'Unit', '2024', 'baik', '5200000', 'MA.01', 'Yayasan', 'NOTA-003', 'Ruang kelas MA']
  ];
  const csvText = '\uFEFF' + headers.join(',') + '\n' + samples.map(function (r) {
    return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
  }).join('\n');

  const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Template_Migrasi_SIDAFI.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast('Template CSV berhasil diunduh.');
}

function parseCsvText(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((c === ',' || c === ';') && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || row[0] !== '') lines.push(row);
  return lines;
}

function normalizeHeaderKey(h) {
  const s = String(h || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s.indexOf('nomor') !== -1 || s.indexOf('kodeinv') !== -1 || s.indexOf('nomer') !== -1) return 'nomor_inventaris';
  if (s.indexOf('golongan') !== -1) return 'golongan_barang';
  if (s.indexOf('jenis') !== -1 || s.indexOf('namabarang') !== -1 || s === 'nama' || s === 'barang') return 'jenis_barang';
  if (s.indexOf('spek') !== -1 || s.indexOf('spesifikasi') !== -1 || s.indexOf('merk') !== -1) return 'spesifikasi';
  if (s.indexOf('satuan') !== -1) return 'nama_satuan';
  if (s.indexOf('tahun') !== -1 || s.indexOf('thn') !== -1) return 'tahun_perolehan';
  if (s.indexOf('kondisi') !== -1) return 'kondisi';
  if (s.indexOf('harga') !== -1 || s.indexOf('nilai') !== -1 || s.indexOf('biaya') !== -1) return 'harga';
  if (s.indexOf('ruang') !== -1 || s.indexOf('lokasi') !== -1) return 'kode_ruangan';
  if (s.indexOf('sumber') !== -1 || s.indexOf('dana') !== -1) return 'sumber_dana';
  if (s.indexOf('bukti') !== -1 || s.indexOf('nota') !== -1 || s.indexOf('kwitansi') !== -1) return 'no_bukti_nota';
  if (s.indexOf('ket') !== -1 || s.indexOf('keterangan') !== -1 || s.indexOf('catatan') !== -1) return 'keterangan';
  return s;
}

function handleCsvFileChange(input) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    processCsvData(e.target.result, file.name);
  };
  reader.readAsText(file, 'UTF-8');
}

function processCsvData(csvText, fileName) {
  const table = parseCsvText(csvText);
  if (table.length < 2) {
    toast('File CSV kosong atau tidak memiliki baris data.', true);
    return;
  }
  const rawHeaders = table[0];
  const keys = rawHeaders.map(normalizeHeaderKey);

  const items = [];
  const validRuanganMap = {};
  (STATE.ruanganList || []).forEach(function (r) {
    validRuanganMap[r.kode_ruangan.toLowerCase()] = r.kode_ruangan;
    if (r.nama_ruangan) validRuanganMap[r.nama_ruangan.toLowerCase()] = r.kode_ruangan;
  });

  for (let i = 1; i < table.length; i++) {
    const row = table[i];
    if (row.length === 1 && !row[0].trim()) continue;
    const obj = {};
    keys.forEach(function (k, idx) {
      obj[k] = row[idx] ? String(row[idx]).trim() : '';
    });

    // Lewati jika seluruh kolom dalam baris kosong (misal sisa baris kosong koma dari Excel)
    const hasAnyVal = keys.some(function (k) { return obj[k] !== ''; });
    if (!hasAnyVal) continue;

    const errors = [];
    const warnings = [];

    if (!obj.jenis_barang) errors.push('Nama/jenis barang kosong');

    const rawRuang = (obj.kode_ruangan || '').toLowerCase();
    if (!rawRuang) {
      errors.push('Ruangan belum diisi');
    } else if (validRuanganMap[rawRuang]) {
      obj.kode_ruangan = validRuanganMap[rawRuang];
    } else {
      errors.push('Ruangan "' + obj.kode_ruangan + '" tidak terdaftar');
    }

    const tahunNum = parseInt(obj.tahun_perolehan, 10);
    if (!tahunNum || isNaN(tahunNum) || tahunNum < 1950) {
      obj.tahun_perolehan = new Date().getFullYear();
      warnings.push('Tahun diatur ke ' + obj.tahun_perolehan);
    }

    if (!obj.spesifikasi || obj.spesifikasi === '-') {
      warnings.push('Spesifikasi/merk kosong');
    }
    const hargaNum = Number(String(obj.harga || '0').replace(/\D/g, '')) || 0;
    obj.harga = hargaNum;
    if (hargaNum === 0) {
      warnings.push('Harga Rp 0');
    }

    obj._errors = errors;
    obj._warnings = warnings;
    obj._isValid = errors.length === 0;
    items.push(obj);
  }

  IMPORT_STATE.rawItems = items;
  IMPORT_STATE.validItems = items.filter(function (x) { return x._isValid; });
  renderImportPreview(items, fileName);
}

function renderImportPreview(items, fileName) {
  const container = document.getElementById('import-preview-section');
  if (!container) return;
  container.classList.remove('hidden');

  const readyCount = items.filter(function (x) { return x._isValid && x._warnings.length === 0; }).length;
  const warningCount = items.filter(function (x) { return x._isValid && x._warnings.length > 0; }).length;
  const errorCount = items.filter(function (x) { return !x._isValid; }).length;

  const tableRowsHtml = items.map(function (item, idx) {
    let rowClass = '';
    let badgeHtml = '';
    if (!item._isValid) {
      rowClass = 'row-invalid';
      badgeHtml = '<span class="badge badge-danger" title="' + escapeHtml(item._errors.join(', ')) + '">' + escapeHtml(item._errors[0]) + '</span>';
    } else if (item._warnings.length > 0) {
      rowClass = 'row-warning';
      badgeHtml = '<span class="badge badge-warning" title="' + escapeHtml(item._warnings.join(', ')) + '">Perhatian</span>';
    } else {
      badgeHtml = '<span class="badge badge-valid">Valid</span>';
    }

    return '<tr class="' + rowClass + '">' +
      '<td>' + (idx + 1) + '</td>' +
      '<td>' + badgeHtml + '</td>' +
      '<td class="mono">' + (item.nomor_inventaris || '<em style="color:#64748b;">(Otomatis)</em>') + '</td>' +
      '<td><strong>' + escapeHtml(item.jenis_barang) + '</strong>' + (item.spesifikasi ? '<br><small style="color:#64748b;">' + escapeHtml(item.spesifikasi) + '</small>' : '') + '</td>' +
      '<td>' + escapeHtml(item.kode_ruangan || '-') + '</td>' +
      '<td>' + (item.tahun_perolehan || '-') + '</td>' +
      '<td>' + rupiah(item.harga) + '</td>' +
    '</tr>';
  }).join('');

  container.innerHTML =
    '<div style="margin-top:14px;border-top:1px solid #e2e8f0;padding-top:14px;">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">' +
        '<div style="font-weight:600;font-size:13.5px;">Pratinjau Data: <span style="color:#475569;">' + escapeHtml(fileName) + ' (' + items.length + ' baris)</span></div>' +
        '<div class="import-summary-bar" style="margin:0;">' +
          '<span class="import-stat-pill success">' + (readyCount + warningCount) + ' Siap Diimpor</span>' +
          (warningCount > 0 ? '<span class="import-stat-pill warning">' + warningCount + ' Perlu Dilengkapi Nanti</span>' : '') +
          (errorCount > 0 ? '<span class="import-stat-pill error">' + errorCount + ' Ditolak</span>' : '') +
        '</div>' +
      '</div>' +
      '<div class="import-preview-wrap">' +
        '<table class="import-preview-table">' +
          '<thead><tr>' +
            '<th>#</th><th>Status</th><th>Nomor Inv</th><th>Jenis / Spesifikasi</th><th>Ruangan</th><th>Tahun</th><th>Harga</th>' +
          '</tr></thead>' +
          '<tbody>' + tableRowsHtml + '</tbody>' +
        '</table>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
        '<button type="button" class="btn-primary" id="btn-execute-import" onclick="executeBatchImport()" ' + (IMPORT_STATE.validItems.length === 0 ? 'disabled' : '') + '>' +
          iconLabel('check', 'Eksekusi Impor ' + IMPORT_STATE.validItems.length + ' Data') +
        '</button>' +
      '</div>' +
    '</div>';
}

async function executeBatchImport() {
  if (!IMPORT_STATE.validItems || IMPORT_STATE.validItems.length === 0) {
    toast('Tidak ada baris data valid untuk diimpor.', true);
    return;
  }
  const btn = document.getElementById('btn-execute-import');
  if (btn) { btn.disabled = true; btn.innerHTML = 'Mengimpor data ke Google Sheets...'; }

  const conflictMode = document.getElementById('import-conflict-mode') ? document.getElementById('import-conflict-mode').value : 'skip';

  try {
    const res = await api('importBarangBatch', {
      items: IMPORT_STATE.validItems,
      conflict_mode: conflictMode
    });
    closeModal();
    toast('Migrasi selesai: ' + res.added + ' barang ditambahkan' + (res.updated > 0 ? ', ' + res.updated + ' diperbarui' : '') + (res.skipped > 0 ? ', ' + res.skipped + ' dilewati' : '') + '.');
    loadBarang(1);
    loadDashboard();
  } catch (err) {
    toast(err.message, true);
    if (btn) { btn.disabled = false; btn.innerHTML = 'Coba Lagi'; }
  }
}

// ============================================================
// PUSAT DOKUMEN & ADMINISTRASI SARPRAS
// ============================================================
function openPusatDokumenModal() {
  const html =
    '<div style="margin-bottom:14px;color:#475569;font-size:13px;">' +
      'Pilih jenis dokumen administrasi sarpras resmi yang ingin Anda terbitkan atau cetak:' +
    '</div>' +
    '<div class="doc-hub-grid">' +
      '<div class="doc-hub-card" onclick="closeModal(); openModalSPPB();">' +
        '<div class="doc-hub-icon">' + icon('edit', 22) + '</div>' +
        '<div class="doc-hub-title">Surat Pengajuan Pengadaan (SPPB)</div>' +
        '<div class="doc-hub-desc">Formulir usulan pembelian aset baru, estimasi anggaran, dan lembar disposisi pimpinan.</div>' +
      '</div>' +
      '<div class="doc-hub-card" onclick="closeModal(); openModalBAST();">' +
        '<div class="doc-hub-icon">' + icon('check', 22) + '</div>' +
        '<div class="doc-hub-title">Berita Acara Serah Terima (BAST)</div>' +
        '<div class="doc-hub-desc">Berita acara penerimaan barang dari vendor / rekanan atau serah terima hibah donatur.</div>' +
      '</div>' +
      '<div class="doc-hub-card" onclick="closeModal(); openBAPSelector();">' +
        '<div class="doc-hub-icon">' + icon('trash', 22) + '</div>' +
        '<div class="doc-hub-title">Berita Acara Pemusnahan (BAP)</div>' +
        '<div class="doc-hub-desc">Surat berita acara resmi penghapusan dan pemusnahan aset yang disetujui.</div>' +
      '</div>' +
      '<div class="doc-hub-card" onclick="closeModal(); switchView(\'peminjaman\');">' +
        '<div class="doc-hub-icon">' + icon('clipboard', 22) + '</div>' +
        '<div class="doc-hub-title">Surat Bukti Peminjaman (Surat Jalan)</div>' +
        '<div class="doc-hub-desc">Surat izin pinjam pakai barang sarpras lengkap dengan pakta integritas peminjam.</div>' +
      '</div>' +
      '<div class="doc-hub-card" onclick="closeModal(); printBeritaAcaraOpname();">' +
        '<div class="doc-hub-icon">' + icon('printer', 22) + '</div>' +
        '<div class="doc-hub-title">Berita Acara Stock Opname Triwulan</div>' +
        '<div class="doc-hub-desc">Laporan hasil verifikasi audit fisik inventaris berkala 3 bulanan.</div>' +
      '</div>' +
    '</div>';

  openModal('Pusat Cetak Dokumen Administrasi Sarpras', html, 'modal-lg');
}

// ---------------- DOKUMEN 1: BERITA ACARA PEMUSNAHAN (BAP) ----------------
function openBAPSelector() {
  const approved = (PENGHAPUSAN_CACHE || []).filter(function (p) { return p.status === 'disetujui'; });
  if (approved.length === 0) {
    openModal('Cetak Berita Acara Pemusnahan (BAP)',
      '<div class="empty-state-card">' +
        '<div class="empty-state-icon">' + icon('trash', 32) + '</div>' +
        '<div class="empty-state-title">Belum Ada Usulan yang Disetujui</div>' +
        '<div class="empty-state-desc">Berita Acara Pemusnahan hanya dapat diterbitkan untuk barang yang usulan penghapusannya telah disetujui pimpinan di menu Usulan Penghapusan.</div>' +
        '<button class="btn-primary" onclick="closeModal(); switchView(\'penghapusan\');">' + iconLabel('trash', 'Buka Menu Penghapusan') + '</button>' +
      '</div>');
    return;
  }

  const listHtml = approved.map(function (p) {
    return '<div class="doc-hub-card" style="margin-bottom:8px;" onclick="closeModal(); printBAP(\'' + p.id_hapus + '\')">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;">' +
        '<div><strong>' + escapeHtml(p.jenis_barang) + '</strong> (' + p.nomor_inventaris + ')</div>' +
        '<span class="badge badge-success">Disetujui</span>' +
      '</div>' +
      '<div style="font-size:12px;color:#64748b;">Kategori: ' + p.kategori + ' | Alasan: ' + escapeHtml(p.alasan) + ' | Disetujui: ' + (p.disetujui_oleh || '-') + '</div>' +
    '</div>';
  }).join('');

  openModal('Pilih Barang untuk Berita Acara Pemusnahan (BAP)',
    '<div style="max-height:360px;overflow-y:auto;">' + listHtml + '</div>', 'modal-lg');
}

async function printBAP(id_hapus) {
  try {
    let item = (PENGHAPUSAN_CACHE || []).find(function (x) { return x.id_hapus === id_hapus; });
    if (!item) {
      const res = await api('listPenghapusan', {});
      PENGHAPUSAN_CACHE = res.data;
      item = (PENGHAPUSAN_CACHE || []).find(function (x) { return x.id_hapus === id_hapus; });
    }
    if (!item) { toast('Data penghapusan tidak ditemukan.', true); return; }

    const inst = item.institusi || 'SMP';
    const noSurat = item.nomor_ba || generateNoSurat('BA-HAPUS', inst);
    const tglResmi = item.tanggal_keputusan ? fmtDate(item.tanggal_keputusan) : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    const html =
      '<div class="print-page portrait">' + printBgImage(inst) +
        '<div class="print-content">' +
          '<div class="print-title">BERITA ACARA PENGHAPUSAN DAN PEMUSNAHAN BARANG INVENTARIS</div>' +
          '<div style="text-align:center;font-size:12px;margin:-12px 0 16px;color:#333;">Nomor: ' + noSurat + '</div>' +
          '<div class="print-clause">' +
            'Pada hari ini tanggal <strong>' + tglResmi + '</strong>, bertempat di lingkungan Sarana dan Prasarana <strong>' + (PIMPINAN_JABATAN[inst] ? PIMPINAN_JABATAN[inst].replace('Kepala ', '') + ' DAFI' : 'DAFI') + '</strong>, telah dilakukan pemeriksaan fisik dan tindakan penghapusan/pemusnahan terhadap aset barang inventaris sebagai berikut:' +
          '</div>' +
          '<table class="print-data-table">' +
            '<thead><tr>' +
              '<th>No</th><th>Nomor Inventaris</th><th>Nama / Spesifikasi Barang</th><th>Kategori</th><th>Lokasi Terakhir</th><th>Nilai Perolehan</th>' +
            '</tr></thead>' +
            '<tbody>' +
              '<tr>' +
                '<td>1</td>' +
                '<td class="mono">' + item.nomor_inventaris + '</td>' +
                '<td><strong>' + escapeHtml(item.jenis_barang) + '</strong><br><small>' + escapeHtml(item.spesifikasi || '-') + '</small></td>' +
                '<td>' + item.kategori + '</td>' +
                '<td>' + roomName(item.kode_ruangan) + '</td>' +
                '<td>' + rupiah(item.harga || 0) + '</td>' +
              '</tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="print-clause">' +
            '<strong>Dasar dan Pertimbangan Penghapusan:</strong><br>' +
            'Barang tersebut di atas telah dinyatakan <em>' + item.kategori + '</em> dengan alasan: "' + escapeHtml(item.alasan) + '". Biaya perbaikan atau pemeliharaan dinilai tidak efisien secara ekonomis, sehingga diputuskan untuk dihapuskan dari Buku Daftar Inventaris Sarpras.' +
          '</div>' +
          '<div class="print-clause">' +
            'Demikian Berita Acara ini dibuat dengan sebenarnya dalam rangkap secukupnya untuk dapat dipergunakan sebagaimana mestinya dan menjadi dasar pertanggungjawaban pembukuan inventaris.' +
          '</div>' +
          '<div class="sig-grid-3">' +
            sigBlock('Petugas Pemeriksa', item.diusulkan_oleh) +
            sigBlock('Penanggung Jawab Sarpras', penanggungJawabNama(inst)) +
            sigBlock('Mengetahui / Menyetujui,<br>' + (PIMPINAN_JABATAN[inst] || 'Pimpinan'), pimpinanNama(inst)) +
          '</div>' +
        '</div>' +
      '</div>';

    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

// ---------------- DOKUMEN 2: PERMOHONAN PENGADAAN (SPPB) ----------------
let SPPB_ROW_COUNTER = 0;

function openModalSPPB() {
  SPPB_ROW_COUNTER = 0;
  const today = new Date().toISOString().slice(0, 10);
  const userInst = STATE.user.institusi || 'SMP';

  const html =
    '<form id="form-sppb" onsubmit="event.preventDefault(); printSPPB();">' +
      '<div class="doc-form-row">' +
        '<label>Institusi / Unit<select id="sppb-institusi">' + institusiOptions(userInst) + '</select></label>' +
        '<label>Tanggal Pengajuan<input type="date" id="sppb-tanggal" value="' + today + '" required></label>' +
        '<label>Unit / Ruangan Pemohon<input id="sppb-pemohon" required value="' + (STATE.user.nama || '') + '" placeholder="Contoh: Lab Komputer / Kelas 7"></label>' +
        '<label>Tingkat Urgensi<select id="sppb-urgensi">' +
          '<option value="Mendesak (Prioritas 1)">Mendesak (Prioritas 1)</option>' +
          '<option value="Rutin / Berkala (Prioritas 2)" selected>Rutin / Berkala (Prioritas 2)</option>' +
          '<option value="Program Baru (Prioritas 3)">Program Baru (Prioritas 3)</option>' +
        '</select></label>' +
      '</div>' +
      '<label>Alasan / Justifikasi Kebutuhan<textarea id="sppb-justifikasi" required rows="2" placeholder="Jelaskan tujuan pengadaan barang ini dan peruntukannya bagi kegiatan operasional sekolah/pesantren..."></textarea></label>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px;">' +
        '<strong style="font-size:13px;">Daftar Barang yang Diajukan:</strong>' +
        '<button type="button" class="btn-secondary btn-sm" onclick="addSppbItemRow()">' + iconLabel('plus', 'Tambah Baris') + '</button>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table class="doc-items-table" id="table-sppb-items">' +
          '<thead><tr>' +
            '<th style="width:25%;">Nama Barang</th>' +
            '<th style="width:30%;">Spesifikasi / Merk</th>' +
            '<th style="width:10%;">Jumlah</th>' +
            '<th style="width:12%;">Satuan</th>' +
            '<th style="width:18%;">Est. Harga Satuan (Rp)</th>' +
            '<th style="width:5%;">Aksi</th>' +
          '</tr></thead>' +
          '<tbody></tbody>' +
        '</table>' +
      '</div>' +
      '<div style="text-align:right;font-size:13px;font-weight:600;margin-top:8px;">' +
        'Total Estimasi Anggaran: <span id="sppb-grand-total" style="color:var(--red);">Rp 0</span>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
        '<button type="submit" class="btn-primary">' + iconLabel('printer', 'Terbitkan & Cetak SPPB') + '</button>' +
      '</div>' +
    '</form>';

  openModal('Surat Permohonan Pengadaan Barang Baru (SPPB)', html, 'modal-xl');
  addSppbItemRow();
}

function addSppbItemRow() {
  SPPB_ROW_COUNTER++;
  const tbody = document.querySelector('#table-sppb-items tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.id = 'sppb-row-' + SPPB_ROW_COUNTER;
  tr.innerHTML =
    '<td><input required class="sppb-nama" placeholder="Contoh: Kursi Belajar"></td>' +
    '<td><input class="sppb-spek" placeholder="Contoh: Busa tebal pipa besi"></td>' +
    '<td><input required type="number" min="1" class="sppb-qty" value="1" oninput="calculateSppbTotal()"></td>' +
    '<td><input class="sppb-satuan" value="Unit" placeholder="Unit/Pcs/Set"></td>' +
    '<td><input required type="text" inputmode="numeric" class="sppb-harga" value="0" oninput="onSppbHargaInput(this)"></td>' +
    '<td style="text-align:center;"><button type="button" class="btn-row-del" onclick="removeSppbItemRow(' + SPPB_ROW_COUNTER + ')" title="Hapus Baris">' + icon('trash', 13) + '</button></td>';
  tbody.appendChild(tr);
  calculateSppbTotal();
}

function removeSppbItemRow(id) {
  const row = document.getElementById('sppb-row-' + id);
  if (row) row.remove();
  calculateSppbTotal();
}

function onSppbHargaInput(el) {
  const digits = el.value.replace(/\D/g, '');
  el.value = digits ? Number(digits).toLocaleString('id-ID') : '0';
  calculateSppbTotal();
}

function calculateSppbTotal() {
  let total = 0;
  const rows = document.querySelectorAll('#table-sppb-items tbody tr');
  rows.forEach(function (r) {
    const qty = parseInt(r.querySelector('.sppb-qty').value, 10) || 0;
    const harga = Number(r.querySelector('.sppb-harga').value.replace(/\D/g, '')) || 0;
    total += (qty * harga);
  });
  const totalEl = document.getElementById('sppb-grand-total');
  if (totalEl) totalEl.textContent = rupiah(total);
}

function printSPPB() {
  const inst = document.getElementById('sppb-institusi').value || 'SMP';
  const tgl = fmtDate(document.getElementById('sppb-tanggal').value);
  const pemohon = document.getElementById('sppb-pemohon').value;
  const urgensi = document.getElementById('sppb-urgensi').value;
  const justifikasi = document.getElementById('sppb-justifikasi').value;

  const rows = document.querySelectorAll('#table-sppb-items tbody tr');
  if (rows.length === 0) { toast('Daftar barang usulan belum diisi.', true); return; }

  let grandTotal = 0;
  const itemsHtml = Array.from(rows).map(function (r, idx) {
    const nama = r.querySelector('.sppb-nama').value;
    const spek = r.querySelector('.sppb-spek').value;
    const qty = parseInt(r.querySelector('.sppb-qty').value, 10) || 0;
    const satuan = r.querySelector('.sppb-satuan').value || 'Unit';
    const harga = Number(r.querySelector('.sppb-harga').value.replace(/\D/g, '')) || 0;
    const subtotal = qty * harga;
    grandTotal += subtotal;

    return '<tr>' +
      '<td style="text-align:center;">' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(nama) + '</strong></td>' +
      '<td>' + escapeHtml(spek || '-') + '</td>' +
      '<td style="text-align:center;">' + qty + ' ' + escapeHtml(satuan) + '</td>' +
      '<td style="text-align:right;">' + rupiah(harga) + '</td>' +
      '<td style="text-align:right;font-weight:600;">' + rupiah(subtotal) + '</td>' +
    '</tr>';
  }).join('');

  const noSurat = generateNoSurat('SPPB', inst);

  const html =
    '<div class="print-page portrait">' + printBgImage(inst) +
      '<div class="print-content">' +
        '<div class="print-title">SURAT PERMOHONAN PENGADAAN BARANG (SPPB)</div>' +
        '<div style="text-align:center;font-size:12px;margin:-12px 0 16px;color:#333;">Nomor: ' + noSurat + '</div>' +
        '<div class="print-meta-grid">' +
          '<div class="print-meta-item"><span class="print-meta-k">Tanggal Usulan</span>: ' + tgl + '</div>' +
          '<div class="print-meta-item"><span class="print-meta-k">Tingkat Urgensi</span>: ' + urgensi + '</div>' +
          '<div class="print-meta-item"><span class="print-meta-k">Unit / Pemohon</span>: ' + escapeHtml(pemohon) + '</div>' +
          '<div class="print-meta-item"><span class="print-meta-k">Institusi</span>: ' + inst + ' DAFI</div>' +
        '</div>' +
        '<div class="print-clause">' +
          '<strong>Alasan & Justifikasi Pengadaan:</strong><br>' +
          escapeHtml(justifikasi) +
        '</div>' +
        '<div class="print-subtitle">Rincian Usulan Barang:</div>' +
        '<table class="print-data-table">' +
          '<thead><tr>' +
            '<th style="width:5%;">No</th>' +
            '<th>Nama Barang</th>' +
            '<th>Spesifikasi Teknis</th>' +
            '<th style="width:12%;">Volume</th>' +
            '<th style="width:18%;">Est. Harga Satuan</th>' +
            '<th style="width:20%;">Total Biaya</th>' +
          '</tr></thead>' +
          '<tbody>' + itemsHtml + '</tbody>' +
          '<tfoot><tr>' +
            '<th colspan="5" style="text-align:right;font-weight:bold;">TOTAL USULAN ANGGARAN:</th>' +
            '<th style="text-align:right;font-weight:bold;color:#b91c1c;">' + rupiah(grandTotal) + '</th>' +
          '</tr></tfoot>' +
        '</table>' +
        '<div class="print-disposisi-box">' +
          '<div class="print-disposisi-title">LEMBAR DISPOSISI & PERSETUJUAN PIMPINAN:</div>' +
          '<div style="display:flex;justify-content:space-between;font-size:10.5px;">' +
            '<div>Catatan Bagian Keuangan: [ &nbsp; ] Anggaran Tersedia &nbsp;&nbsp; [ &nbsp; ] Ditunda / Tidak Tersedia</div>' +
            '<div>Keputusan: [ &nbsp; ] Setuju &nbsp;&nbsp; [ &nbsp; ] Tolak &nbsp;&nbsp; [ &nbsp; ] Revisi</div>' +
          '</div>' +
        '</div>' +
        '<div class="sig-grid-4">' +
          sigBlock('Pemohon', pemohon) +
          sigBlock('Waka Sarpras', penanggungJawabNama(inst)) +
          sigBlock('Bagian Keuangan', STATE.pengaturan['keuangan_nama'] || 'Bendahara') +
          sigBlock('Menyetujui,<br>' + (PIMPINAN_JABATAN[inst] || 'Pimpinan'), pimpinanNama(inst)) +
        '</div>' +
      '</div>' +
    '</div>';

  closeModal();
  showPrintPreview(html, 'portrait');
}

// ---------------- DOKUMEN 3: SERAH TERIMA BARANG (BAST) ----------------
let BAST_ROW_COUNTER = 0;

function openModalBAST() {
  BAST_ROW_COUNTER = 0;
  const today = new Date().toISOString().slice(0, 10);
  const userInst = STATE.user.institusi || 'SMP';

  const html =
    '<form id="form-bast" onsubmit="event.preventDefault(); printBAST();">' +
      '<div class="doc-form-row">' +
        '<label>Institusi / Unit<select id="bast-institusi">' + institusiOptions(userInst) + '</select></label>' +
        '<label>Tanggal Serah Terima<input type="date" id="bast-tanggal" value="' + today + '" required></label>' +
        '<label>Jenis Penerimaan<select id="bast-jenis-terima">' +
          '<option value="Pembelian / Pengadaan Vendor">Pembelian / Pengadaan Vendor</option>' +
          '<option value="Hibah / Wakaf Donatur">Hibah / Wakaf Donatur</option>' +
          '<option value="Bantuan Yayasan">Bantuan Yayasan</option>' +
          '<option value="Mutasi Antar Unit DAFI">Mutasi Antar Unit DAFI</option>' +
        '</select></label>' +
      '</div>' +
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;background:#f8fafc;padding:12px;border-radius:6px;border:1px solid #e2e8f0;margin-bottom:12px;">' +
        '<div>' +
          '<div style="font-weight:600;font-size:12.5px;color:#1e293b;margin-bottom:6px;">PIHAK PERTAMA (Yang Menyerahkan):</div>' +
          '<label>Nama Pihak I<input id="bast-p1-nama" required placeholder="Contoh: CV. Maju Bersama / H. Fulan"></label>' +
          '<label>Jabatan / Instansi<input id="bast-p1-instansi" placeholder="Contoh: Vendor Penyedia / Donatur"></label>' +
        '</div>' +
        '<div>' +
          '<div style="font-weight:600;font-size:12.5px;color:#1e293b;margin-bottom:6px;">PIHAK KEDUA (Yang Menerima):</div>' +
          '<label>Nama Penerima<input id="bast-p2-nama" required value="' + (penanggungJawabNama(userInst) || STATE.user.nama || '') + '" placeholder="Nama Koordinator Sarpras"></label>' +
          '<label>Jabatan<input id="bast-p2-jabatan" value="Koordinator Sarpras ' + userInst + '" placeholder="Jabatan penerima"></label>' +
        '</div>' +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:12px 0 6px;">' +
        '<strong style="font-size:13px;">Daftar Barang yang Diserahterimakan:</strong>' +
        '<button type="button" class="btn-secondary btn-sm" onclick="addBastItemRow()">' + iconLabel('plus', 'Tambah Baris') + '</button>' +
      '</div>' +
      '<div style="overflow-x:auto;">' +
        '<table class="doc-items-table" id="table-bast-items">' +
          '<thead><tr>' +
            '<th style="width:30%;">Nama Barang</th>' +
            '<th style="width:35%;">Spesifikasi / Merk</th>' +
            '<th style="width:12%;">Jumlah</th>' +
            '<th style="width:13%;">Satuan</th>' +
            '<th style="width:10%;">Aksi</th>' +
          '</tr></thead>' +
          '<tbody></tbody>' +
        '</table>' +
      '</div>' +
      '<div class="modal-footer">' +
        '<button type="button" class="btn-secondary" onclick="closeModal()">' + iconLabel('xCircle', 'Batal') + '</button>' +
        '<button type="submit" class="btn-primary">' + iconLabel('printer', 'Terbitkan & Cetak BAST') + '</button>' +
      '</div>' +
    '</form>';

  openModal('Berita Acara Serah Terima Barang / Hibah (BAST)', html, 'modal-xl');
  addBastItemRow();
}

function addBastItemRow() {
  BAST_ROW_COUNTER++;
  const tbody = document.querySelector('#table-bast-items tbody');
  if (!tbody) return;
  const tr = document.createElement('tr');
  tr.id = 'bast-row-' + BAST_ROW_COUNTER;
  tr.innerHTML =
    '<td><input required class="bast-nama" placeholder="Contoh: AC Daikin 1 PK"></td>' +
    '<td><input class="bast-spek" placeholder="Contoh: Inverter R32 Putih"></td>' +
    '<td><input required type="number" min="1" class="bast-qty" value="1"></td>' +
    '<td><input class="bast-satuan" value="Unit"></td>' +
    '<td style="text-align:center;"><button type="button" class="btn-row-del" onclick="removeBastItemRow(' + BAST_ROW_COUNTER + ')" title="Hapus Baris">' + icon('trash', 13) + '</button></td>';
  tbody.appendChild(tr);
}

function removeBastItemRow(id) {
  const row = document.getElementById('bast-row-' + id);
  if (row) row.remove();
}

function printBAST() {
  const inst = document.getElementById('bast-institusi').value || 'SMP';
  const tgl = fmtDate(document.getElementById('bast-tanggal').value);
  const jenis = document.getElementById('bast-jenis-terima').value;
  const p1Nama = document.getElementById('bast-p1-nama').value;
  const p1Inst = document.getElementById('bast-p1-instansi').value || 'Pihak Pertama';
  const p2Nama = document.getElementById('bast-p2-nama').value;
  const p2Jabatan = document.getElementById('bast-p2-jabatan').value || 'Koordinator Sarpras';

  const rows = document.querySelectorAll('#table-bast-items tbody tr');
  if (rows.length === 0) { toast('Daftar barang serah terima belum diisi.', true); return; }

  const itemsHtml = Array.from(rows).map(function (r, idx) {
    const nama = r.querySelector('.bast-nama').value;
    const spek = r.querySelector('.bast-spek').value;
    const qty = parseInt(r.querySelector('.bast-qty').value, 10) || 0;
    const satuan = r.querySelector('.bast-satuan').value || 'Unit';

    return '<tr>' +
      '<td style="text-align:center;">' + (idx + 1) + '</td>' +
      '<td><strong>' + escapeHtml(nama) + '</strong></td>' +
      '<td>' + escapeHtml(spek || '-') + '</td>' +
      '<td style="text-align:center;">' + qty + ' ' + escapeHtml(satuan) + '</td>' +
      '<td style="text-align:center;color:#16a34a;font-weight:600;">Baik / Lengkap</td>' +
    '</tr>';
  }).join('');

  const noSurat = generateNoSurat('BAST', inst);

  const html =
    '<div class="print-page portrait">' + printBgImage(inst) +
      '<div class="print-content">' +
        '<div class="print-title">BERITA ACARA SERAH TERIMA BARANG (BAST)</div>' +
        '<div style="text-align:center;font-size:12px;margin:-12px 0 16px;color:#333;">Nomor: ' + noSurat + '</div>' +
        '<div class="print-clause">' +
          'Pada hari ini tanggal <strong>' + tgl + '</strong>, kami yang bertanda tangan di bawah ini:<br>' +
          '1. <strong>' + escapeHtml(p1Nama) + '</strong> (' + escapeHtml(p1Inst) + '), selanjutnya disebut <strong>PIHAK PERTAMA</strong>.<br>' +
          '2. <strong>' + escapeHtml(p2Nama) + '</strong> (' + escapeHtml(p2Jabatan) + '), selanjutnya disebut <strong>PIHAK KEDUA</strong>.' +
        '</div>' +
        '<div class="print-clause">' +
          'PIHAK PERTAMA menyerahkan kepada PIHAK KEDUA, dan PIHAK KEDUA menyatakan telah menerima dengan baik barang/aset hasil ' + jenis + ' dengan rincian sebagai berikut:' +
        '</div>' +
        '<table class="print-data-table">' +
          '<thead><tr>' +
            '<th style="width:6%;">No</th><th>Nama Barang</th><th>Spesifikasi / Merk</th><th style="width:14%;">Jumlah</th><th style="width:18%;">Kondisi Fisik</th>' +
          '</tr></thead>' +
          '<tbody>' + itemsHtml + '</tbody>' +
        '</table>' +
        '<div class="print-clause">' +
          'Telah dilakukan pemeriksaan fisik dan uji fungsi terhadap barang-barang tersebut dengan hasil sesuai spesifikasi dan kondisi baik. Sejak ditandatanganinya Berita Acara ini, pengelolaan, pencatatan inventaris, serta pemeliharaan barang beralih sepenuhnya kepada PIHAK KEDUA.' +
        '</div>' +
        '<div class="sig-grid-3">' +
          sigBlock('PIHAK PERTAMA<br>(Yang Menyerahkan)', p1Nama) +
          sigBlock('PIHAK KEDUA<br>(Yang Menerima)', p2Nama) +
          sigBlock('Mengetahui,<br>' + (PIMPINAN_JABATAN[inst] || 'Pimpinan'), pimpinanNama(inst)) +
        '</div>' +
      '</div>' +
    '</div>';

  closeModal();
  showPrintPreview(html, 'portrait');
}

// ---------------- DOKUMEN 4: BUKTI PEMINJAMAN (SURAT JALAN) ----------------
async function printSuratPeminjaman(id_pinjam) {
  try {
    let p = (PEMINJAMAN_CACHE || []).find(function (x) { return x.id_pinjam === id_pinjam; });
    if (!p) {
      const res = await api('listPeminjaman', {});
      PEMINJAMAN_CACHE = res.data;
      p = (PEMINJAMAN_CACHE || []).find(function (x) { return x.id_pinjam === id_pinjam; });
    }
    if (!p) { toast('Data peminjaman tidak ditemukan.', true); return; }

    const inst = roomInstitusi(p.ruangan_asal) || 'SMP';
    const noSurat = generateNoSurat('PINJAM', inst);

    const html =
      '<div class="print-page portrait">' + printBgImage(inst) +
        '<div class="print-content">' +
          '<div class="print-title">SURAT BUKTI PEMINJAMAN ASET (SURAT JALAN SARPRAS)</div>' +
          '<div style="text-align:center;font-size:12px;margin:-12px 0 16px;color:#333;">Nomor: ' + noSurat + '</div>' +
          '<div class="print-meta-grid">' +
            '<div class="print-meta-item"><span class="print-meta-k">ID Transaksi</span>: ' + p.id_pinjam + '</div>' +
            '<div class="print-meta-item"><span class="print-meta-k">Status Pinjam</span>: ' + p.status.toUpperCase() + '</div>' +
            '<div class="print-meta-item"><span class="print-meta-k">Nama Peminjam</span>: <strong>' + escapeHtml(p.nama_peminjam) + '</strong></div>' +
            '<div class="print-meta-item"><span class="print-meta-k">Keperluan</span>: ' + escapeHtml(p.keperluan || '-') + '</div>' +
            '<div class="print-meta-item"><span class="print-meta-k">Tanggal Pinjam</span>: ' + fmtDate(p.tanggal_pinjam) + '</div>' +
            '<div class="print-meta-item"><span class="print-meta-k">Batas Pengembalian</span>: <strong>' + fmtDate(p.rencana_kembali) + '</strong></div>' +
          '</div>' +
          '<div class="print-subtitle">Daftar Barang yang Dipinjam:</div>' +
          '<table class="print-data-table">' +
            '<thead><tr>' +
              '<th>Nomor Inventaris</th><th>Nama Barang</th><th>Spesifikasi</th><th>Ruangan Asal</th><th>Lokasi Penggunaan</th><th>Kondisi Awal</th>' +
            '</tr></thead>' +
            '<tbody><tr>' +
              '<td class="mono">' + p.nomor_inventaris + '</td>' +
              '<td><strong>' + escapeHtml(p.jenis_barang) + '</strong></td>' +
              '<td>' + escapeHtml(p.spesifikasi || '-') + '</td>' +
              '<td>' + roomName(p.ruangan_asal) + '</td>' +
              '<td>' + roomName(p.ruangan_tujuan) + '</td>' +
              '<td>' + p.kondisi_saat_pinjam + '</td>' +
            '</tr></tbody>' +
          '</table>' +
          '<div class="print-clause">' +
            '<strong>PAKTA INTEGRITAS & KETENTUAN PEMINJAMAN:</strong>' +
            '<ol>' +
              '<li>Peminjam bertanggung jawab penuh atas kebersihan, keamanan, dan keutuhan barang selama masa peminjaman.</li>' +
              '<li>Barang hanya digunakan untuk keperluan resmi institusi sesuai yang diajukan dan tidak diperkenankan dipindahtangankan kepada pihak lain.</li>' +
              '<li>Apabila terjadi kerusakan atau kehilangan akibat kelalaian pemakaian, peminjam wajib memperbaiki atau mengganti sesuai standar unit.</li>' +
              '<li>Wajib mengembalikan barang tepat waktu sebelum tanggal batas pengembalian berakhir.</li>' +
            '</ol>' +
          '</div>' +
          '<div class="sig-grid-3">' +
            sigBlock('Peminjam / Pemohon', p.nama_peminjam) +
            sigBlock('Petugas yang Menyerahkan', p.dicatat_oleh) +
            sigBlock('Mengetahui,<br>Penanggung Jawab Sarpras', penanggungJawabNama(inst)) +
          '</div>' +
        '</div>' +
      '</div>';

    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}

// ---------------- DOKUMEN 5: BERITA ACARA STOCK OPNAME ----------------
async function printBeritaAcaraOpname(institusi) {
  try {
    const res = await api('dashboardSummary', {});
    const s = res.data;
    const inst = institusi || STATE.user.institusi || 'SMP';
    const noSurat = generateNoSurat('BA-OPNAME', inst);
    const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    const siklusBulan = s.siklus_validasi_bulan || 3;
    const validCount = Math.max(0, (s.total_barang || 0) - (s.barang_perlu_validasi || 0));
    const pct = s.progres_validasi_pct !== undefined ? s.progres_validasi_pct : 100;

    const html =
      '<div class="print-page portrait">' + printBgImage(inst) +
        '<div class="print-content">' +
          '<div class="print-title">BERITA ACARA HASIL AUDIT FISIK (STOCK OPNAME) TRIWULAN</div>' +
          '<div style="text-align:center;font-size:12px;margin:-12px 0 16px;color:#333;">Nomor: ' + noSurat + '</div>' +
          '<div class="print-clause">' +
            'Pada hari ini tanggal <strong>' + today + '</strong>, Tim Verifikasi dan Audit Fisik Sarana Prasarana telah melaksanakan kegiatan Stock Opname fisik berkala (siklus ' + siklusBulan + ' bulan) terhadap seluruh inventaris aset di lingkungan <strong>' + (PIMPINAN_JABATAN[inst] ? PIMPINAN_JABATAN[inst].replace('Kepala ', '') + ' DAFI' : 'DAFI') + '</strong>.' +
          '</div>' +
          '<div class="print-subtitle">1. Ringkasan Hasil Verifikasi Fisik Aset:</div>' +
          '<table class="print-data-table">' +
            '<thead><tr><th>Indikator Pemeriksaan</th><th style="width:25%;">Jumlah Satuan</th><th>Keterangan</th></tr></thead>' +
            '<tbody>' +
              '<tr><td>Total Aset Terdaftar di Sistem</td><td class="num"><strong>' + (s.total_barang || 0).toLocaleString('id-ID') + ' unit</strong></td><td>Akumulasi aset tercatat aktif</td></tr>' +
              '<tr><td>Aset Tervalidasi Fisik (&le; ' + siklusBulan + ' Bulan)</td><td class="num" style="color:#16a34a;font-weight:600;">' + validCount.toLocaleString('id-ID') + ' unit</td><td>Sesuai keberadaan dan kondisi</td></tr>' +
              '<tr><td>Aset Jatuh Tempo Validasi Ulang</td><td class="num" style="color:#d97706;font-weight:600;">' + (s.barang_perlu_validasi || 0).toLocaleString('id-ID') + ' unit</td><td>Perlu inspeksi ulang lapangan</td></tr>' +
              '<tr><td>Tingkat Kepatuhan Audit (Progres)</td><td class="num"><strong>' + pct + '%</strong></td><td>Target akurasi minimal 90%</td></tr>' +
              '<tr><td>Total Estimasi Nilai Perolehan Aset</td><td class="num" colspan="2"><strong>' + rupiah(s.total_nilai || 0) + '</strong></td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="print-subtitle">2. Komposisi Kondisi Fisik Barang:</div>' +
          '<table class="print-data-table">' +
            '<thead><tr><th>Status / Kondisi</th><th>Jumlah Unit</th><th>Persentase</th></tr></thead>' +
            '<tbody>' +
              '<tr><td>Barang Tersedia & Berfungsi Baik</td><td class="num">' + (s.tersedia || 0) + ' unit</td><td class="num">' + (((s.tersedia || 0) / (s.total_barang || 1)) * 100).toFixed(1) + '%</td></tr>' +
              '<tr><td>Barang Sedang Dipinjam</td><td class="num">' + (s.dipinjam || 0) + ' unit</td><td class="num">' + (((s.dipinjam || 0) / (s.total_barang || 1)) * 100).toFixed(1) + '%</td></tr>' +
              '<tr><td>Barang Rusak (Ringan / Berat)</td><td class="num">' + (s.rusak || 0) + ' unit</td><td class="num">' + (((s.rusak || 0) / (s.total_barang || 1)) * 100).toFixed(1) + '%</td></tr>' +
              '<tr><td>Barang Menunggu Usulan Penghapusan</td><td class="num">' + (s.diusulkan_hapus || 0) + ' unit</td><td class="num">' + (((s.diusulkan_hapus || 0) / (s.total_barang || 1)) * 100).toFixed(1) + '%</td></tr>' +
            '</tbody>' +
          '</table>' +
          '<div class="print-clause">' +
            '<strong>Kesimpulan & Tindak Lanjut:</strong><br>' +
            'Seluruh data hasil verifikasi fisik telah dicocokkan dengan Kartu Inventaris Ruangan (KIR) masing-masing ruangan. Barang-barang yang mengalami kerusakan direkomendasikan segera dijadwalkan perawatan berkala atau diajukan peremajaan demi kelancaran kegiatan belajar mengajar.' +
          '</div>' +
          '<div class="sig-grid-3">' +
            sigBlock('Tim Auditor Fisik 1', STATE.user.nama || 'Petugas Sarpras') +
            sigBlock('Penanggung Jawab Sarpras', penanggungJawabNama(inst)) +
            sigBlock('Mengetahui / Mengesahkan,<br>' + (PIMPINAN_JABATAN[inst] || 'Pimpinan'), pimpinanNama(inst)) +
          '</div>' +
        '</div>' +
      '</div>';

    showPrintPreview(html, 'portrait');
  } catch (err) { toast(err.message, true); }
}
