// Constants
const WILAYAH_OPTIONS = [
    "RT 1 RW 6", "RT 2 RW 6", "RT 3 RW 6", "RT 4 RW 6", "RT 5 RW 6", "RT 6 RW 6", 
    "RT 1 RW 7", "RT 2 RW 7", "RT 3 RW 7", "RT 4 RW 7", "RT 2 RW 12", "Lainnya"
];
const KELOMPOK_OPTIONS = ["Sapi Kelompok 1", "Sapi Kelompok 2", "Sapi Kelompok 3", "Sapi Kelompok 4", "Kambing"];
const TUGAS_OPTIONS = ["Ketua", "Bendahara", "Sekretaris", "Penyembelihan", "Pencacahan", "Penimbangan", "Distribusi"];

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
    const closeBtn = modal.querySelector('.modal-close-btn');
    if(closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    // Close on backdrop click
    modal.addEventListener('click', (e) => {
        if(e.target === modal) closeModal();
    });
};

const closeModal = () => {
    if(dynamicModalContainer.firstElementChild) {
        dynamicModalContainer.innerHTML = '';
    }
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

const renderView = async (view) => {
    currentView = view;
    appContent.classList.add('opacity-0'); // fade out
    
    setTimeout(async () => {
        appContent.innerHTML = '<div class="flex justify-center p-12"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-qurban-600"></div></div>';
        appContent.classList.remove('opacity-0'); // show loader
        
        try {
            let html = '';
            switch(view) {
                case 'pengqurban': html = await buildPengqurbanView(); break;
                case 'penerima': html = await buildPenerimaView(); break;
                case 'panitia': html = await buildPanitiaView(); break;
                case 'absensi': html = await buildAbsensiView(); break;
                case 'keuangan': html = await buildKeuanganView(); break;
            }
            appContent.innerHTML = html;
            attachViewListeners(view);
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
    
    let totalHewan = 0;
    let totalOrang = qurbans.length;
    
    // Count hewan
    sapiGroups.forEach(g => {
        if(qurbans.some(q => q.kelompok === g)) totalHewan += 1; // 1 kelompok sapi = 1 hewan
    });
    const kambingCount = qurbans.filter(q => q.kelompok === kambingGroup).length;
    totalHewan += kambingCount;

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header Card -->
            <div class="bg-qurban-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 opacity-10">
                    <i class="ph ph-cow text-9xl"></i>
                </div>
                <h2 class="text-sm font-medium text-qurban-100 mb-1">DASHBOARD OVERVIEW</h2>
                <h3 class="text-2xl font-bold mb-4">Progress Qurban</h3>
                <div class="flex gap-6">
                    <div>
                        <div class="text-3xl font-bold">${totalHewan}</div>
                        <div class="text-xs text-qurban-200">Hewan</div>
                    </div>
                    <div class="w-px bg-qurban-600"></div>
                    <div>
                        <div class="text-3xl font-bold">${totalOrang}</div>
                        <div class="text-xs text-qurban-200">Pengqurban</div>
                    </div>
                </div>
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
                    ${currentUser && !isFull ? `
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
                                    ${m.nama.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                        ${m.nama}
                                        ${m.status_lunas ? '<i class="ph-fill ph-check-circle text-qurban-500 text-xs" title="Lunas"></i>' : ''}
                                    </div>
                                    <div class="text-xs text-slate-500">${m.wilayah}${m.wilayah==='Lainnya' && m.alamat ? ` - ${m.alamat}` : ''}</div>
                                </div>
                            </div>
                            ${currentUser ? `
                                <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    html += `
        <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mt-4">
            <div class="p-4 border-b border-slate-50 flex justify-between items-center">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-qurban-50 text-qurban-600 flex items-center justify-center font-bold border border-qurban-100">
                        <i class="ph-fill ph-paw-print text-xl"></i>
                    </div>
                    <div>
                        <h4 class="font-semibold text-slate-800">Kambing</h4>
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                            ${kambingMembers.length} Anggota
                        </span>
                    </div>
                </div>
                ${currentUser ? `
                    <button class="text-qurban-600 hover:bg-qurban-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium btn-add-qurban" data-kel="${kambingGroup}">
                        <i class="ph ph-user-plus text-lg"></i> Tambah
                    </button>
                ` : ''}
            </div>
            <div class="p-2">
                ${kambingMembers.length === 0 ? `<div class="p-4 text-center text-sm text-slate-400">Belum ada pengqurban kambing</div>` : ''}
                ${kambingMembers.map(m => `
                    <div class="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                        <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-medium">
                                ${m.nama.substring(0,2).toUpperCase()}
                            </div>
                            <div>
                                <div class="text-sm font-semibold text-slate-800 flex items-center gap-2">
                                    ${m.nama}
                                    ${m.status_lunas ? '<i class="ph-fill ph-check-circle text-qurban-500 text-xs" title="Lunas"></i>' : ''}
                                </div>
                                <div class="text-xs text-slate-500">${m.wilayah}${m.wilayah==='Lainnya' && m.alamat ? ` - ${m.alamat}` : ''}</div>
                            </div>
                        </div>
                        ${currentUser ? `
                            <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:opacity-100">
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
    let item = { nama: '', wilayah: '', alamat: '', no_telp: '', kelompok: defaultKelompok || KELOMPOK_OPTIONS[0], status_lunas: false };
    if (id) {
        const { data } = await window.api.pengqurban.select();
        item = data.find(i => i.id === id);
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
        if(e.target.value === 'Lainnya') alContainer.classList.remove('hidden');
        else alContainer.classList.add('hidden');
    });

    document.getElementById('form-pengqurban').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            kelompok: document.getElementById('fq-kelompok').value,
            nama: document.getElementById('fq-nama').value,
            wilayah: document.getElementById('fq-wilayah').value,
            alamat: document.getElementById('fq-wilayah').value === 'Lainnya' ? document.getElementById('fq-alamat').value : '',
            no_telp: document.getElementById('fq-notelp').value,
            status_lunas: document.getElementById('fq-lunas').checked
        };
        
        try {
            if(id) await window.api.pengqurban.update(id, data);
            else await window.api.pengqurban.insert(data);
            showToast('Data berhasil disimpan');
            closeModal();
            renderView('pengqurban');
        } catch(err) {
            showToast('Gagal menyimpan data', 'error');
        }
    });
};

// ===================================================================
// ATTACH LISTENERS FOR VIEWS
// ===================================================================
function attachViewListeners(view) {
    if(view === 'pengqurban') {
        document.querySelectorAll('.btn-add-qurban').forEach(btn => {
            btn.addEventListener('click', (e) => showFormPengqurban(null, e.currentTarget.dataset.kel));
        });
        document.querySelectorAll('.btn-edit-qurban').forEach(btn => {
            btn.addEventListener('click', (e) => showFormPengqurban(e.currentTarget.dataset.id));
        });
        document.querySelectorAll('.btn-delete-qurban').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if(confirm('Yakin ingin menghapus data ini?')) {
                    await window.api.pengqurban.delete(e.currentTarget.dataset.id);
                    showToast('Data terhapus');
                    renderView('pengqurban');
                }
            });
        });
    } else if(view === 'penerima' && typeof attachPenerimaListeners === 'function') {
        attachPenerimaListeners();
    } else if(view === 'panitia' && typeof attachPanitiaListeners === 'function') {
        attachPanitiaListeners();
    } else if(view === 'absensi' && typeof attachAbsensiListeners === 'function') {
        attachAbsensiListeners();
    } else if(view === 'keuangan' && typeof attachKeuanganListeners === 'function') {
        attachKeuanganListeners();
    }
}

// Initialize
checkAuth();
renderView('pengqurban');
