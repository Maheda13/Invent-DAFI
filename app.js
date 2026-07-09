// ============================================================
// KONFIGURASI - ganti dengan URL Web App Apps Script Anda
// ============================================================
const CONFIG = {
  API_URL: 'https://script.google.com/macros/s/AKfycbyWX3q6oAeZnbvCQidqUrqYioB8VSZjoNvkhO-XeDvNXrCeY6saeIir5W6SWAWXWmY/exec'
};

let STATE = {
  token: localStorage.getItem('sidafi_token') || null,
  user: JSON.parse(localStorage.getItem('sidafi_user') || 'null'),
  barangPage: 1,
  ruanganList: [],
  barangList: [],
  referensiList: []
};

// ---------------- API HELPER ----------------
// Catatan: Content-Type text/plain sengaja dipakai supaya browser TIDAK
// mengirim preflight OPTIONS (Apps Script tidak bisa menangani OPTIONS).
async function api(action, payload) {
  const res = await fetch(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, token: STATE.token, payload: payload || {} })
  });
  const data = await res.json();
  if (!data.success) throw new Error(data.message || 'Terjadi kesalahan.');
  return data;
}

function toast(message, isError) {
  const el = document.getElementById('toast');
  el.textContent = message;
  el.className = 'toast' + (isError ? ' error' : '');
  el.classList.remove('hidden');
  setTimeout(function () { el.classList.add('hidden'); }, 3200);
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

function enterApp() {
  document.getElementById('view-login').classList.add('hidden');
  document.getElementById('view-app').classList.remove('hidden');
  document.getElementById('current-user-label').textContent = STATE.user.nama + ' — ' + STATE.user.role;
  if (STATE.user.role !== 'admin') {
    document.querySelectorAll('.admin-only').forEach(function (el) { el.classList.add('hidden'); });
  }
  loadRuanganDropdownData();
  loadReferensiDropdownData();
  switchView('dashboard');
}

if (STATE.token && STATE.user) enterApp();

// ---------------- NAVIGASI TAB ----------------
document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () { switchView(btn.dataset.view); });
});

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
  if (view === 'ruangan') loadRuangan();
  if (view === 'referensi') loadReferensi();
  if (view === 'users') loadUsers();
}

// ---------------- MODAL HELPER ----------------
function openModal(title, bodyHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = bodyHtml;
  document.getElementById('modal-overlay').classList.remove('hidden');
}
function closeModal() { document.getElementById('modal-overlay').classList.add('hidden'); }
document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', function (e) {
  if (e.target.id === 'modal-overlay') closeModal();
});

function badge(text) {
  const cls = String(text).toLowerCase().replace(/\s+/g, '-');
  return '<span class="badge badge-' + cls + '">' + text + '</span>';
}
function rupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function fmtDate(v) { if (!v) return '-'; const d = new Date(v); return isNaN(d) ? v : d.toLocaleDateString('id-ID'); }

// ---------------- DASHBOARD ----------------
async function loadDashboard() {
  const res = await api('dashboardSummary', {});
  const s = res.data;
  const cards = [
    ['Total Barang', s.total_barang],
    ['Tersedia', s.tersedia],
    ['Dipinjam', s.dipinjam],
    ['Rusak', s.rusak],
    ['Diusulkan Hapus', s.diusulkan_hapus],
    ['Total Nilai Aset', rupiah(s.total_nilai)],
    ['Kerusakan Belum Selesai', s.kerusakan_belum_selesai],
    ['Penghapusan Menunggu Keputusan', s.penghapusan_menunggu]
  ];
  document.getElementById('stat-grid').innerHTML = cards.map(function (c) {
    return '<div class="stat-card"><div class="value">' + c[1] + '</div><div class="label">' + c[0] + '</div></div>';
  }).join('');
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
      r.nama_ruangan + ' (' + r.kode_ruangan + ')</option>';
  }).join('');
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
      (r.jenis_barang === selected ? ' selected' : '') + '>' + r.jenis_barang + ' (' + r.kode_klasifikasi + ')</option>';
  }).join('');
}

