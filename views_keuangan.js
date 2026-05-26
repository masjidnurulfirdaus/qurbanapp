// ===================================================================
// 5. KEUANGAN VIEW
// ===================================================================
async function buildKeuanganView() {
    const [{ data: transaksis }, { data: pengqurbans }] = await Promise.all([
        window.api.transaksi.select(),
        window.api.pengqurban.select()
    ]);

    const allTransactions = [...(transaksis || [])];

    if (pengqurbans) {
        pengqurbans.forEach(p => {
            if (p.setoran && p.setoran > 0) {
                allTransactions.push({
                    id: p.id,
                    nama_transaksi: p.kelompok === 'Kambing' ? `Operasioanl Qurban Kambing - ${p.nama}` : `Setoran Qurban - ${p.nama}`,
                    tanggal: p.created_at || new Date().toISOString(),
                    jenis: 'pendapatan',
                    nominal: p.setoran,
                    is_pengqurban: true
                });
            }
        });
    }

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));

    let totalPendapatan = 0;
    let totalPengeluaran = 0;

    allTransactions.forEach(t => {
        if (t.jenis === 'pendapatan') totalPendapatan += t.nominal;
        else totalPengeluaran += t.nominal;
    });

    const saldo = totalPendapatan - totalPengeluaran;

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Balance Card -->
            <div class="bg-qurban-700 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
                <div class="absolute -right-10 -bottom-10 opacity-10">
                    <i class="ph ph-wallet text-[150px]"></i>
                </div>
                <div class="flex flex-row justify-between">
                    <h2 class="text-sm font-medium text-qurban-200 mb-1">SISA SALDO</h2>
                    ${currentUser ? `<button id="btn-download-keuangan" class="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span>Excel</span>
                    </button>` : ''}
                </div>
                <h3 class="text-4xl font-bold mb-6">${formatRupiah(saldo)}</h3>
                
                <div class="flex gap-4">
                    <div class="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                        <div class="flex items-center gap-2 text-qurban-200 mb-1">
                            <i class="ph ph-arrow-down-left text-lg"></i>
                            <span class="text-[10px] font-semibold uppercase tracking-wider">Pendapatan</span>
                        </div>
                        <div class="text-sm font-bold">${formatRupiah(totalPendapatan)}</div>
                    </div>
                    <div class="flex-1 bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/20">
                        <div class="flex items-center gap-2 text-red-200 mb-1">
                            <i class="ph ph-arrow-up-right text-lg"></i>
                            <span class="text-[10px] font-semibold uppercase tracking-wider">Pengeluaran</span>
                        </div>
                        <div class="text-sm font-bold">${formatRupiah(totalPengeluaran)}</div>
                    </div>
                </div>
            </div>

            <!-- Transactions Header -->
            <div class="flex justify-between items-end mt-8 mb-2">
                <h3 class="text-xl font-bold text-slate-800">Riwayat Transaksi</h3>
                ${currentUser ? `
                    <div class="flex gap-2">
                        <button class="bg-qurban-50 text-qurban-700 hover:bg-qurban-100 px-3 py-1.5 rounded-lg text-sm font-bold transition-colors flex items-center gap-1.5 btn-add-transaksi">
                            <i class="ph ph-plus"></i> Transaksi
                        </button>
                    </div>
                ` : ''}
            </div>

            <!-- Transactions List -->
            <div class="space-y-3">
                ${allTransactions.length === 0 ? `
                    <div class="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm">
                        <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                            <i class="ph ph-receipt text-3xl"></i>
                        </div>
                        <p class="text-slate-500 font-medium">Belum ada transaksi tercatat.</p>
                    </div>
                ` : ''}
                
                ${allTransactions.map(t => {
        const isIncome = t.jenis === 'pendapatan';
        return `
                        <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center group">
                            <div class="flex items-center gap-4">
                                <div class="w-12 h-12 rounded-2xl ${isIncome ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'} flex items-center justify-center text-xl">
                                    <i class="ph ${isIncome ? 'ph-arrow-down-left' : 'ph-arrow-up-right'}"></i>
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-800">${t.nama_transaksi}</h4>
                                    <p class="text-xs text-slate-500 font-medium">${new Date(t.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <div class="font-bold ${isIncome ? 'text-green-600' : 'text-red-500'}">
                                    ${isIncome ? '+' : '-'}${formatRupiah(t.nominal)}
                                </div>
                                ${currentUser && !t.is_pengqurban ? `
                                    <div class="flex gap-2 justify-end mt-1">
                                        <button class="text-slate-400 hover:text-blue-500 btn-edit-transaksi" data-id="${t.id}"><i class="ph ph-pencil-simple text-sm"></i></button>
                                        <button class="text-slate-400 hover:text-red-500 btn-delete-transaksi" data-id="${t.id}"><i class="ph ph-trash text-sm"></i></button>
                                    </div>
                                ` : ''}
                                ${currentUser && t.is_pengqurban ? `
                                    <div class="mt-1">
                                        <span class="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Otomatis dari Pengqurban</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                    `;
    }).join('')}
            </div>
        </div>
    `;
    return html;
}

const showFormTransaksi = async (id = null) => {
    let item = { nama_transaksi: '', tanggal: new Date().toISOString().split('T')[0], jenis: 'pendapatan', nominal: '' };
    if (id) {
        const { data } = await window.api.transaksi.select();
        item = data.find(i => i.id === id);
    }

    const html = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] hidden items-end sm:items-center justify-center p-0 sm:p-4 opacity-0">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 class="text-lg font-bold text-slate-800">${id ? 'Edit' : 'Tambah'} Transaksi</h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                <div class="p-5 overflow-y-auto">
                    <form id="form-transaksi" class="space-y-4">
                        <div class="grid grid-cols-2 gap-3 mb-2">
                            <label class="relative">
                                <input type="radio" name="ft-jenis" value="pendapatan" class="peer sr-only" ${item.jenis === 'pendapatan' ? 'checked' : ''}>
                                <div class="p-3 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-green-500 peer-checked:bg-green-50 text-center transition-all">
                                    <i class="ph ph-arrow-down-left text-2xl text-green-600 mb-1"></i>
                                    <div class="text-sm font-bold text-slate-700">Pendapatan</div>
                                </div>
                            </label>
                            <label class="relative">
                                <input type="radio" name="ft-jenis" value="pengeluaran" class="peer sr-only" ${item.jenis === 'pengeluaran' ? 'checked' : ''}>
                                <div class="p-3 border-2 border-slate-200 rounded-xl cursor-pointer peer-checked:border-red-500 peer-checked:bg-red-50 text-center transition-all">
                                    <i class="ph ph-arrow-up-right text-2xl text-red-500 mb-1"></i>
                                    <div class="text-sm font-bold text-slate-700">Pengeluaran</div>
                                </div>
                            </label>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Keterangan Transaksi</label>
                            <input type="text" id="ft-nama" value="${item.nama_transaksi}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none" placeholder="Contoh: Beli Tali Sapi">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
                            <input type="date" id="ft-tanggal" value="${item.tanggal}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none bg-white">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
                            <input type="number" id="ft-nominal" value="${item.nominal}" required min="0" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 focus:border-qurban-500 outline-none font-bold text-lg">
                        </div>
                        
                        <button type="submit" class="w-full bg-qurban-700 hover:bg-qurban-800 text-white font-medium py-3 rounded-xl transition-colors mt-6">
                            Simpan Transaksi
                        </button>
                    </form>
                </div>
            </div>
        </div>
    `;
    showModal(html);

    document.getElementById('form-transaksi').addEventListener('submit', async (e) => {
        e.preventDefault();

        const data = {
            nama_transaksi: document.getElementById('ft-nama').value,
            tanggal: document.getElementById('ft-tanggal').value,
            jenis: document.querySelector('input[name="ft-jenis"]:checked').value,
            nominal: parseInt(document.getElementById('ft-nominal').value)
        };

        try {
            if (id) await window.api.transaksi.update(id, data);
            else await window.api.transaksi.insert(data);
            showToast('Transaksi berhasil disimpan');
            closeModal();
            renderView('keuangan');
        } catch (err) {
            showToast('Gagal menyimpan transaksi', 'error');
        }
    });
};

