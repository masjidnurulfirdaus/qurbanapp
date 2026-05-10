// ===================================================================
// 3. PANITIA VIEW
// ===================================================================
async function buildPanitiaView() {
    const { data: panitias } = await window.api.panitia.select();

    const activeCount = panitias.length;
    const relawanCount = panitias.filter(p => p.tugas.includes('Relawan')).length;
    const panitiaCount = activeCount - relawanCount;

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header -->
            <div class="bg-qurban-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col gap-2">
                <div class="flex justify-between items-center">
                    <div class="absolute -right-4 -bottom-4 opacity-10">
                        <i class="ph ph-identification-badge text-9xl"></i>
                    </div>
                    <div>
                        <h2 class="text-sm font-medium text-qurban-100 mb-1">Total Panitia Aktif</h2>
                        <div class="flex items-baseline gap-2 mb-3">
                            <h3 class="text-4xl font-bold">${activeCount}</h3>
                            <span class="text-sm">Orang</span>
                        </div>
                        <div class="flex gap-2">
                            <span class="text-[10px] bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">${panitiaCount} Panita</span>
                            <span class="text-[10px] bg-white/20 px-2 py-1 rounded-md backdrop-blur-sm">${relawanCount} Relawan</span>
                        </div>
                    </div>
                    ${currentUser ? `
                        <button class="w-12 h-12 bg-white text-qurban-700 rounded-xl shadow-md flex items-center justify-center text-xl hover:bg-qurban-50 transition-colors z-10 btn-add-panitia">
                            <i class="ph ph-plus font-bold"></i>
                        </button>
                    ` : ''}
                </div>
                <!-- Redirect to Absensi -->
                <button onclick="document.querySelectorAll('.nav-item').forEach(b => {b.classList.remove('active', 'text-qurban-700'); b.classList.add('text-slate-400')}); renderView('absensi')" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-2xl transition-colors flex items-center justify-center gap-2 border border-slate-200">
                    <i class="ph ph-calendar-check text-xl text-qurban-600"></i>
                    <span>Kelola Absensi Panitia</span>
                </button>                
            </div>
    `;

    // Group by tugas
    TUGAS_OPTIONS.forEach(tugas => {
        // filter panitia who have this tugas
        const members = panitias.filter(p => p.tugas.includes(tugas));
        // Sort: Koordinator first
        members.sort((a, b) => (b.is_koordinator ? 1 : 0) - (a.is_koordinator ? 1 : 0));

        if (members.length > 0) {
            let icon = 'ph-users';
            if (tugas === 'Ketua') icon = 'ph-star';
            else if (tugas === 'Bendahara') icon = 'ph-wallet';
            else if (tugas === 'Sekretaris') icon = 'ph-notebook';
            else if (tugas === 'Penyembelihan') icon = 'ph-scissors';
            else if (tugas === 'Pencacahan') icon = 'ph-knife';
            else if (tugas === 'Penimbangan') icon = 'ph-scales';
            else if (tugas === 'Distribusi') icon = 'ph-truck';

            html += `
                <div class="mt-6">
                    <div class="flex justify-between items-center mb-3 px-1">
                        <h3 class="font-bold text-slate-800 flex items-center gap-2">
                            <i class="ph ${icon} text-qurban-600 text-xl"></i> ${tugas}
                        </h3>
                        <span class="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">${members.length > 2 ? members.length + ` Orang` : ``}</span>
                    </div>
                    <div class="space-y-3">
                        ${members.map(m => `
                            <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center group">
                                <div class="flex items-center gap-4">
                                    <div class="w-12 h-12 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-sm font-bold">
                                        ${m.nama.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <div class="flex items-center gap-2">
                                            <h4 class="font-bold text-slate-800">${m.nama}</h4>
                                            ${m.is_koordinator ? `<span class="bg-qurban-700 text-white text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Koordinator</span>` : ''}
                                        </div>
                                        <p class="text-xs text-slate-500 mt-0.5"><i class="ph ph-map-pin"></i> ${m.wilayah}</p>
                                        <div class="flex flex-wrap gap-1 mt-2">
                                            ${m.tugas.map(t => `<span class="text-[10px] border border-blue-100 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">${t}</span>`).join('')}
                                        </div>
                                    </div>
                                </div>
                                ${currentUser ? `
                                    <div class="flex gap-1 flex-col md:flex-row">
                                        <button class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-500 btn-edit-panitia" data-id="${m.id}"><i class="ph ph-pencil-simple"></i></button>
                                        <button class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 btn-delete-panitia" data-id="${m.id}"><i class="ph ph-trash"></i></button>
                                    </div>
                                ` : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    });

    html += `</div>`;
    return html;
}

const showFormPanitia = async (id = null) => {
    let item = { nama: '', wilayah: WILAYAH_OPTIONS[0], tugas: [], is_koordinator: false };
    if (id) {
        const { data } = await window.api.panitia.select();
        item = data.find(i => i.id === id);
    }

    const html = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden items-end sm:items-center justify-center p-0 sm:p-4 opacity-0">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 class="text-lg font-bold text-slate-800">${id ? 'Edit' : 'Tambah'} Panitia</h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                <div class="p-5 overflow-y-auto">
                    <form id="form-panitia" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                            <input type="text" id="fpt-nama" value="${item.nama}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Wilayah</label>
                            <select id="fpt-wilayah" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none">
                                ${WILAYAH_OPTIONS.map(opt => `<option value="${opt}" ${item.wilayah === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-2">Tugas (Bisa pilih lebih dari satu)</label>
                            <div class="grid grid-cols-2 gap-2">
                                ${TUGAS_OPTIONS.map(opt => `
                                    <label class="flex items-center gap-2 p-2 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                                        <input type="checkbox" name="fpt-tugas" value="${opt}" class="w-4 h-4 text-qurban-600 border-slate-300 rounded focus:ring-qurban-500" ${item.tugas.includes(opt) ? 'checked' : ''}>
                                        <span class="text-xs font-medium text-slate-700">${opt}</span>
                                    </label>
                                `).join('')}
                            </div>
                        </div>
                        <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 mt-2">
                            <div class="relative w-12 h-6">
                                <input type="checkbox" id="fpt-koor" class="sr-only toggle-checkbox" ${item.is_koordinator ? 'checked' : ''}>
                                <div class="toggle-label absolute inset-0"></div>
                                <div class="toggle-dot absolute shadow-sm"></div>
                            </div>
                            <span class="text-sm font-medium text-slate-700">Jadikan Koordinator</span>
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

    document.getElementById('form-panitia').addEventListener('submit', async (e) => {
        e.preventDefault();

        const tugasChecked = Array.from(document.querySelectorAll('input[name="fpt-tugas"]:checked')).map(cb => cb.value);
        if (tugasChecked.length === 0) {
            showToast('Pilih minimal satu tugas', 'error');
            return;
        }

        const data = {
            nama: document.getElementById('fpt-nama').value,
            wilayah: document.getElementById('fpt-wilayah').value,
            tugas: tugasChecked,
            is_koordinator: document.getElementById('fpt-koor').checked,
            hadir: item.hadir // preserve hadir status
        };

        try {
            if (id) await window.api.panitia.update(id, data);
            else await window.api.panitia.insert(data);
            showToast('Data berhasil disimpan');
            closeModal();
            renderView('panitia');
        } catch (err) {
            showToast('Gagal menyimpan data', 'error');
        }
    });
};

function attachPanitiaListeners() {
    document.querySelectorAll('.btn-add-panitia').forEach(btn => {
        btn.addEventListener('click', () => showFormPanitia());
    });
    document.querySelectorAll('.btn-edit-panitia').forEach(btn => {
        btn.addEventListener('click', () => showFormPanitia(btn.dataset.id));
    });
    document.querySelectorAll('.btn-delete-panitia').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (await showConfirm('Hapus Data', 'Yakin ingin menghapus data panitia ini?')) {
                try {
                    await window.api.panitia.delete(id);
                    showToast('Data terhapus');
                    renderView('panitia');
                } catch (err) {
                    console.error("Delete error:", err);
                    showToast('Gagal menghapus: ' + err.message, 'error');
                }
            }
        });
    });
}