// ---------------- BARANG ----------------
async function loadBarang(page) {
  const payload = {
    page: page || 1,
    pageSize: 20,
    search: document.getElementById('filter-search').value,
    golongan_barang: document.getElementById('filter-golongan').value,
    kondisi: document.getElementById('filter-kondisi').value,
    status: document.getElementById('filter-status').value
  };
  const res = await api('listBarang', payload);
  STATE.barangList = res.data;
  STATE.barangPage = payload.page;

  document.querySelector('#table-barang tbody').innerHTML = res.data.map(function (b) {
    return '<tr>' +
      '<td class="mono">' + b.nomor_inventaris + '</td>' +
      '<td>' + b.jenis_barang + '<br><span style="color:#888;font-size:11.5px;">' + (b.spesifikasi || '') + '</span></td>' +
      '<td>' + b.golongan_barang + '</td>' +
      '<td>' + b.kode_ruangan + '</td>' +
      '<td>' + badge(b.kondisi) + '</td>' +
      '<td>' + badge(b.status) + '</td>' +
      '<td class="row-actions">' +
        '<button onclick="editBarang(\'' + b.nomor_inventaris + '\')">Ubah</button>' +
        '<button onclick="printKIB(\'' + b.nomor_inventaris + '\')">Cetak KIB</button>' +
      '</td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';

  const totalPages = Math.max(1, Math.ceil(res.total / res.pageSize));
  let pagHtml = '';
  for (let i = 1; i <= totalPages; i++) {
    pagHtml += '<button class="' + (i === payload.page ? 'active' : '') + '" onclick="loadBarang(' + i + ')">' + i + '</button>';
  }
  document.getElementById('pagination-barang').innerHTML = pagHtml;
}
['filter-search', 'filter-golongan', 'filter-kondisi', 'filter-status'].forEach(function (id) {
  document.getElementById(id).addEventListener('input', function () { loadBarang(1); });
  document.getElementById(id).addEventListener('change', function () { loadBarang(1); });
});

function barangForm(data) {
  data = data || {};
  return '<form id="form-barang">' +
    '<label>Golongan Barang<select id="f-golongan">' + golonganOptions(data.golongan_barang) + '</select></label>' +
    '<label>Jenis Barang<select id="f-jenis">' +
      (data.golongan_barang ? jenisBarangOptionsForGolongan(data.golongan_barang, data.jenis_barang) : '<option value="">-- pilih golongan dulu --</option>') +
    '</select></label>' +
    '<label>Kode Klasifikasi<input id="f-kode-klasifikasi" value="' + (data.kode_klasifikasi || '') + '" readonly style="background:#f4f4f4;"></label>' +
    '<label>Spesifikasi / Merk<input id="f-spesifikasi" value="' + (data.spesifikasi || '') + '" placeholder="Contoh: Daikin 1.5 PK"></label>' +
    '<label>Nama Satuan<input id="f-satuan" value="' + (data.nama_satuan || 'Unit') + '" placeholder="Unit, Buah, Set, dst."></label>' +
    '<label>Tahun Perolehan<input required id="f-tahun" type="number" value="' + (data.tahun_perolehan || new Date().getFullYear()) + '"></label>' +
    '<label>Sumber Dana<input id="f-sumber" value="' + (data.sumber_dana || '') + '" placeholder="BOS, Yayasan, dst."></label>' +
    '<label>Harga Perolehan (Rp)<input id="f-harga" type="number" value="' + (data.harga || 0) + '"></label>' +
    '<label>No. Bukti / Nota<input id="f-bukti" value="' + (data.no_bukti_nota || '') + '"></label>' +
    '<label>Link Foto Barang<input id="f-foto-barang" value="' + (data.foto_barang || '') + '" placeholder="Tempel link Google Drive"></label>' +
    '<label>Link Foto Nota<input id="f-foto-nota" value="' + (data.foto_nota || '') + '" placeholder="Tempel link Google Drive"></label>' +
    '<label>Kondisi<select id="f-kondisi">' +
      ['baik', 'rusak ringan', 'rusak berat'].map(function (k) {
        return '<option value="' + k + '"' + (data.kondisi === k ? ' selected' : '') + '>' + k + '</option>';
      }).join('') + '</select></label>' +
    '<label>Ruangan<select id="f-ruangan">' + ruanganOptions(data.kode_ruangan) + '</select></label>' +
    '<label>Keterangan<textarea id="f-ket">' + (data.keterangan || '') + '</textarea></label>' +
    '<div class="modal-footer">' +
      '<button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
      '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button>' +
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
  bindBarangFormSubmit(null);
});

function editBarang(nomorInventaris) {
  const data = STATE.barangList.find(function (b) { return b.nomor_inventaris === nomorInventaris; });
  openModal('Ubah Barang — ' + nomorInventaris, barangForm(data));
  bindGolonganCascade();
  bindBarangFormSubmit(nomorInventaris);
}

function bindBarangFormSubmit(nomorInventaris) {
  document.getElementById('form-barang').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('saveBarang', {
        nomor_inventaris: nomorInventaris || undefined,
        golongan_barang: document.getElementById('f-golongan').value,
        jenis_barang: document.getElementById('f-jenis').value,
        kode_klasifikasi: document.getElementById('f-kode-klasifikasi').value,
        spesifikasi: document.getElementById('f-spesifikasi').value,
        nama_satuan: document.getElementById('f-satuan').value,
        tahun_perolehan: document.getElementById('f-tahun').value,
        sumber_dana: document.getElementById('f-sumber').value,
        harga: document.getElementById('f-harga').value,
        no_bukti_nota: document.getElementById('f-bukti').value,
        foto_barang: document.getElementById('f-foto-barang').value,
        foto_nota: document.getElementById('f-foto-nota').value,
        kondisi: document.getElementById('f-kondisi').value,
        kode_ruangan: document.getElementById('f-ruangan').value,
        keterangan: document.getElementById('f-ket').value
      });
      closeModal(); toast('Barang berhasil disimpan.'); loadBarang(STATE.barangPage);
    } catch (err) { toast(err.message, true); }
  });
}

