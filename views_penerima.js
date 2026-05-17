// ===================================================================
// 2. PENERIMA VIEW
// ===================================================================
async function buildPenerimaView() {
    const { data: penerimas } = await window.api.penerima.select();

    // We need a filter state, defaulting to 'RT 1 RW 6' or all

    const wilayahOptions = [...WILAYAH_OPTIONS, 'Semua'];
    const activeFilter = window.penerimaFilter || wilayahOptions[0];

    const filtered = activeFilter !== 'Semua' ? penerimas.filter(p => p.wilayah === activeFilter) : penerimas;
    const totalPenerima = filtered.reduce((acc, curr) => acc + curr.jumlah, 0);

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header Card -->
            <div class="bg-qurban-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 opacity-10">
                    <i class="ph ph-users-three text-9xl"></i>
                </div>
                <div class="flex flex-row justify-between">
                    <h2 class="text-sm font-medium text-qurban-100 mb-1">TOTAL PENERIMA</h2>
                    ${currentUser ? `<button id="btn-download-penerima" class="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span>Excel</span>
                    </button>` : ''}
                </div>
                <div class="flex items-end gap-2 mb-4">
                    <h3 class="text-4xl font-bold">${totalPenerima}</h3>
                    <span class="text-sm text-qurban-200 mb-1">Keluarga</span>
                </div>
                <div class="inline-flex items-center gap-1.5 bg-qurban-600/50 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-medium border border-qurban-500/50">
                    <i class="ph ph-map-pin"></i> ${activeFilter}
                </div>
            </div>

            <!-- Filter & Action -->
            <div class="flex flex-col gap-2">
                <label class="text-sm font-semibold text-slate-700">Wilayah Distribusi</label>
                <div class="flex gap-2">
                    <select id="filter-wilayah" class="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none bg-white font-medium text-slate-700">
                        ${wilayahOptions.map(opt => `<option value="${opt}" ${activeFilter === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>
                </div>
            </div>

            <!-- List -->
            <div class="flex justify-between items-end mt-4">
                <h3 class="text-xl font-bold text-qurban-800">Daftar Penerima</h3>
                ${currentUser ? `
                    <button class="bg-qurban-700 hover:bg-qurban-800 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2 btn-add-penerima">
                        <i class="ph ph-user-plus"></i> Tambah
                    </button>
                ` : ''}
            </div>

            <div class="space-y-3">
                ${filtered.length === 0 ? `
                    <div class="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                            <i class="ph ph-users text-3xl"></i>
                        </div>
                        <p class="text-slate-500 font-medium">Belum ada data penerima di wilayah ini.</p>
                    </div>
                ` : ''}
                
                ${filtered.map(p => `
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center group">
                        <div class="flex items-center gap-4">
                            <div class="w-12 h-12 rounded-full bg-qurban-50 text-qurban-600 flex items-center justify-center text-lg border border-qurban-100">
                                <i class="ph ph-user"></i>
                            </div>
                            <div>
                                <h4 class="font-bold text-slate-800 flex items-center gap-2">
                                    ${p.nama}
                                    ${p.jumlah > 1 ? `<span class="bg-blue-50 text-blue-600 text-[10px] px-2 py-0.5 rounded-full">${p.jumlah} Porsi</span>` : ''}
                                    ${p.muslim === false ? `<span class="bg-amber-50 text-amber-600 text-[10px] px-2 py-0.5 rounded-full border border-amber-100">Non-Muslim</span>` : ''}
                                </h4>
                                <p class="text-xs text-slate-500 mt-0.5"><i class="ph ph-map-pin text-slate-400"></i> ${p.alamat || p.wilayah}</p>
                            </div>
                        </div>
                        ${currentUser ? `
                            <div class="flex gap-1 flex-col sm:flex-row">
                                <button class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-blue-50 hover:text-blue-500 btn-edit-penerima" data-id="${p.id}"><i class="ph ph-pencil-simple"></i></button>
                                <button class="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 btn-delete-penerima" data-id="${p.id}"><i class="ph ph-trash"></i></button>
                            </div>
                        ` : ''}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
    return html;
}

const showFormPenerima = async (id = null) => {
    let item = { nama: '', wilayah: window.penerimaFilter || WILAYAH_OPTIONS[0], alamat: '', jumlah: 1, no_telp: '', muslim: true };
    if (id) {
        const { data } = await window.api.penerima.select();
        item = data.find(i => i.id === id);
        if (item.muslim === undefined) item.muslim = true;
    }

    const html = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden items-end sm:items-center justify-center p-0 sm:p-4 opacity-0">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 class="text-lg font-bold text-slate-800">${id ? 'Edit' : 'Tambah'} Penerima</h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                <div class="p-5 overflow-y-auto">
                    <form id="form-penerima" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
                            <input type="text" id="fp-nama" value="${item.nama}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Contoh: Bapak Slamet">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Wilayah</label>
                            <select id="fp-wilayah" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none">
                                ${WILAYAH_OPTIONS.map(opt => `<option value="${opt}" ${item.wilayah === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Alamat (Opsional)</label>
                            <textarea id="fp-alamat" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Detail alamat...">${item.alamat || ''}</textarea>
                        </div>
                        <div id="fp-jumlah-container" class="${item.wilayah === 'Lainnya' ? '' : 'hidden'}">
                            <label class="block text-sm font-medium text-slate-700 mb-1">Jumlah Porsi</label>
                            <input type="number" id="fp-jumlah" min="1" value="${item.jumlah}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">No. Telp (Opsional)</label>
                            <input type="tel" id="fp-notelp" value="${item.no_telp || ''}" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="0812...">
                        </div>
                        <label class="flex items-center gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 mt-2">
                            <div class="relative w-12 h-6">
                                <input type="checkbox" id="fp-muslim" class="sr-only toggle-checkbox" ${item.muslim ? 'checked' : ''}>
                                <div class="toggle-label absolute inset-0"></div>
                                <div class="toggle-dot absolute shadow-sm"></div>
                            </div>
                            <span class="text-sm font-medium text-slate-700">Muslim</span>
                        </label>
                        
                        <button type="submit" class="w-full bg-qurban-700 hover:bg-qurban-800 text-white font-medium py-3 rounded-xl transition-colors mt-6 flex items-center justify-center gap-2">
                            <i class="ph ph-floppy-disk"></i> Simpan Perubahan
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    showModal(html);

    const wilSelect = document.getElementById('fp-wilayah');
    const jumContainer = document.getElementById('fp-jumlah-container');
    const jumInput = document.getElementById('fp-jumlah');

    wilSelect.addEventListener('change', (e) => {
        if (e.target.value === 'Lainnya') {
            jumContainer.classList.remove('hidden');
        } else {
            jumContainer.classList.add('hidden');
            jumInput.value = 1;
        }
    });

    document.getElementById('form-penerima').addEventListener('submit', async (e) => {
        e.preventDefault();
        const data = {
            nama: document.getElementById('fp-nama').value,
            wilayah: document.getElementById('fp-wilayah').value,
            alamat: document.getElementById('fp-alamat').value,
            jumlah: parseInt(document.getElementById('fp-jumlah').value) || 1,
            no_telp: document.getElementById('fp-notelp').value,
            muslim: document.getElementById('fp-muslim').checked
        };

        try {
            if (id) await window.api.penerima.update(id, data);
            else await window.api.penerima.insert(data);
            showToast('Data berhasil disimpan');
            closeModal();
            renderView('penerima');
        } catch (err) {
            showToast('Gagal menyimpan data', 'error');
        }
    });
};

function attachPenerimaListeners() {
    // Excel Download
    const btnDownload = document.getElementById('btn-download-penerima');
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            try {
                const { data } = await window.api.penerima.select();
                if (!data || data.length === 0) return showToast('Data kosong', 'error');

                // Exclude 'id' from data
                const exportData = data.map(item => {
                    const { id, ...rest } = item;
                    return rest;
                });

                // Create worksheet and workbook using SheetJS
                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Penerima");

                // Trigger download
                XLSX.writeFile(wb, "Laporan_Penerima.xlsx");
                showToast('Laporan berhasil diunduh!');
            } catch (err) {
                showToast('Gagal mengunduh laporan: ' + err.message, 'error');
            }
        });
    }

    const filterSelect = document.getElementById('filter-wilayah');
    if (filterSelect) {
        filterSelect.addEventListener('change', (e) => {
            window.penerimaFilter = e.target.value;
            renderView('penerima');
        });
    }

    document.querySelectorAll('.btn-add-penerima').forEach(btn => {
        btn.addEventListener('click', () => showFormPenerima());
    });
    document.querySelectorAll('.btn-edit-penerima').forEach(btn => {
        btn.addEventListener('click', (e) => showFormPenerima(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.btn-delete-penerima').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (await showConfirm('Hapus Data', 'Yakin ingin menghapus data penerima ini?')) {
                try {
                    await window.api.penerima.delete(id);
                    showToast('Data terhapus');
                    renderView('penerima');
                } catch (err) {
                    showToast('Gagal menghapus: ' + err.message, 'error');
                }
            }
        });
    });
}
