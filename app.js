// Constants
const HARGA_SAPI = 3500000;
const HARGA_KAMBING = 75000;
const PERMINTAAN_SAPI = "Daging 4 kg + 3 bungkus (sapi/kambing)";
const PERMINTAAN_KAMBING = "Sampil + hati setengah";

const WILAYAH_OPTIONS = [
    "RT 1 RW 6", "RT 2 RW 6", "RT 3 RW 6", "RT 4 RW 6", "RT 5 RW 6", "RT 6 RW 6",
    "RT 1 RW 7", "RT 2 RW 7", "RT 3 RW 7", "RT 4 RW 7", "RT 2 RW 12", "Lainnya"
];
const KELOMPOK_OPTIONS = ["Sapi Kelompok 1", "Sapi Kelompok 2", "Sapi Kelompok 3", "Sapi Kelompok 4", "Kambing"];
const TUGAS_OPTIONS = [
    "Ketua",
    "Wakil Ketua",
    "Penanggung Jawab",
    "Bendahara",
    "Sekretaris",
    "Dokumentasi",
    "Keamanan",
    "Kebersihan",
    "Konsumsi",
    "Pembagian Daging ke Pengkurban",
    "Pemotongan Tulang",
    "Penanganan, Penimbangan dan Distribusi Daging",
    "Pencacahan Kambing",
    "Pencacahan Sapi",
    "Pencucian Jerohan",
    "Penerima Hewan Kurban",
    "Pengadaan Hewan Kurban",
    "Pengasah Pisau",
    "Pengelola Kulit",
    "Penghubung Daging ke Ibu-ibu",
    "Pengirim Daging ke Donatur",
    "Penyembelihan Kambing",
    "Perlengkapan",
    "Relawan"
];

// State
let currentUser = null;
let currentView = 'pengqurban';

// DOM Elements
const appContent = document.getElementById('app-content');
const navItems = document.querySelectorAll('.nav-item');
const authBtn = document.getElementById('auth-btn');
const userAvatar = document.getElementById('user-avatar');
const loginModal = document.getElementById('login-modal');
const loginForm = document.getElementById('login-form');
const dynamicModalContainer = document.getElementById('dynamic-modal-container');
const toastContainer = document.getElementById('toast-container');

// Utils
const canEditAll = () => currentUser && (!currentUser.role || currentUser.role === 'admin');
const canEditDokumentasi = () => currentUser && (canEditAll() || currentUser.role === 'dokumentasi');
const canEditDistribusi = () => currentUser && (canEditAll() || currentUser.role === 'distribusi');

const formatRupiah = (number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(number);
};

const showToast = (message, type = 'success') => {
    const toast = document.createElement('div');
    const bgColor = type === 'success' ? 'bg-qurban-600' : 'bg-red-500';
    const icon = type === 'success' ? 'ph-check-circle' : 'ph-warning-circle';

    toast.className = `flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-xl shadow-lg toast-enter pointer-events-auto`;
    toast.innerHTML = `<i class="ph ${icon} text-xl"></i> <span class="font-medium text-sm">${message}</span>`;

    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.classList.replace('toast-enter', 'toast-leave');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
};

const showModal = (htmlContent) => {
    dynamicModalContainer.innerHTML = htmlContent;
    const modal = dynamicModalContainer.firstElementChild;
    // trigger animation
    requestAnimationFrame(() => modal.classList.add('modal-enter'));

    // Add close listener
    const closeBtns = modal.querySelectorAll('.modal-close-btn');
    closeBtns.forEach(btn => {
        btn.addEventListener('click', closeModal);
    });
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
};

const closeModal = () => {
    if (dynamicModalContainer.firstElementChild) {
        dynamicModalContainer.innerHTML = '';
    }
};