async function printKIB(nomorInventaris) {
  toast('Menyiapkan PDF KIB...');
  try {
    const res = await api('cetakKIB', { nomor_inventaris: nomorInventaris });
    downloadBase64Pdf(res.base64, res.fileName);
  } catch (err) { toast(err.message, true); }
}

function downloadBase64Pdf(base64, fileName) {
  const bytes = atob(base64);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  const blob = new Blob([arr], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ---------------- PEMINJAMAN ----------------
async function loadPeminjaman() {
  const res = await api('listPeminjaman', {});
  document.querySelector('#table-peminjaman tbody').innerHTML = res.data.map(function (p) {
    const aksi = p.status === 'dipinjam'
      ? '<button onclick="kembalikanPinjam(\'' + p.id_pinjam + '\')">Kembalikan</button>' : '-';
    return '<tr><td class="mono">' + p.id_pinjam + '</td><td>' + p.nomor_inventaris + '</td>' +
      '<td>' + p.nama_peminjam + '</td><td>' + (p.keperluan || '-') + '</td><td>' + p.ruangan_tujuan + '</td>' +
      '<td>' + fmtDate(p.tanggal_pinjam) + '</td><td>' + fmtDate(p.rencana_kembali) + '</td>' +
      '<td>' + badge(p.status) + '</td><td class="row-actions">' + aksi + '</td></tr>';
  }).join('') || '<tr><td colspan="9" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-peminjaman').addEventListener('click', function () {
  openModal('Ajukan Peminjaman', '<form id="form-pinjam">' +
    '<label>Nomor Inventaris<input required id="p-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Nama Peminjam<input required id="p-nama"></label>' +
    '<label>Keperluan<input id="p-keperluan" placeholder="Contoh: Mengajar PAI Kelas 7A"></label>' +
    '<label>Ruangan Tujuan<select id="p-tujuan">' + ruanganOptions() + '</select></label>' +
    '<label>Rencana Kembali<input type="date" id="p-rencana"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Ajukan</button></div></form>');

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
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>');

  document.getElementById('form-kembali').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('kembalikanPeminjaman', { id_pinjam: id, kondisi_saat_kembali: document.getElementById('k-kondisi').value });
      closeModal(); toast('Barang berhasil dikembalikan.'); loadPeminjaman();
    } catch (err) { toast(err.message, true); }
  });
}

