// ===================================================================
// DISTRIBUSI VIEW
// ===================================================================

async function buildDistribusiView() {
    // Fetch all needed data
    const [qurbanRes, panitiaRes, penerimaRes, distribusiRes] = await Promise.all([
        window.api.pengqurban.select(),
        window.api.panitia.select(),
        window.api.penerima.select(),
        window.api.distribusi.select()
    ]);

    const qurbans = qurbanRes.data || [];
    const semuapanitias = panitiaRes.data || [];
    const penerimas = penerimaRes.data || [];
    const distribusi = distribusiRes.data || [];
    const panitias = semuapanitias.filter(p => p.hadir);

    // Calculation
    const pengqurbanSapi = qurbans.filter(q => q.kelompok.startsWith('Sapi'));
    const pengqurbanSapiCount = pengqurbanSapi.length;
    const pengqurbanSapiBungkus = pengqurbanSapi.reduce((acc, p) => acc + (p.porsi_bungkus || 0), 0);

    // Kebutuhan Porsi KG
    let kebutuhanPorsiKg = pengqurbanSapiCount * 4;
    kebutuhanPorsiKg += penerimas.reduce((acc, p) => acc + (p.jumlah_kg || 0), 0);

    // Kebutuhan Porsi Bungkus
    let kebutuhanPorsiBungkus = penerimas.reduce((acc, p) => {
        if (!p.jumlah_kg || p.jumlah_kg === 0) {
            return acc + (p.jumlah || 0);
        }
        return acc;
    }, 0);
    kebutuhanPorsiBungkus += panitias.length;
    kebutuhanPorsiBungkus += pengqurbanSapiBungkus;

    // Breakdown Modal Content Generation
    let porsiKgHtml = `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Pengqurban</span>
            <span class="text-sm font-bold text-slate-800">${pengqurbanSapiCount} &times; 4 = ${pengqurbanSapiCount * 4}</span>
        </div>
    `;
    penerimas.filter(p => p.jumlah_kg > 0).forEach(p => {
        porsiKgHtml += `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">${p.nama}</span>
            <span class="text-sm font-bold text-slate-800">${p.jumlah_kg}</span>
        </div>
        `;
    });

    let porsiBungkusHtml = `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Pengqurban</span>
            <span class="text-sm font-bold text-slate-800"> ${pengqurbanSapiBungkus}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Panitia</span>
            <span class="text-sm font-bold text-slate-800">${panitias.length}</span>
        </div>
    `;

    const wilayahBungkus = {};
    penerimas.forEach(p => {
        if (!p.jumlah_kg || p.jumlah_kg === 0) {
            if (p.wilayah !== 'Lainnya') {
                if (!wilayahBungkus[p.wilayah]) wilayahBungkus[p.wilayah] = 0;
                wilayahBungkus[p.wilayah] += (p.jumlah || 0);
            } else {
                porsiBungkusHtml += `
                <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                    <span class="text-sm font-medium text-slate-700">${p.nama}</span>
                    <span class="text-sm font-bold text-slate-800">${p.jumlah || 0}</span>
                </div>
                `;
            }
        }
    });

    for (const [wil, count] of Object.entries(wilayahBungkus)) {
        porsiBungkusHtml += `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">${wil}</span>
            <span class="text-sm font-bold text-slate-800">${count}</span>
        </div>
        `;
    }

    window._kebutuhanModalHtml = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-enter">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <h2 class="text-lg font-bold text-qurban-800 flex items-center gap-2">
                        <i class="ph ph-chart-bar"></i> Detail Kebutuhan
                    </h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                
                <div class="p-5 overflow-y-auto space-y-6">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Porsi KG</h3>
                        <div class="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                            ${porsiKgHtml}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Porsi Bungkus</h3>
                        <div class="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                            ${porsiBungkusHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Terdistribusi
    const terdistribusiKg = distribusi.reduce((acc, d) => acc + (parseInt(d.porsi_kg) || 0), 0);
    const terdistribusiSapi = distribusi.reduce((acc, d) => acc + (parseInt(d.porsi_sapi) || 0), 0);
    const terdistribusiKambing = distribusi.reduce((acc, d) => acc + (parseInt(d.porsi_kambing) || 0), 0);
    const terdistribusiBungkus = terdistribusiSapi + terdistribusiKambing;

    // Breakdown Modal Content for Terdistribusi
    let distKgPengqurban = 0, distKgPanitia = 0;
    let distBungkusPengqurban = 0, distBungkusPanitia = 0;
    let distPenerimaList = [];

    distribusi.forEach(d => {
        const kg = parseInt(d.porsi_kg) || 0;
        const bungkus = (parseInt(d.porsi_sapi) || 0) + (parseInt(d.porsi_kambing) || 0);

        if (d.kelompok === 'Pengqurban') {
            distKgPengqurban += kg;
            distBungkusPengqurban += bungkus;
        } else if (d.kelompok === 'Panitia') {
            distKgPanitia += kg;
            distBungkusPanitia += bungkus;
        } else if (d.kelompok === 'Penerima') {
            let nameOrWilayah = d.wilayah;
            if (d.wilayah === 'Lainnya' && d.id_penerima) {
                const pn = penerimas.find(p => p.id === d.id_penerima);
                if (pn) nameOrWilayah = pn.nama;
            }
            distPenerimaList.push({ name: nameOrWilayah, kg, bungkus });
        }
    });

    let tKgHtml = `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Pengqurban</span>
            <span class="text-sm font-bold text-slate-800">${distKgPengqurban}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Panitia</span>
            <span class="text-sm font-bold text-slate-800">${distKgPanitia}</span>
        </div>
    `;
    let tBungkusHtml = `
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Pengqurban</span>
            <span class="text-sm font-bold text-slate-800">${distBungkusPengqurban}</span>
        </div>
        <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
            <span class="text-sm font-medium text-slate-700">Panitia</span>
            <span class="text-sm font-bold text-slate-800">${distBungkusPanitia}</span>
        </div>
    `;

    distPenerimaList.forEach(p => {
        if (p.kg > 0) {
            tKgHtml += `
            <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span class="text-sm font-medium text-slate-700">${p.name}</span>
                <span class="text-sm font-bold text-slate-800">${p.kg}</span>
            </div>
            `;
        }
        if (p.bungkus > 0) {
            tBungkusHtml += `
            <div class="flex justify-between items-center py-2 border-b border-slate-100 last:border-0">
                <span class="text-sm font-medium text-slate-700">${p.name}</span>
                <span class="text-sm font-bold text-slate-800">${p.bungkus}</span>
            </div>
            `;
        }
    });

    window._terdistribusiModalHtml = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-enter">
            <div class="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div class="p-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <h2 class="text-lg font-bold text-qurban-800 flex items-center gap-2">
                        <i class="ph ph-check-circle"></i> Detail Terdistribusi
                    </h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                
                <div class="p-5 overflow-y-auto space-y-6">
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Porsi KG</h3>
                        <div class="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                            ${tKgHtml}
                        </div>
                    </div>
                    <div>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Porsi Bungkus</h3>
                        <div class="bg-slate-50 rounded-xl px-4 py-2 border border-slate-100">
                            ${tBungkusHtml}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Widgets -->
            <div class="grid grid-cols-1 gap-4 mb-2">
                <!-- Kebutuhan Widget -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div class="flex items-center justify-between mb-3 z-10 relative">
                        <div class="flex items-center gap-2">
                            <i class="ph ph-chart-bar text-green-700 text-lg"></i>
                            <h3 class="font-bold text-slate-800 text-xs tracking-wider">KEBUTUHAN</h3>
                        </div>
                        <button class="btn-lihat-kebutuhan text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm border border-slate-200">
                            <i class="ph ph-eye"></i> Lihat
                        </button>
                    </div>
                    <div class="flex justify-between items-end pr-4">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1">PORSI KG</p>
                            <div class="flex items-baseline gap-1">
                                <span class="text-4xl font-black text-green-800">${kebutuhanPorsiKg}</span>
                                <span class="text-sm font-bold text-green-800">kg</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1">PORSI BUNGKUS</p>
                            <div class="flex items-baseline gap-1">
                                <span class="text-4xl font-black text-green-800">${kebutuhanPorsiBungkus}</span>
                                <span class="text-sm font-bold text-green-800">bungkus</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Terdistribusi Widget -->
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 relative overflow-hidden">
                    <div class="flex items-center justify-between mb-3 z-10 relative">
                        <div class="flex items-center gap-2">
                            <i class="ph ph-check-circle text-amber-700 text-lg"></i>
                            <h3 class="font-bold text-slate-800 text-xs tracking-wider">TERDISTRIBUSI</h3>
                        </div>
                        <button class="btn-lihat-terdistribusi text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1 rounded-lg font-bold transition-colors flex items-center gap-1 shadow-sm border border-slate-200">
                            <i class="ph ph-eye"></i> Lihat
                        </button>
                    </div>
                    <div class="flex justify-between items-center pr-2">
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1">PORSI KG</p>
                            <div class="flex items-baseline gap-1">
                                <span class="text-4xl font-black text-amber-900">${terdistribusiKg}</span>
                                <span class="text-sm font-bold text-amber-900">kg</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-[10px] font-bold text-slate-500 mb-1">TOTAL PORSI BUNGKUS</p>
                            <div class="flex items-center gap-2">
                                <div class="flex items-baseline gap-1">
                                    <span class="text-4xl font-black text-amber-900">${terdistribusiBungkus}</span>
                                    <span class="text-[10px] font-bold text-amber-900 mb-1.5">porsi</span>
                                </div>
                                <div class="flex flex-col gap-1">
                                    <span class="bg-green-100/70 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded-md z-9999"><i class="ph ph-cow"></i> SAPI: ${terdistribusiSapi}</span>
                                    <span class="bg-orange-100/70 text-orange-800 text-[9px] font-bold px-2 py-0.5 rounded-md"><i class="ph ph-paw-print"></i> KAMBING: ${terdistribusiKambing}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        <div class="py-4 space-y-6 view-enter">
            <!-- Header -->

            <!-- Filter Tabs & Actions -->
            <div class="flex justify-between items-center pb-2">
                <div class="flex gap-2 overflow-x-auto hide-scrollbar">
                    <button class="btn-filter-distribusi px-3 py-2 rounded-full text-xs font-medium bg-qurban-700 text-white transition-colors whitespace-nowrap" data-filter="pengqurban">Pengqurban</button>
                    <button class="btn-filter-distribusi px-3 py-2 rounded-full text-xs font-medium bg-sky-100 text-slate-700 transition-colors whitespace-nowrap" data-filter="panitia">Panitia</button>
                    <button class="btn-filter-distribusi px-3 py-2 rounded-full text-xs font-medium bg-sky-100 text-slate-700 transition-colors whitespace-nowrap" data-filter="penerima">Penerima</button>
                </div>
                <div class="flex items-center gap-2 ml-2">
                    <button id="btn-ringkasan-distribusi" class="bg-qurban-50 border border-qurban-100 text-qurban-700 hover:bg-qurban-100 shadow-sm text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap">
                        <i class="ph ph-chart-pie-slice text-lg"></i>
                        <span class="hidden sm:inline">Ringkasan</span>
                    </button>
                    ${canEditAll() ? `
                    <button id="btn-download-distribusi" class="bg-white border border-slate-200 hover:bg-slate-50 shadow-sm text-slate-700 text-xs font-bold py-2 px-3 rounded-xl transition-colors flex items-center gap-1 whitespace-nowrap">
                        <i class="ph ph-download-simple text-lg"></i>
                        <span class="hidden sm:inline">Excel</span>
                    </button>
                    ` : ''}
                </div>
           </div>
        </div>

    `;


    // -----------------------------------------
    // 1. PENGQURBAN
    // -----------------------------------------
    html += `<div id="distribusi-pengqurban" class="distribusi-section space-y-4">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2 mt-2">
                    <h3 class="text-xl font-bold text-slate-800">Pengqurban</h3>
                    <span class="text-xs font-medium bg-green-100 text-green-700 px-2 py-1 rounded-full">${qurbans.length} Orang</span>
                </div>`;

    // Group by kelompok

    KELOMPOK_OPTIONS.forEach(group => {
        const members = qurbans.filter(q => q.kelompok === group);
        if (members.length > 0) {
            members.sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
            html += `<div class="mt-4">
                        <h4 class="text-sm font-bold text-qurban-700 mb-3">${group}</h4>
                        <div class="space-y-3">`;
            members.forEach((m, i) => {
                const distItem = distribusi.find(d => d.kelompok === 'Pengqurban' && d.id_penerima === m.id);
                const isSelesai = !!distItem;

                html += `
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center group-card transition-all">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center">
                                ${i + 1}
                            </div>
                            <div>
                                <h5 class="font-bold text-slate-800 text-sm">${m.nama}</h5>
                                <p class="text-[10px] text-slate-500">${m.wilayah}${m.alamat ? `, ${m.alamat}` : ''}</p>
                                <p class="text-[10px] text-slate-500">${m.no_telp || '-'}</p>
                            </div>
                        </div>
                        <button class="btn-distribusi flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(isSelesai || !canEditDistribusi()) ? 'text-green-700 hover:bg-green-50' : 'bg-qurban-700 text-white hover:bg-qurban-800'}" 
                                data-id="${m.id}" data-kelompok="Pengqurban">
                        ${canEditDistribusi()
                        ? `${isSelesai ? '<i class="ph-fill ph-check-circle text-lg"></i> Selesai' : 'Distribusi'}`
                        : `${isSelesai ? `Lihat` : ``}`}
                        </button>
                    </div>
                `;
            });
            html += `</div></div>`;
        }
    });
    html += `</div>`;


    // -----------------------------------------
    // 2. PANITIA
    // -----------------------------------------
    html += `<div id="distribusi-panitia" class="distribusi-section space-y-4 hidden">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2 mt-2">
                    <h3 class="text-xl font-bold text-slate-800">Panitia</h3>
                    <span class="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">${panitias.length} Anggota</span>
                </div>`;

    // Group by wilayah
    WILAYAH_OPTIONS.forEach(wil => {
        const members = panitias.filter(p => p.wilayah === wil);
        if (members.length > 0) {
            html += `<div class="mt-4">
                        <h4 class="text-sm font-bold text-slate-600 mb-3">${wil}</h4>
                        <div class="space-y-3">`;
            members.forEach(p => {
                const distItem = distribusi.find(d => d.kelompok === 'Panitia' && d.id_penerima === p.id);
                const isSelesai = !!distItem;

                html += `
                    <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center transition-all">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center">
                                <i class="ph ph-identification-badge text-xl"></i>
                            </div>
                            <div>
                                <h5 class="font-bold text-slate-800 text-sm">${p.nama}</h5>
                                <p class="text-[10px] text-slate-500">${p.wilayah}</p>
                            </div>
                            ${canEditDistribusi() ? `
                            <div class="flex gap-1 ml-2">
                                <button class="p-1.5 text-slate-400 hover:text-red-500 btn-delete-dist" data-id="${p.id}"><i class="ph ph-trash"></i></button>
                            </div>
                        ` : ''}</div>
                         <button class="btn-distribusi flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(isSelesai || !canEditDistribusi()) ? 'text-green-700 hover:bg-green-50' : 'bg-qurban-700 text-white hover:bg-qurban-800'}" 
                                    data-id="${p.id}" data-kelompok="Panitia">
                            ${canEditDistribusi()
                        ? `${isSelesai ? '<i class="ph-fill ph-check-circle text-lg"></i> Selesai' : 'Distribusi'}`
                        : `${isSelesai ? `Lihat` : ``}`}
                        </button>
                    </div>
                `;
            });
            html += `</div></div>`;
        }
    });
    html += `</div>`;


    // -----------------------------------------
    // 3. PENERIMA WILAYAH
    // -----------------------------------------
    html += `<div id="distribusi-penerima" class="distribusi-section space-y-4 hidden">
                <div class="flex justify-between items-center border-b border-slate-200 pb-2 mt-2">
                    <h3 class="text-xl font-bold text-slate-800">Penerima Wilayah</h3>
                </div>`;

    const penerimaWilayah = [...new Set(penerimas.map(p => p.wilayah))];
    html += `<div class="space-y-3 mt-4">`;

    penerimaWilayah.forEach(wil => {
        if (wil !== 'Lainnya') {
            const totalPorsi = penerimas.filter(p => p.wilayah === wil).reduce((sum, p) => sum + (p.jumlah || 1), 0);
            const distItem = distribusi.find(d => d.kelompok === 'Penerima' && d.wilayah === wil && (!d.id_penerima));
            const isSelesai = !!distItem;

            html += `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center">
                            <i class="ph ph-map-pin text-xl"></i>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-800 text-sm">${wil}</h5>
                            <p class="text-[10px] text-slate-500">${totalPorsi} Porsi</p>
                        </div>
                    </div>
                     <button class="btn-distribusi flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(isSelesai || !canEditDistribusi()) ? 'text-green-700 hover:bg-green-50' : 'bg-qurban-700 text-white hover:bg-qurban-800'}" 
                                data-wilayah="${wil}" data-kelompok="Penerima">
                    ${canEditDistribusi() ? `
                       ${isSelesai ? '<i class="ph-fill ph-check-circle text-lg"></i> Selesai' : 'Distribusi'}
                    ` : `${isSelesai ? 'Lihat' : ``}`}
                    </button>
                </div>
            `;
        }
    });

    // Handle 'Lainnya' individuals
    const lainnyaMembers = penerimas.filter(p => p.wilayah === 'Lainnya');
    if (lainnyaMembers.length > 0) {
        lainnyaMembers.forEach(m => {
            const distItem = distribusi.find(d => d.kelompok === 'Penerima' && d.id_penerima === m.id);
            const isSelesai = !!distItem;

            html += `
                <div class="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex justify-between items-center transition-all">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-lime-50 text-lime-600 flex items-center justify-center">
                            <i class="ph ph-user text-xl"></i>
                        </div>
                        <div>
                            <h5 class="font-bold text-slate-800 text-sm">${m.nama}</h5>
                            <p class="text-[10px] text-slate-500">${m.jumlah || 1} Porsi (Lainnya)</p>
                        </div>
                    </div>
                    <button class="btn-distribusi flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${(isSelesai || !canEditDistribusi()) ? 'text-green-700 hover:bg-green-50' : 'bg-qurban-700 text-white hover:bg-qurban-800'}" 
                                data-id="${m.id}" data-kelompok="Penerima">
                    ${canEditDistribusi()
                    ? `${isSelesai ? '<i class="ph-fill ph-check-circle text-lg"></i> Selesai' : 'Distribusi'}`
                    : `${isSelesai ? `Lihat` : ``}`}
                    </button>
                </div>
            `;
        });
    }

    html += `</div></div></div>`;

    return html;
}

// Show Form Distribusi
async function showFormDistribusi(kelompok = 'Pengqurban', defaultId = null, defaultWilayah = null) {
    const [qurbanRes, panitiaRes, penerimaRes, distribusiRes] = await Promise.all([
        window.api.pengqurban.select(),
        window.api.panitia.select(),
        window.api.penerima.select(),
        window.api.distribusi.select()
    ]);

    const qurbans = qurbanRes.data || [];
    const panitias = panitiaRes.data || [];
    const penerimas = penerimaRes.data || [];
    const distribusiData = distribusiRes.data || [];

    // Cek apakah ada data eksisting untuk kelompok & id/wilayah ini
    let existingData = null;
    if (defaultId || defaultWilayah) {
        existingData = distribusiData.find(d =>
            d.kelompok === kelompok &&
            (defaultId ? d.id_penerima === defaultId : d.wilayah === defaultWilayah && !d.id_penerima)
        );
    }

    const isEdit = !!existingData;

    let item = {
        id: existingData?.id || null,
        kelompok: kelompok,
        id_penerima: defaultId || existingData?.id_penerima || '',
        wilayah: defaultWilayah || existingData?.wilayah || '',
        nama_petugas: existingData?.nama_petugas || '',
        porsi_kg: existingData?.porsi_kg || 0,
        porsi_sapi: existingData?.porsi_sapi || 0,
        porsi_kambing: existingData?.porsi_kambing || 0,
        porsi_khusus: existingData?.porsi_khusus || '',
        request: existingData?.request || null
    };

    const html = `
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 modal-enter">
            <div class="bg-slate-50 w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]">
                <div class="p-4 bg-white border-b border-slate-100 flex justify-between items-center sticky top-0 z-10 shadow-sm">
                    <h2 class="text-lg font-bold text-qurban-800 flex items-center gap-2">
                        <i class="ph ph-paper-plane-right"></i> ${isEdit ? 'Edit Distribusi' : 'Form Distribusi'}
                    </h2>
                    <button class="modal-close-btn p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"><i class="ph ph-x text-lg"></i></button>
                </div>
                
                <div class="p-5 overflow-y-auto space-y-4">
                    <!-- Banner Header -->
                    <div class="bg-qurban-700 rounded-xl p-4 text-white relative overflow-hidden hidden sm:block mb-6 shadow-md">
                        <div class="absolute -right-4 -bottom-4 opacity-10">
                            <i class="ph ph-package text-7xl"></i>
                        </div>
                        <h3 class="text-sm text-qurban-100">Sistem Manajemen Qurban</h3>
                        <h2 class="text-xl font-bold">Form Distribusi</h2>
                    </div>

                    <form id="form-distribusi" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Kelompok</label>
                            <select id="fd-kelompok" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white outline-none" ${isEdit ? 'disabled' : ''}>
                                <option value="Pengqurban" ${item.kelompok === 'Pengqurban' ? 'selected' : ''}>Pengqurban</option>
                                <option value="Panitia" ${item.kelompok === 'Panitia' ? 'selected' : ''}>Panitia</option>
                                <option value="Penerima" ${item.kelompok === 'Penerima' ? 'selected' : ''}>Penerima</option>
                            </select>
                        </div>

                        <!-- Area Pilihan Nama / Wilayah -->
                        <div id="fd-nama-container" class="space-y-4">
                            <!-- Injected by JS -->
                        </div>

                        <!-- Area Info Daging -->
                        <div id="fd-info-daging" class="bg-qurban-50 border border-qurban-100 rounded-xl p-3 flex gap-3 items-start hidden">
                            <i class="ph ph-info text-qurban-600 text-xl mt-0.5"></i>
                            <div>
                                <h4 class="text-xs font-bold text-qurban-800" id="fd-info-title">Info Data</h4>
                                <p class="text-sm text-qurban-900 mt-1" id="fd-info-text"></p>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Petugas Pengirim / Distribusi</label>
                            <div class="relative">
                                <input type="text" id="fd-petugas" value="${item.nama_petugas}" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 outline-none pl-10" placeholder="Ketik nama petugas...">
                                <i class="ph ph-identification-card absolute left-3.5 top-3 text-slate-400 text-lg"></i>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Porsi Daging (KG)</label>
                            <div class="relative">
                                <input type="number" id="fd-porsi-kg" value="${item.porsi_kg}" min="0" required class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 outline-none pl-10" placeholder="0">
                                <i class="ph ph-scales absolute left-3.5 top-3 text-slate-400 text-lg"></i>
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-4">
                            <div class="bg-white p-3 rounded-xl border border-slate-200">
                                <label class="block text-[10px] text-slate-500 mb-1">Daging Sapi (Bungkus)</label>
                                <div class="flex items-center gap-2">
                                    <i class="ph ph-cow text-slate-400 text-lg"></i>
                                    <input type="number" id="fd-sapi" value="${item.porsi_sapi}" min="0" class="w-full text-lg font-bold border-b border-slate-300 focus:border-qurban-500 outline-none pb-1 bg-transparent">
                                </div>
                            </div>
                            <div class="bg-white p-3 rounded-xl border border-slate-200">
                                <label class="block text-[10px] text-slate-500 mb-1">Daging Kambing (Bungkus)</label>
                                <div class="flex items-center gap-2">
                                    <i class="ph ph-bowl-food text-slate-400 text-lg"></i>
                                    <input type="number" id="fd-kambing" value="${item.porsi_kambing}" min="0" class="w-full text-lg font-bold border-b border-slate-300 focus:border-qurban-500 outline-none pb-1 bg-transparent">
                                </div>
                            </div>
                        </div>

                        <div>
                            <label class="block text-sm font-medium text-slate-700 mb-1">Request Khusus</label>
                            <textarea id="fd-khusus" rows="2" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-qurban-500 outline-none bg-white" placeholder="Contoh: Daging 3kg, dipisah dengan jeroan...">${item.porsi_khusus}</textarea>
                        </div>

                        <div class="pt-4 flex gap-3">
                            <button type="button" class="modal-close-btn flex-1 py-3 rounded-xl text-slate-600 font-medium bg-white border border-slate-200 hover:bg-slate-50 transition-colors">Batal</button>
                            ${canEditDistribusi() ? `<button type="submit" class="flex-[2] bg-qurban-700 hover:bg-qurban-800 text-white font-bold py-3 rounded-xl transition-colors shadow-md">
                                Simpan Distribusi
                            </button>` : ``}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;

    showModal(html);

    // Form logic elements
    const kelompokSelect = document.getElementById('fd-kelompok');
    const namaContainer = document.getElementById('fd-nama-container');
    const infoContainer = document.getElementById('fd-info-daging');
    const infoTitle = document.getElementById('fd-info-title');
    const infoText = document.getElementById('fd-info-text');

    // Function to render dropdown based on Kelompok
    const updateTargetDropdown = () => {
        const kel = kelompokSelect.value;
        let innerHtml = '';

        if (kel === 'Pengqurban') {
            const options = qurbans.map(q => `<option value="${q.id}" ${q.id === item.id_penerima ? 'selected' : ''}>${q.nama} - ${q.kelompok}</option>`).join('');
            innerHtml = `
                <label class="block text-sm font-medium text-slate-700 mb-1">Nama</label>
                <div class="relative">
                    <select id="fd-target-id" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white outline-none appearance-none pr-10" ${isEdit ? 'disabled' : ''}>
                        <option value="">Pilih Pengqurban</option>
                        ${options}
                    </select>
                    <i class="ph ph-caret-down absolute right-4 top-3 text-slate-400"></i>
                </div>
            `;
        } else if (kel === 'Panitia') {
            const options = panitias.map(p => `<option value="${p.id}" ${p.id === item.id_penerima ? 'selected' : ''}>${p.nama}</option>`).join('');
            innerHtml = `
                <label class="block text-sm font-medium text-slate-700 mb-1">Nama Panitia</label>
                <div class="relative">
                    <select id="fd-target-id" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white outline-none appearance-none pr-10" ${isEdit ? 'disabled' : ''}>
                        <option value="">Pilih Panitia</option>
                        ${options}
                    </select>
                    <i class="ph ph-caret-down absolute right-4 top-3 text-slate-400"></i>
                </div>
            `;
        } else if (kel === 'Penerima') {
            const wilayahs = [...new Set(penerimas.map(p => p.wilayah))];

            // if we are editing 'Lainnya' person, we want the defaultWilayah to be 'Lainnya' and defaultId to be set
            let activeWilayah = item.wilayah || '';
            if (!activeWilayah && item.id_penerima) {
                const pn = penerimas.find(x => x.id === item.id_penerima);
                if (pn) activeWilayah = pn.wilayah;
            }

            const wilayahOptions = wilayahs.map(w => `<option value="${w}" ${w === activeWilayah ? 'selected' : ''}>${w}</option>`).join('');

            innerHtml = `
                <label class="block text-sm font-medium text-slate-700 mb-1">Wilayah / Nama Penerima</label>
                <div class="relative mb-3">
                    <select id="fd-target-wilayah" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white outline-none appearance-none pr-10" ${isEdit && !item.id_penerima ? 'disabled' : ''}>
                        <option value="">Pilih Wilayah</option>
                        ${wilayahOptions}
                    </select>
                    <i class="ph ph-caret-down absolute right-4 top-3 text-slate-400"></i>
                </div>
                <div id="fd-penerima-lainnya-wrapper" class="relative ${activeWilayah === 'Lainnya' ? '' : 'hidden'}">
                    <select id="fd-target-id" class="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white outline-none appearance-none pr-10" ${isEdit && item.id_penerima ? 'disabled' : ''}>
                        <option value="">Pilih Nama</option>
                        ${penerimas.filter(p => p.wilayah === 'Lainnya').map(p => `<option value="${p.id}" ${p.id === item.id_penerima ? 'selected' : ''}>${p.nama}</option>`).join('')}
                    </select>
                    <i class="ph ph-caret-down absolute right-4 top-3 text-slate-400"></i>
                </div>
            `;
        }

        namaContainer.innerHTML = innerHtml;
        attachTargetListeners();
        updateInfoText();
    };

    const updateInfoText = () => {
        const kel = kelompokSelect.value;
        infoContainer.classList.add('hidden');
        infoContainer.dataset.requestValue = '';

        const porsiKgInput = document.getElementById('fd-porsi-kg');
        if (!isEdit && porsiKgInput) {
            porsiKgInput.value = 0;
            if (kel === 'Pengqurban') {
                const targetId = document.getElementById('fd-target-id')?.value;
                if (targetId) {
                    const q = qurbans.find(x => x.id === targetId);
                    if (q && q.kelompok && q.kelompok.startsWith('Sapi')) {
                        porsiKgInput.value = 4;
                    }
                }
            } else if (kel === 'Penerima') {
                const wil = document.getElementById('fd-target-wilayah')?.value;
                if (wil === 'Lainnya') {
                    const tid = document.getElementById('fd-target-id')?.value;
                    if (tid) {
                        const p = penerimas.find(x => x.id === tid);
                        if (p && p.jumlah_kg > 0) {
                            porsiKgInput.value = p.jumlah_kg;
                        }
                    }
                }
            }
        }

        if (isEdit && item.request) {
            if (kel === 'Pengqurban') {
                infoTitle.textContent = "Data Pengqurban";
                infoText.innerHTML = `Permintaan Daging: <span class="font-bold text-slate-800">${item.request}</span>`;
                infoContainer.classList.remove('hidden');
            } else if (kel === 'Penerima') {
                const wil = document.getElementById('fd-target-wilayah')?.value;
                infoTitle.textContent = (wil === 'Lainnya' || item.id_penerima) ? "Data Penerima Lainnya" : "Data Penerima Wilayah";
                infoText.innerHTML = `Porsi dibagikan: <span class="font-bold text-slate-800">${item.request}</span>`;
                infoContainer.classList.remove('hidden');
            }
            return;
        }

        if (kel === 'Pengqurban') {
            const targetId = document.getElementById('fd-target-id')?.value;
            if (targetId) {
                const q = qurbans.find(x => x.id === targetId);
                if (q && q.permintaan_daging) {
                    infoTitle.textContent = "Data Pengqurban";
                    infoText.innerHTML = `Permintaan Daging: <span class="font-bold text-slate-800">${q.permintaan_daging}</span>`;
                    infoContainer.classList.remove('hidden');
                    infoContainer.dataset.requestValue = q.permintaan_daging;
                }
            }
        } else if (kel === 'Penerima') {
            const wilayahSelect = document.getElementById('fd-target-wilayah');
            const targetIdSelect = document.getElementById('fd-target-id');
            const wil = wilayahSelect?.value;

            if (wil) {
                if (wil === 'Lainnya') {
                    const tid = targetIdSelect?.value;
                    if (tid) {
                        const p = penerimas.find(x => x.id === tid);
                        if (p) {
                            infoTitle.textContent = "Data Penerima Lainnya";
                            infoText.innerHTML = `Porsi dibagikan: <span class="font-bold text-slate-800">${p.jumlah || 1} Porsi</span>`;
                            infoContainer.classList.remove('hidden');
                            infoContainer.dataset.requestValue = `${p.jumlah || 1} Porsi`;
                        }
                    }
                } else {
                    const totalPorsi = penerimas.filter(p => p.wilayah === wil).reduce((sum, p) => sum + (p.jumlah || 1), 0);
                    infoTitle.textContent = "Data Penerima Wilayah";
                    infoText.innerHTML = `Total Porsi: <span class="font-bold text-slate-800">${totalPorsi} Porsi</span>`;
                    infoContainer.classList.remove('hidden');
                    infoContainer.dataset.requestValue = `${totalPorsi} Porsi`;
                }
            }
        }
    };

    const attachTargetListeners = () => {
        const targetId = document.getElementById('fd-target-id');
        const targetWilayah = document.getElementById('fd-target-wilayah');

        if (targetId) targetId.addEventListener('change', updateInfoText);
        if (targetWilayah) {
            targetWilayah.addEventListener('change', (e) => {
                const wrapper = document.getElementById('fd-penerima-lainnya-wrapper');
                if (wrapper) {
                    if (e.target.value === 'Lainnya') wrapper.classList.remove('hidden');
                    else wrapper.classList.add('hidden');
                }
                updateInfoText();
            });
        }
    };

    kelompokSelect.addEventListener('change', updateTargetDropdown);

    // Initial render
    updateTargetDropdown();

    document.getElementById('form-distribusi').addEventListener('submit', async (e) => {
        e.preventDefault();

        const kel = kelompokSelect.value;
        let finalIdPenerima = null;
        let finalWilayah = null;

        if (kel === 'Penerima') {
            finalWilayah = document.getElementById('fd-target-wilayah')?.value;
            if (!finalWilayah) return showToast('Pilih wilayah!', 'error');

            if (finalWilayah === 'Lainnya') {
                finalIdPenerima = document.getElementById('fd-target-id')?.value;
                if (!finalIdPenerima) return showToast('Pilih nama penerima!', 'error');
            }
        } else {
            finalIdPenerima = document.getElementById('fd-target-id')?.value;
            if (!finalIdPenerima) return showToast('Pilih nama!', 'error');
        }

        const payload = {
            kelompok: kel,
            id_penerima: finalIdPenerima,
            wilayah: finalWilayah,
            nama_petugas: document.getElementById('fd-petugas').value,
            porsi_kg: parseInt(document.getElementById('fd-porsi-kg').value) || 0,
            porsi_sapi: parseInt(document.getElementById('fd-sapi').value) || 0,
            porsi_kambing: parseInt(document.getElementById('fd-kambing').value) || 0,
            porsi_khusus: document.getElementById('fd-khusus').value,
            request: isEdit ? item.request : (infoContainer.dataset.requestValue || null)
        };

        try {
            if (isEdit) {
                await window.api.distribusi.update(item.id, payload);
            } else {
                await window.api.distribusi.insert(payload);
            }
            showToast('Distribusi berhasil disimpan!');
            closeModal();
            renderView('distribusi');
        } catch (err) {
            showToast('Gagal menyimpan distribusi: ' + err.message, 'error');
        }
    });
}