const showConfirm = (title, message, confirmText = 'Hapus', cancelText = 'Batal') => {
    return new Promise((resolve) => {
        const html = `
            <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[110] flex items-center justify-center p-4 modal-enter">
                <div class="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl">
                    <div class="p-6 text-center">
                        <div class="w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-3xl mx-auto mb-4">
                            <i class="ph ph-warning-circle"></i>
                        </div>
                        <h3 class="text-xl font-bold text-slate-800 mb-2">${title}</h3>
                        <p class="text-sm text-slate-500 mb-6">${message}</p>
                        <div class="flex gap-3">
                            <button id="btn-confirm-cancel" class="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">${cancelText}</button>
                            <button id="btn-confirm-ok" class="flex-1 py-2.5 rounded-xl text-white font-medium bg-red-500 hover:bg-red-600 transition-colors">${confirmText}</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        const container = document.createElement('div');
        container.innerHTML = html;
        document.body.appendChild(container);

        const close = (result) => {
            const modal = container.firstElementChild;
            modal.style.animation = 'fadeOut 0.2s ease-in forwards';
            setTimeout(() => {
                container.remove();
                resolve(result);
            }, 200);
        };

        container.querySelector('#btn-confirm-cancel').addEventListener('click', () => close(false));
        container.querySelector('#btn-confirm-ok').addEventListener('click', () => close(true));
    });
};

// -------------------------------------------------------------------
// AUTHENTICATION
// -------------------------------------------------------------------

const checkAuth = () => {
    const savedUser = localStorage.getItem('qurban_user');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        updateAuthUI();
    }
};

const updateAuthUI = () => {
    if (currentUser) {
        authBtn.innerHTML = `<i class="ph ph-sign-out"></i> Logout`;
        authBtn.classList.replace('text-qurban-700', 'text-slate-600');
        authBtn.classList.replace('bg-qurban-50', 'bg-slate-100');
        userAvatar.classList.remove('hidden');
        userAvatar.innerHTML = `<img src="https://ui-avatars.com/api/?name=${currentUser.nama}&background=15803d&color=fff" alt="User" class="w-full h-full object-cover">`;
    } else {
        authBtn.innerHTML = `Login`;
        authBtn.classList.replace('text-slate-600', 'text-qurban-700');
        authBtn.classList.replace('bg-slate-100', 'bg-qurban-50');
        userAvatar.classList.add('hidden');
    }
    // Re-render current view to apply auth-based UI changes
    renderView(currentView);
};

authBtn.addEventListener('click', () => {
    if (currentUser) {
        // Logout
        currentUser = null;
        localStorage.removeItem('qurban_user');
        updateAuthUI();
        showToast('Berhasil logout');
    } else {
        // Show login modal
        loginModal.classList.remove('hidden');
        requestAnimationFrame(() => {
            loginModal.classList.remove('opacity-0');
            loginModal.querySelector('#login-modal-content').classList.remove('scale-95');
        });
    }
});

document.getElementById('close-login-btn').addEventListener('click', () => {
    loginModal.classList.add('opacity-0');
    loginModal.querySelector('#login-modal-content').classList.add('scale-95');
    setTimeout(() => loginModal.classList.add('hidden'), 300);
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    try {
        const { user } = await window.api.pengguna.login(username, password);
        currentUser = user;
        localStorage.setItem('qurban_user', JSON.stringify(user));
        document.getElementById('close-login-btn').click(); // close modal
        loginForm.reset();
        updateAuthUI();
        showToast(`Selamat datang, ${user.nama}!`);
    } catch (err) {
        showToast(err.message || 'Login gagal', 'error');
    }
});


// -------------------------------------------------------------------
// ROUTING & VIEWS
// -------------------------------------------------------------------

navItems.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const target = e.currentTarget.dataset.target;
        navItems.forEach(b => {
            b.classList.remove('active', 'text-qurban-700');
            b.classList.add('text-slate-400');
        });
        e.currentTarget.classList.add('active', 'text-qurban-700');
        e.currentTarget.classList.remove('text-slate-400');

        renderView(target);
    });
});

const renderView = async (view, param = null) => {
    currentView = view;
    appContent.classList.add('opacity-0'); // fade out

    setTimeout(async () => {
        appContent.innerHTML = '<div class="flex justify-center p-12"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-qurban-600"></div></div>';
        appContent.classList.remove('opacity-0'); // show loader

        try {
            let html = '';
            switch (view) {
                case 'pengqurban': html = await buildPengqurbanView(); break;
                case 'penerima': html = await buildPenerimaView(); break;
                case 'panitia': html = await buildPanitiaView(); break;
                case 'absensi': html = await buildAbsensiView(); break;
                case 'keuangan': html = await buildKeuanganView(); break;
                case 'distribusi': html = await buildDistribusiView(); break;
                case 'dokumentasi': html = await buildDokumentasiView(); break;
                case 'dokumentasi_detail': html = await buildDokumentasiDetailView(param); break;
            }
            appContent.innerHTML = html;
            attachViewListeners(view, param);
        } catch (err) {
            appContent.innerHTML = `<div class="p-6 text-center text-red-500">Gagal memuat data: ${err.message}</div>`;
        }
    }, 200);
};

// ===================================================================
// 1. PENGQURBAN VIEW
// ===================================================================
async function buildPengqurbanView() {
    const { data: qurbans } = await window.api.pengqurban.select();

    const sapiGroups = KELOMPOK_OPTIONS.filter(k => k.includes('Sapi'));
    const kambingGroup = 'Kambing';

    let totalHewanSapi = 0;
    let totalOrang = qurbans ? qurbans.length : 0;

    // Count hewan
    sapiGroups.forEach(g => {
        if (qurbans.some(q => q.kelompok === g)) totalHewanSapi += 1; // 1 kelompok sapi = 1 hewan
    });
    const kambingCount = qurbans.filter(q => q.kelompok === kambingGroup).length;

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header Card -->
            <div class="bg-qurban-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 opacity-10">
                    <i class="ph ph-cow text-9xl"></i>
                </div>
                <div class="flex justify-between items-start relative z-10">
                    <div>
                        <h2 class="text-sm font-medium text-qurban-100 mb-1">DASHBOARD OVERVIEW</h2>
                        <h3 class="text-2xl font-bold mb-4">Progress Qurban</h3>
                    </div>
                    ${canEditAll() ? `
                    <button id="btn-download-pengqurban" class="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span>Excel</span>
                    </button>
                    ` : ''}
                </div>
                <div class="flex gap-6 relative z-10">
                    <div>
                        <div class="text-3xl font-bold">${totalHewanSapi}</div>
                        <div class="text-xs text-qurban-200">Sapi</div>
                    </div>
                    <div class="w-px bg-qurban-600"></div>
                    <div>
                        <div class="text-3xl font-bold">${kambingCount}</div>
                        <div class="text-xs text-qurban-200">Kambing</div>
                    </div>
                    <div class="w-px bg-qurban-600"></div>
                    <div>
                        <div class="text-3xl font-bold">${totalOrang}</div>
                        <div class="text-xs text-qurban-200">Pengqurban</div>
                    </div>
                </div>
            </div>

            <!-- Dokumentasi Banner -->
            <div class="bg-qurban-50 border border-qurban-100 rounded-2xl p-4 flex justify-between items-center cursor-pointer hover:bg-qurban-100 transition-colors" id="btn-lihat-dokumentasi">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-qurban-500 text-white flex items-center justify-center">
                        <i class="ph ph-images text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-qurban-900">Dokumentasi Kurban</h4>
                        <p class="text-xs text-qurban-700">Lihat foto & video pelaksanaan</p>
                    </div>
                </div>
                <i class="ph ph-caret-right text-qurban-600 font-bold"></i>
            </div>
    `;

    // Render Sapi Groups
    sapiGroups.forEach((group, index) => {
        const members = qurbans.filter(q => q.kelompok === group);
        const isFull = members.length >= 7;

        html += `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div class="p-4 border-b border-slate-50 flex justify-between items-center">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-qurban-50 text-qurban-600 flex items-center justify-center font-bold border border-qurban-100">
                            ${index + 1}
                        </div>
                        <div>
                            <h4 class="font-semibold text-slate-800">${group}</h4>
                            <span class="text-xs font-medium px-2 py-0.5 rounded-full ${isFull ? 'bg-qurban-50 text-qurban-600' : 'bg-orange-50 text-orange-600'}">
                                ${isFull ? 'Penuh (7/7)' : `Sisa ${7 - members.length} Slot`}
                            </span>
                        </div>
                    </div>
                    ${canEditAll() && !isFull ? `
                        <button class="text-qurban-600 hover:bg-qurban-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium btn-add-qurban" data-kel="${group}">
                            <i class="ph ph-user-plus text-lg"></i> Tambah
                        </button>
                    ` : ''}
                </div>
                <div class="p-2">
                    ${members.length === 0 ? `<div class="p-4 text-center text-sm text-slate-400">Belum ada anggota</div>` : ''}
                    ${members.map((m, i) => `
                        <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                                    ${i + 1}
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-slate-800 flex flex-col gap-1 mb-1">
                                        <div class="flex items-center gap-2">
                                            ${m.nama}
                                            ${m.status_lunas
                ? '<span class="bg-qurban-100 text-qurban-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Lunas</span>'
                : `<span class="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${formatRupiah(m.setoran || 0)} / ${formatRupiah(HARGA_SAPI)}</span>`
            }
                                        </div>
                                    </div>
                                    <div class="text-xs text-slate-500">${m.wilayah}${m.wilayah === 'Lainnya' && m.alamat ? ` - ${m.alamat}` : ''}</div>
                                </div>
                            </div>
                            ${canEditAll() ? `
                                <div class="flex gap-1">
                                    <button class="p-1.5 text-slate-400 hover:text-blue-500 btn-edit-qurban" data-id="${m.id}"><i class="ph ph-pencil-simple"></i></button>
                                    <button class="p-1.5 text-slate-400 hover:text-red-500 btn-delete-qurban" data-id="${m.id}"><i class="ph ph-trash"></i></button>
                                </div>
                            ` : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    // Render Kambing Group
    const kambingMembers = qurbans.filter(q => q.kelompok === kambingGroup);
    kambingMembers.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));

    html += `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-4">
            <div class="p-4 border-b border-slate-50 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                        K
                    </div>
                    <div>
                        <h4 class="font-semibold text-slate-800">Kambing</h4>
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            ${kambingMembers.length} Anggota
                        </span>
                    </div>
                </div>
                ${canEditAll() ? `
                    <button class="text-qurban-600 hover:bg-qurban-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium btn-add-qurban" data-kel="${kambingGroup}">
                        <i class="ph ph-user-plus text-lg"></i> Tambah
                    </button>
                ` : ''}
            </div>
            <div class="p-2">
                ${kambingMembers.length === 0 ? `<div class="p-4 text-center text-sm text-slate-400">Belum ada pengqurban kambing</div>` : ''}
                ${kambingMembers.map((m, index) => `
                    <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                                ${index + 1}
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-800 flex flex-col gap-1 mb-1">
                                    <div class="flex items-center gap-2">
                                        ${m.nama}
                                        ${m.status_lunas
            ? '<span class="bg-qurban-100 text-qurban-700 text-[10px] px-2 py-0.5 rounded-full font-bold">Lunas</span>'
            : `<span class="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold">${formatRupiah(m.setoran || 0)} / ${formatRupiah(HARGA_KAMBING)}</span>`
        }
                                    </div>
                                </div>
                                <div class="text-xs text-slate-500">${m.wilayah}${m.wilayah === 'Lainnya' && m.alamat ? ` - ${m.alamat}` : ''}</div>
                            </div>
                        </div>
                        ${canEditAll() ? `
                            <div class="flex gap-1">
                                <button class="p-1.5 text-slate-400 hover:text-blue-500 btn-edit-qurban" data-id="${m.id}"><i class="ph ph-pencil-simple"></i></button>
                                <button class="p-1.5 text-slate-400 hover:text-red-500 btn-delete-qurban" data-id="${m.id}"><i class="ph ph-trash"></i></button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    </div>`;

    return html;
}

// Form Pengqurban
const showFormPengqurban = async (id = null, defaultKelompok = null) => {
    let item = {
        nama: '',
        wilayah: '',
        alamat: '',
        no_telp: '',
        kelompok: defaultKelompok || KELOMPOK_OPTIONS[0],
        status_lunas: true,
        setoran: 0,
        permintaan_daging: ''
    };
    if (id) {
        const { data } = await window.api.pengqurban.select();
        const found = data.find(i => i.id === id);
        if (found) item = { ...item, ...found };
    }

    const html = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden items-end sm:items-center justify-center p-0 sm:p-4 opacity-0">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 class="text-lg font-bold text-slate-800">${id ? 'Edit' : 'Tambah'} Pengqurban</h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                <div class="p-5 overflow-y-auto">
                    <form id="form-pengqurban" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Kelompok</label>
                            <select id="fq-kelompok" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none bg-slate-50">
                                ${KELOMPOK_OPTIONS.map(opt => `<option value="${opt}" ${item.kelompok === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                            <input type="text" id="fq-nama" value="${item.nama}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Masukkan nama">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Wilayah</label>
                            <select id="fq-wilayah" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none">
                                <option value="">Pilih Wilayah</option>
                                ${WILAYAH_OPTIONS.map(opt => `<option value="${opt}" ${item.wilayah === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                        <div id="fq-alamat-container" class="${item.wilayah === 'Lainnya' ? '' : 'hidden'}">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Alamat Lengkap</label>
                            <textarea id="fq-alamat" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Masukkan alamat lengkap">${item.alamat || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">No. Telp (Opsional)</label>
                            <input type="tel" id="fq-notelp" value="${item.no_telp || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Contoh: 0812...">
                        </div>
                        <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                            <div class="relative w-12 h-6">
                                <input type="checkbox" id="fq-lunas" class="sr-only toggle-checkbox" ${item.status_lunas ? 'checked' : ''}>
                                <div class="toggle-label absolute inset-0"></div>
                                <div class="toggle-dot absolute shadow-sm"></div>
                            </div>
                            <span class="text-sm font-medium text-slate-700">Status Lunas</span>
                        </label>
                        <div id="fq-setoran-container" class="${item.status_lunas ? 'hidden' : ''}">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Jumlah Setoran (Rp)</label>
                            <input type="number" id="fq-setoran" value="${item.setoran || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Masukkan jumlah uang dibayarkan">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Permintaan Daging</label>
                            <textarea id="fq-permintaan" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Otomatis diisi, bisa diubah">${item.permintaan_daging || ''}</textarea>
                        </div>
                        <button type="submit" class="w-full bg-qurban-700 hover:bg-qurban-800 text-white font-medium py-3 rounded-xl transition-colors mt-6">
                            Simpan Data
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    showModal(html);

    // Logic for Wilayah dropdown
    const wilSelect = document.getElementById('fq-wilayah');
    const alContainer = document.getElementById('fq-alamat-container');
    wilSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Lainnya') alContainer.classList.remove('hidden');
        else alContainer.classList.add('hidden');
    });

    const lunasCheck = document.getElementById('fq-lunas');
    const setoranContainer = document.getElementById('fq-setoran-container');
    const setoranInput = document.getElementById('fq-setoran');
    const kelompokSelect = document.getElementById('fq-kelompok');
    const permintaanInput = document.getElementById('fq-permintaan');

    const updateSetoranVisibility = () => {
        if (lunasCheck.checked) {
            setoranContainer.classList.add('hidden');
        } else {
            setoranContainer.classList.remove('hidden');
        }
    };

    const updateDefaults = () => {
        const isSapi = kelompokSelect.value.includes('Sapi');
        const defaultPermintaan = isSapi ? PERMINTAAN_SAPI : PERMINTAAN_KAMBING;

        // Auto fill permintaan if empty or matching previous default
        if (!permintaanInput.value || permintaanInput.value === PERMINTAAN_SAPI || permintaanInput.value === PERMINTAAN_KAMBING) {
            permintaanInput.value = defaultPermintaan;
        }
    };

    lunasCheck.addEventListener('change', updateSetoranVisibility);
    kelompokSelect.addEventListener('change', updateDefaults);

    // Call once to set initial defaults for new records
    if (!id) {
        updateDefaults();
    }

    document.getElementById('form-pengqurban').addEventListener('submit', async (e) => {
        e.preventDefault();

        let isLunas = lunasCheck.checked;
        const kelompok = kelompokSelect.value;
        const targetHarga = kelompok.includes('Sapi') ? HARGA_SAPI : HARGA_KAMBING;

        let setoran = parseInt(setoranInput.value) || 0;

        if (isLunas) {
            setoran = targetHarga;
        } else {
            if (setoran >= targetHarga) {
                isLunas = true;
                setoran = targetHarga;
            }
        }

        const data = {
            kelompok: kelompok,
            nama: document.getElementById('fq-nama').value,
            wilayah: document.getElementById('fq-wilayah').value,
            alamat: document.getElementById('fq-wilayah').value === 'Lainnya' ? document.getElementById('fq-alamat').value : '',
            no_telp: document.getElementById('fq-notelp').value,
            status_lunas: isLunas,
            setoran: setoran,
            permintaan_daging: permintaanInput.value
        };

        try {
            if (id) await window.api.pengqurban.update(id, data);
            else await window.api.pengqurban.insert(data);
            showToast('Data berhasil disimpan');
            closeModal();
            renderView('pengqurban');
        } catch (err) {
            showToast('Gagal menyimpan data', 'error');
        }
    });
};

// ===================================================================
// ATTACH LISTENERS FOR VIEWS
// ===================================================================
function attachViewListeners(view, param = null) {
    if (view === 'pengqurban') {
        const btnDokumentasi = document.getElementById('btn-lihat-dokumentasi');
        if (btnDokumentasi) {
            btnDokumentasi.addEventListener('click', () => {
                navItems.forEach(b => b.classList.remove('active', 'text-qurban-700'));
                renderView('dokumentasi');
            });
        }

        const btnDownload = document.getElementById('btn-download-pengqurban');
        if (btnDownload) {
            btnDownload.addEventListener('click', async () => {
                try {
                    const { data } = await window.api.pengqurban.select();
                    if (!data || data.length === 0) return showToast('Data kosong', 'error');

                    // Exclude 'id' from data
                    const exportData = data.map(item => {
                        const { id, ...rest } = item;
                        return rest;
                    });

                    // Create worksheet and workbook using SheetJS
                    const ws = XLSX.utils.json_to_sheet(exportData);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, "Pengqurban");

                    // Trigger download
                    XLSX.writeFile(wb, "Laporan_Pengqurban.xlsx");
                    showToast('Laporan berhasil diunduh!');
                } catch (err) {
                    showToast('Gagal mengunduh laporan: ' + err.message, 'error');
                }
            });
        }

        document.querySelectorAll('.btn-add-qurban').forEach(btn => {
            btn.addEventListener('click', (e) => showFormPengqurban(null, e.currentTarget.dataset.kel));
        });
        document.querySelectorAll('.btn-edit-qurban').forEach(btn => {
            btn.addEventListener('click', (e) => showFormPengqurban(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete-qurban').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.id;
                if (await showConfirm('Hapus Data', 'Yakin ingin menghapus data pengqurban ini?')) {
                    try {
                        await window.api.pengqurban.delete(id);
                        showToast('Data terhapus');
                        renderView('pengqurban');
                    } catch (err) {
                        showToast('Gagal menghapus: ' + err.message, 'error');
                    }
                }
            });
        });
    } else if (view === 'penerima' && typeof attachPenerimaListeners === 'function') {
        attachPenerimaListeners();
    } else if (view === 'panitia' && typeof attachPanitiaListeners === 'function') {
        attachPanitiaListeners();
    } else if (view === 'absensi' && typeof attachAbsensiListeners === 'function') {
        attachAbsensiListeners();
    } else if (view === 'keuangan' && typeof attachKeuanganListeners === 'function') {
        attachKeuanganListeners();
    } else if (view === 'distribusi' && typeof attachDistribusiListeners === 'function') {
        attachDistribusiListeners();
    } else if (view === 'dokumentasi' && typeof attachDokumentasiListeners === 'function') {
        attachDokumentasiListeners();
    } else if (view === 'dokumentasi_detail' && typeof attachDokumentasiDetailListeners === 'function') {
        attachDokumentasiDetailListeners(param);
    }
}

// Initialize
checkAuth();
renderView('pengqurban');
