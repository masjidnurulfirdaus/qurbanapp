// ===================================================================
// RINGKASAN DISTRIBUSI VIEW
// ===================================================================

async function buildRingkasanDistribusiView() {
    const [penerimaRes, distribusiRes] = await Promise.all([
        window.api.penerima.select(),
        window.api.distribusi.select()
    ]);
    const penerimas = penerimaRes.data || [];
    const distribusi = distribusiRes.data || [];

    let totalSapi = 0;
    let totalKambing = 0;
    let totalPorsi = 0;

    let groupPengqurban = { kg: 0, sapi: 0, kambing: 0, bungkus: 0 };
    let groupPanitia = { kg: 0, sapi: 0, kambing: 0, bungkus: 0 };
    let groupPenerimaWilayah = {};
    let groupPenerimaLainnya = [];

    distribusi.forEach(d => {
        const kg = parseInt(d.porsi_kg) || 0;
        const sapi = parseInt(d.porsi_sapi) || 0;
        const kambing = parseInt(d.porsi_kambing) || 0;
        const bungkus = sapi + kambing;

        totalSapi += sapi;
        totalKambing += kambing;
        totalPorsi += bungkus;

        if (d.kelompok === 'Pengqurban') {
            groupPengqurban.kg += kg;
            groupPengqurban.sapi += sapi;
            groupPengqurban.kambing += kambing;
            groupPengqurban.bungkus += bungkus;
        } else if (d.kelompok === 'Panitia') {
            groupPanitia.kg += kg;
            groupPanitia.sapi += sapi;
            groupPanitia.kambing += kambing;
            groupPanitia.bungkus += bungkus;
        } else if (d.kelompok === 'Penerima') {
            if (d.wilayah !== 'Lainnya') {
                if (!groupPenerimaWilayah[d.wilayah]) {
                    groupPenerimaWilayah[d.wilayah] = { kg: 0, sapi: 0, kambing: 0, bungkus: 0 };
                }
                groupPenerimaWilayah[d.wilayah].kg += kg;
                groupPenerimaWilayah[d.wilayah].sapi += sapi;
                groupPenerimaWilayah[d.wilayah].kambing += kambing;
                groupPenerimaWilayah[d.wilayah].bungkus += bungkus;
            } else {
                let name = 'Lainnya';
                if (d.id_penerima) {
                    const pn = penerimas.find(p => p.id === d.id_penerima);
                    if (pn) name = pn.nama;
                }
                groupPenerimaLainnya.push({ name, kg, sapi, kambing, bungkus });
            }
        }
    });

    let html = `
        <div class="p-4 space-y-6 pb-24 view-enter">
            <div class="flex items-center justify-between mb-4">
                <h2 class="text-xl font-bold text-slate-800">Ringkasan Distribusi</h2>
                <button id="btn-detail-distribusi" class="bg-qurban-50 border border-qurban-100 text-qurban-700 hover:bg-qurban-100 shadow-sm text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap">
                    <i class="ph ph-list-dashes text-lg"></i>
                    <span>Detail Distribusi</span>
                </button>
            </div>

            <!-- Total Card (Mockup Style) -->
            <div class="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center justify-center gap-6 overflow-hidden relative">
                <div class="flex items-baseline gap-1" style="color: #7A3E14;">
                    <span class="text-7xl font-black tracking-tighter">${totalPorsi}</span>
                    <span class="text-xl font-bold">porsi</span>
                </div>
                <div class="flex flex-col gap-2">
                    <div class="px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 text-sm" style="background-color: #E8F8EE; color: #166534;">
                        <i class="ph ph-cow text-lg"></i> SAPI: ${totalSapi}
                    </div>
                    <div class="px-3 py-1.5 rounded-lg font-bold flex items-center gap-2 text-sm" style="background-color: #FEF0E6; color: #9C4318;">
                        <i class="ph ph-paw-print text-lg"></i> KAMBING: ${totalKambing}
                    </div>
                </div>
            </div>

            <!-- List Per Kelompok -->
            <div class="space-y-4">
                <h3 class="font-bold text-slate-800 text-lg border-b border-slate-200 pb-2">Rincian per Kelompok</h3>

                <!-- Pengqurban -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                            <i class="ph ph-users text-xl"></i>
                        </div>
                        <h4 class="font-bold text-slate-800">Pengqurban</h4>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1 uppercase">Porsi Daging</p>
                            <span class="text-lg font-bold text-slate-800">${groupPengqurban.kg} <span class="text-sm font-medium text-slate-500">kg</span></span>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1 uppercase">Porsi Bungkus</p>
                            <span class="text-lg font-bold text-slate-800">${groupPengqurban.bungkus} <span class="text-sm font-medium text-slate-500">bungkus</span></span>
                        </div>
                    </div>
                </div>

                <!-- Panitia -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div class="flex items-center gap-3 mb-3">
                        <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                            <i class="ph ph-identification-badge text-xl"></i>
                        </div>
                        <h4 class="font-bold text-slate-800">Panitia</h4>
                    </div>
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1 uppercase">Porsi Daging</p>
                            <span class="text-lg font-bold text-slate-800">${groupPanitia.kg} <span class="text-sm font-medium text-slate-500">kg</span></span>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1 uppercase">Porsi Bungkus</p>
                            <span class="text-lg font-bold text-slate-800">${groupPanitia.bungkus} <span class="text-sm font-medium text-slate-500">bungkus</span></span>
                        </div>
                    </div>
                </div>

                <!-- Penerima (Wilayah) -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="w-10 h-10 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center">
                            <i class="ph ph-map-pin text-xl"></i>
                        </div>
                        <h4 class="font-bold text-slate-800">Penerima</h4>
                    </div>
                    <div class="space-y-3">
                        ${Object.keys(groupPenerimaWilayah).length === 0 && groupPenerimaLainnya.length === 0 ? '<p class="text-sm text-slate-500">Belum ada distribusi ke penerima.</p>' : ''}
                        
                        ${Object.keys(groupPenerimaWilayah).sort().map(wil => {
                            const data = groupPenerimaWilayah[wil];
                            let bungkusText = '';
                            if (data.bungkus > 0) {
                                bungkusText = `${data.sapi} 🐮 + ${data.kambing} 🐾 = ${data.bungkus} bungkus`;
                            }
                            let kgText = data.kg > 0 ? `${data.kg} kg` : '';
                            let combined = [bungkusText, kgText].filter(Boolean).join(' &bull; ');
                            
                            return `
                            <div class="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <span class="text-sm font-semibold text-slate-700">${wil}</span>
                                <div class="text-right">
                                    <div class="text-sm font-bold text-slate-800">${combined}</div>
                                </div>
                            </div>
                            `;
                        }).join('')}

                        ${groupPenerimaLainnya.map(item => {
                            let bungkusText = '';
                            if (item.bungkus > 0) {
                                bungkusText = `${item.sapi} 🐮 + ${item.kambing} 🐾 = ${item.bungkus} bungkus`;
                            }
                            let kgText = item.kg > 0 ? `${item.kg} kg` : '';
                            let combined = [bungkusText, kgText].filter(Boolean).join(' &bull; ');
                            
                            return `
                            <div class="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                <span class="text-sm font-semibold text-slate-700">${item.name}</span>
                                <div class="text-right">
                                    <div class="text-sm font-bold text-slate-800">${combined}</div>
                                </div>
                            </div>
                            `;
                        }).join('')}
                    </div>
                </div>

            </div>
        </div>
    `;

    return html;
}

function attachRingkasanDistribusiListeners() {
    const btnDetail = document.getElementById('btn-detail-distribusi');
    if (btnDetail) {
        btnDetail.addEventListener('click', () => {
            renderView('distribusi');
        });
    }
}