// -------------------------------------------------------------------
// ATTACH LISTENERS
// -------------------------------------------------------------------
function attachDistribusiListeners() {
    const btnDownload = document.getElementById('btn-download-distribusi');
    if (btnDownload) {
        btnDownload.addEventListener('click', async () => {
            try {
                const [distRes, qurbanRes, penerimaRes, panitiaRes] = await Promise.all([
                    window.api.distribusi.select(),
                    window.api.pengqurban.select(),
                    window.api.penerima.select(),
                    window.api.panitia.select()
                ]);

                const data = distRes.data;
                const qurbans = qurbanRes.data || [];
                const penerimas = penerimaRes.data || [];
                const panitias = panitiaRes.data || [];

                if (!data || data.length === 0) return showToast('Data kosong', 'error');

                const exportData = data.map(item => {
                    const { id, id_penerima, ...rest } = item;

                    let nama_penerima = id_penerima || '';

                    if (id_penerima) {
                        if (item.kelompok === 'Pengqurban') {
                            const q = qurbans.find(x => x.id === id_penerima);
                            if (q) nama_penerima = q.nama;
                        } else if (item.kelompok === 'Penerima') {
                            const p = penerimas.find(x => x.id === id_penerima);
                            if (p) nama_penerima = p.nama;
                        } else if (item.kelompok === 'Panitia') {
                            const p = panitias.find(x => x.id === id_penerima);
                            if (p) nama_penerima = p.nama;
                        }
                    } else if (item.wilayah) {
                        nama_penerima = item.wilayah;
                    }

                    return {
                        'Kelompok': rest.kelompok,
                        'Nama/Wilayah Penerima': nama_penerima,
                        'Nama Petugas': rest.nama_petugas,
                        'Porsi KG': rest.porsi_kg,
                        'Porsi Sapi': rest.porsi_sapi,
                        'Porsi Kambing': rest.porsi_kambing,
                        'Request Khusus': rest.porsi_khusus,
                        'Tanggal': rest.created_at ? new Date(rest.created_at).toLocaleDateString('id-ID') : ''
                    };
                });

                const ws = XLSX.utils.json_to_sheet(exportData);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Distribusi");

                XLSX.writeFile(wb, "Laporan_Distribusi.xlsx");
                showToast('Laporan berhasil diunduh!');
            } catch (err) {
                showToast('Gagal mengunduh laporan: ' + err.message, 'error');
            }
        });
    }

    const btnRingkasan = document.getElementById('btn-ringkasan-distribusi');
    if (btnRingkasan) {
        btnRingkasan.addEventListener('click', () => {
            renderView('ringkasan_distribusi');
        });
    }

    document.querySelectorAll('.btn-distribusi').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kelompok = e.currentTarget.dataset.kelompok;
            const id = e.currentTarget.dataset.id || null;
            const wilayah = e.currentTarget.dataset.wilayah || null;
            showFormDistribusi(kelompok, id, wilayah);
        });
    });

    document.querySelectorAll('.btn-delete-dist').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;
            if (await showConfirm('Hapus Data', 'Yakin ingin menghapus data ini?')) {
                try {
                    await window.api.distribusi.delete(id);
                    showToast('Data terhapus');
                    renderView('distribusi');
                } catch (err) {
                    showToast('Gagal menghapus: ' + err.message, 'error');
                }
            }
        });
    });

    const fab = document.getElementById('btn-fab-distribusi');
    if (fab) {
        fab.addEventListener('click', () => showFormDistribusi());
    }

    // Filter Logic
    const filterBtns = document.querySelectorAll('.btn-filter-distribusi');
    const sections = document.querySelectorAll('.distribusi-section');

    const btnLihatKebutuhan = document.querySelector('.btn-lihat-kebutuhan');
    if (btnLihatKebutuhan) {
        btnLihatKebutuhan.addEventListener('click', () => {
            if (window._kebutuhanModalHtml) {
                showModal(window._kebutuhanModalHtml);
            }
        });
    }

    const btnLihatTerdistribusi = document.querySelector('.btn-lihat-terdistribusi');
    if (btnLihatTerdistribusi) {
        btnLihatTerdistribusi.addEventListener('click', () => {
            if (window._terdistribusiModalHtml) {
                showModal(window._terdistribusiModalHtml);
            }
        });
    }

    filterBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetFilter = e.currentTarget.dataset.filter;

            // Reset buttons
            filterBtns.forEach(b => {
                b.classList.remove('bg-qurban-700', 'text-white');
                b.classList.add('bg-sky-100', 'text-slate-700');
            });

            // Set active button
            e.currentTarget.classList.remove('bg-sky-100', 'text-slate-700');
            e.currentTarget.classList.add('bg-qurban-700', 'text-white');

            // Hide all sections, show target
            sections.forEach(sec => sec.classList.add('hidden'));
            const targetSection = document.getElementById(`distribusi-${targetFilter}`);
            if (targetSection) targetSection.classList.remove('hidden');
        });
    });
}