function attachKeuanganListeners() {
    const btnDownload = document.getElementById('btn-download-keuangan');
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            try {
                const [{ data: transaksis }, { data: pengqurbans }] = await Promise.all([
                    window.api.transaksi.select(),
                    window.api.pengqurban.select()
                ]);

                const allTransactions = [...(transaksis || [])];

                if (pengqurbans) {
                    pengqurbans.forEach(p => {
                        if (p.setoran && p.setoran > 0) {
                            allTransactions.push({
                                id: p.id,
                                nama_transaksi: p.kelompok === 'Kambing' ? `Operasional Qurban Kambing - ${p.nama}` : `Setoran Qurban - ${p.nama}`,
                                tanggal: p.created_at || new Date().toISOString(),
                                jenis: 'pendapatan',
                                nominal: p.setoran,
                                is_pengqurban: true
                            });
                        }
                    });
                }

                // Sort by date ascending for the report
                allTransactions.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));

                if (allTransactions.length === 0) return showToast('Data kosong', 'error');

                const exportData = allTransactions.map(t => ({
                    Tanggal: new Date(t.tanggal).toLocaleDateString('id-ID'),
                    Keterangan: t.nama_transaksi,
                    Jenis: t.jenis === 'pendapatan' ? 'Pemasukan' : 'Pengeluaran',
                    Pemasukan: t.jenis === 'pendapatan' ? t.nominal : 0,
                    Pengeluaran: t.jenis === 'pengeluaran' ? t.nominal : 0
                }));

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Keuangan");

                XLSX.writeFile(wb, "Laporan_Keuangan.xlsx");
                showToast('Laporan keuangan berhasil diunduh!');
            } catch (err) {
                showToast('Gagal mengunduh laporan: ' + err.message, 'error');
            }
        });
    }

    document.querySelectorAll('.btn-add-transaksi').forEach(btn => {
        btn.addEventListener('click', () => showFormTransaksi());
    });
    document.querySelectorAll('.btn-edit-transaksi').forEach(btn => {
        btn.addEventListener('click', (e) => showFormTransaksi(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.btn-delete-transaksi').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (await showConfirm('Hapus Transaksi', 'Yakin ingin menghapus transaksi ini? Saldo akan otomatis disesuaikan.')) {
                try {
                    await window.api.transaksi.delete(id);
                    showToast('Transaksi terhapus');
                    renderView('keuangan');
                } catch (err) {
                    showToast('Gagal menghapus: ' + err.message, 'error');
                }
            }
        });
    });
}