// ---------------- KERUSAKAN ----------------
async function loadKerusakan() {
  const res = await api('listKerusakan', {});
  document.querySelector('#table-kerusakan tbody').innerHTML = res.data.map(function (k) {
    const aksi = k.status_penanganan !== 'selesai'
      ? '<button onclick="prosesKerusakan(\'' + k.id_lapor + '\')">Proses/Selesai</button>' : '-';
    return '<tr><td class="mono">' + k.id_lapor + '</td><td>' + k.nomor_inventaris + '</td>' +
      '<td>' + fmtDate(k.tanggal_lapor) + '</td><td>' + k.pelapor + '</td>' +
      '<td>' + k.deskripsi + '</td><td>' + badge(k.tingkat_kerusakan) + '</td>' +
      '<td>' + badge(k.status_penanganan) + '</td><td class="row-actions">' + aksi + '</td></tr>';
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-kerusakan').addEventListener('click', function () {
  openModal('Lapor Kerusakan', '<form id="form-rusak">' +
    '<label>Nomor Inventaris<input required id="r-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Tingkat Kerusakan<select id="r-tingkat"><option value="ringan">Ringan</option><option value="berat">Berat</option></select></label>' +
    '<label>Deskripsi<textarea required id="r-deskripsi"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Laporkan</button></div></form>');

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
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>');

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
async function loadPerawatan() {
  const res = await api('listPerawatan', {});
  document.querySelector('#table-perawatan tbody').innerHTML = res.data.map(function (p) {
    return '<tr><td class="mono">' + p.id_rawat + '</td><td>' + p.nomor_inventaris + '</td>' +
      '<td>' + fmtDate(p.tanggal) + '</td><td>' + p.jenis_perawatan + '</td>' +
      '<td>' + p.pelaksana + '</td><td>' + rupiah(p.biaya) + '</td><td>' + (p.keterangan || '-') + '</td></tr>';
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-perawatan').addEventListener('click', function () {
  openModal('Catat Perawatan', '<form id="form-rawat">' +
    '<label>Nomor Inventaris<input required id="w-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Jenis Perawatan<input required id="w-jenis" placeholder="Servis rutin, pembersihan, dll."></label>' +
    '<label>Pelaksana<input id="w-pelaksana"></label>' +
    '<label>Biaya (Rp)<input type="number" id="w-biaya" value="0"></label>' +
    '<label>Kondisi Setelah Perawatan<select id="w-kondisi">' +
    '<option value="">-- tidak berubah --</option><option value="baik">Baik</option>' +
    '<option value="rusak ringan">Rusak Ringan</option></select></label>' +
    '<label>Keterangan<textarea id="w-ket"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>');

  document.getElementById('form-rawat').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('catatPerawatan', {
        nomor_inventaris: document.getElementById('w-kode').value,
        jenis_perawatan: document.getElementById('w-jenis').value,
        pelaksana: document.getElementById('w-pelaksana').value,
        biaya: document.getElementById('w-biaya').value,
        kondisi_setelah: document.getElementById('w-kondisi').value,
        keterangan: document.getElementById('w-ket').value
      });
      closeModal(); toast('Perawatan berhasil dicatat.'); loadPerawatan();
    } catch (err) { toast(err.message, true); }
  });
});

// ---------------- PENGHAPUSAN ----------------
const KATEGORI_PENGHAPUSAN = ['Rusak Berat', 'Rusak Ringan', 'Hilang', 'Usang', 'Habis Pakai', 'Dihibahkan'];

async function loadPenghapusan() {
  const res = await api('listPenghapusan', {});
  const isApprover = STATE.user.role === 'admin' || STATE.user.role === 'kepala_sekolah';
  document.querySelector('#table-penghapusan tbody').innerHTML = res.data.map(function (p) {
    let aksi = '-';
    if (p.status === 'diusulkan' && isApprover) {
      aksi = '<button onclick="putuskanHapus(\'' + p.id_hapus + '\',\'disetujui\')">Setujui</button>' +
        ' <button onclick="putuskanHapus(\'' + p.id_hapus + '\',\'ditolak\')">Tolak</button>';
    }
    return '<tr><td class="mono">' + p.id_hapus + '</td><td>' + p.nomor_inventaris + '</td>' +
      '<td>' + fmtDate(p.tanggal_usulan) + '</td><td>' + badge(p.kategori) + '</td><td>' + p.alasan + '</td>' +
      '<td>' + badge(p.status) + '</td><td>' + (p.disetujui_oleh || '-') + '</td>' +
      '<td class="row-actions">' + aksi + '</td></tr>';
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-penghapusan').addEventListener('click', function () {
  openModal('Ajukan Penghapusan Barang', '<form id="form-hapus">' +
    '<label>Nomor Inventaris<input required id="h-kode" placeholder="02.03.13.2023.001"></label>' +
    '<label>Kategori<select id="h-kategori">' +
      KATEGORI_PENGHAPUSAN.map(function (k) { return '<option value="' + k + '">' + k + '</option>'; }).join('') +
    '</select></label>' +
    '<label>Alasan Penghapusan<textarea required id="h-alasan" placeholder="Rusak berat & tidak ekonomis diperbaiki, dst."></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Ajukan</button></div></form>');

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
  openModal(label + ' Penghapusan', '<form id="form-putus">' +
    (status === 'disetujui' ? '<label>Nomor Berita Acara<input id="d-ba"></label>' : '') +
    '<label>Catatan<textarea id="d-ket"></textarea></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">' + label + '</button></div></form>');

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
  const res = await api('listRuangan', {});
  STATE.ruanganList = res.data;
  document.querySelector('#table-ruangan tbody').innerHTML = res.data.map(function (r) {
    return '<tr><td class="mono">' + r.kode_ruangan + '</td><td>' + (r.area || '-') + '</td>' +
      '<td>' + (r.gedung || '-') + '</td><td>' + r.nama_ruangan + '</td><td>' + (r.penanggung_jawab || '-') + '</td>' +
      '<td class="row-actions"><button onclick="printKIR(\'' + r.kode_ruangan + '\')">Cetak KIR</button></td></tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-ruangan').addEventListener('click', function () {
  openModal('Ruangan Baru', '<form id="form-ruangan">' +
    '<label>Kode Ruangan<input required id="ru-kode" placeholder="SR.AR.7A"></label>' +
    '<label>Area<input id="ru-area" placeholder="Sarirogo"></label>' +
    '<label>Gedung<input id="ru-gedung" placeholder="Arafah"></label>' +
    '<label>Nama Ruangan<input required id="ru-nama"></label>' +
    '<label>Penanggung Jawab<input id="ru-pj"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>');

  document.getElementById('form-ruangan').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('saveRuangan', {
        kode_ruangan: document.getElementById('ru-kode').value,
        area: document.getElementById('ru-area').value,
        gedung: document.getElementById('ru-gedung').value,
        nama_ruangan: document.getElementById('ru-nama').value,
        penanggung_jawab: document.getElementById('ru-pj').value
      });
      closeModal(); toast('Ruangan berhasil disimpan.'); loadRuangan(); loadRuanganDropdownData();
    } catch (err) { toast(err.message, true); }
  });
});

async function printKIR(kode) {
  toast('Menyiapkan PDF KIR...');
  try {
    const res = await api('cetakKIR', { kode_ruangan: kode });
    downloadBase64Pdf(res.base64, res.fileName);
  } catch (err) { toast(err.message, true); }
}

// ---------------- REFERENSI KODE (admin) ----------------
async function loadReferensi() {
  const res = await api('listReferensiKode', {});
  STATE.referensiList = res.data;
  document.querySelector('#table-referensi tbody').innerHTML = res.data.map(function (r) {
    return '<tr><td>' + r.golongan_barang + '</td><td class="mono">' + r.kode_golongan + '</td>' +
      '<td>' + r.jenis_barang + '</td><td class="mono">' + r.kode_klasifikasi + '</td></tr>';
  }).join('') || '<tr><td colspan="4" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

document.getElementById('btn-new-referensi').addEventListener('click', function () {
  openModal('Kode Klasifikasi Baru', '<form id="form-referensi">' +
    '<label>Golongan Barang<input required id="rf-golongan" placeholder="Alat Elektronik"></label>' +
    '<label>Kode Golongan<input id="rf-kode-golongan" placeholder="02.03"></label>' +
    '<label>Jenis Barang<input required id="rf-jenis" placeholder="Proyektor"></label>' +
    '<label>Kode Klasifikasi<input required id="rf-kode" placeholder="02.03.29"></label>' +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>');

  document.getElementById('form-referensi').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('saveReferensiKode', {
        golongan_barang: document.getElementById('rf-golongan').value,
        kode_golongan: document.getElementById('rf-kode-golongan').value,
        jenis_barang: document.getElementById('rf-jenis').value,
        kode_klasifikasi: document.getElementById('rf-kode').value
      });
      closeModal(); toast('Kode klasifikasi berhasil disimpan.'); loadReferensi(); loadReferensiDropdownData();
    } catch (err) { toast(err.message, true); }
  });
});

// ---------------- USERS (admin) ----------------
async function loadUsers() {
  const res = await api('listUsers', {});
  document.querySelector('#table-users tbody').innerHTML = res.data.map(function (u) {
    return '<tr><td class="mono">' + u.username + '</td><td>' + u.nama + '</td>' +
      '<td>' + u.role + '</td><td>' + (u.kode_ruangan || '-') + '</td>' +
      '<td>' + badge(u.status) + '</td>' +
      '<td class="row-actions"><button onclick="editUser(\'' + u.username + '\')">Ubah</button></td></tr>';
  }).join('') || '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">Belum ada data.</td></tr>';
}

function userForm(username, isEdit) {
  return '<form id="form-user">' +
    '<label>Username<input required id="u-username" ' + (isEdit ? 'readonly value="' + username + '"' : '') + '></label>' +
    (isEdit ? '' : '<label>Password<input required type="password" id="u-password"></label>') +
    '<label>Nama Lengkap<input required id="u-nama"></label>' +
    '<label>Role<select id="u-role">' +
      '<option value="admin">Admin</option><option value="petugas">Petugas Ruangan</option>' +
      '<option value="kepala_sekolah">Kepala Sekolah</option></select></label>' +
    '<label>Kode Ruangan (untuk role Petugas)<select id="u-ruangan"><option value="">-</option>' + ruanganOptions() + '</select></label>' +
    (isEdit ? '<label>Status<select id="u-status"><option value="aktif">Aktif</option><option value="nonaktif">Nonaktif</option></select></label>' : '') +
    (isEdit ? '<label>Reset Password (kosongkan jika tidak diubah)<input type="password" id="u-newpass"></label>' : '') +
    '<div class="modal-footer"><button type="button" class="btn-secondary" onclick="closeModal()">Batal</button>' +
    '<button type="submit" class="btn-primary" style="width:auto;padding:9px 18px;">Simpan</button></div></form>';
}

document.getElementById('btn-new-user').addEventListener('click', function () {
  openModal('Pengguna Baru', userForm(null, false));
  document.getElementById('form-user').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('createUser', {
        username: document.getElementById('u-username').value,
        password: document.getElementById('u-password').value,
        nama: document.getElementById('u-nama').value,
        role: document.getElementById('u-role').value,
        kode_ruangan: document.getElementById('u-ruangan').value
      });
      closeModal(); toast('Pengguna berhasil dibuat.'); loadUsers();
    } catch (err) { toast(err.message, true); }
  });
});

function editUser(username) {
  openModal('Ubah Pengguna — ' + username, userForm(username, true));
  document.getElementById('form-user').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('updateUser', {
        username: username,
        nama: document.getElementById('u-nama').value,
        role: document.getElementById('u-role').value,
        kode_ruangan: document.getElementById('u-ruangan').value,
        status: document.getElementById('u-status').value,
        newPassword: document.getElementById('u-newpass').value || undefined
      });
      closeModal(); toast('Pengguna berhasil diperbarui.'); loadUsers();
    } catch (err) { toast(err.message, true); }
  });
}
