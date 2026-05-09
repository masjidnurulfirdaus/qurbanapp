// ===================================================================
// 4. ABSENSI VIEW
// ===================================================================
async function buildAbsensiView() {
    const { data: panitias } = await window.api.panitia.select();
    
    const totalHadir = panitias.filter(p => p.hadir).length;

    // Filter state
    const activeFilter = window.absensiFilter || 'Belum Hadir';
    
    // Apply filter
    const displayedPanitias = activeFilter === 'Belum Hadir' ? panitias.filter(p => !p.hadir) : panitias;

    // Group panitia by Wilayah
    const byWilayah = {};
    displayedPanitias.forEach(p => {
        if(!byWilayah[p.wilayah]) byWilayah[p.wilayah] = [];
        byWilayah[p.wilayah].push(p);
    });

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <div class="bg-qurban-700 text-white rounded-2xl p-5 shadow-lg relative overflow-hidden flex justify-between items-center">
                <div class="absolute -right-4 -bottom-4 opacity-10">
                    <i class="ph ph-calendar-check text-9xl"></i>
                </div>
                <div>
                    <h2 class="text-sm font-medium text-qurban-100 mb-1">Kehadiran Panitia</h2>
                    <div class="flex items-baseline gap-2">
                        <h3 class="text-4xl font-bold">${totalHadir}</h3>
                        <span class="text-sm">/ ${panitias.length} Hadir</span>
                    </div>
                </div>
                <div class="w-14 h-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                    <span class="text-xl font-bold">${Math.round((totalHadir/Math.max(1,panitias.length))*100)}%</span>
                </div>
            </div>
            
            <!-- Filter UI -->
            <div class="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'Semua' ? 'bg-white text-qurban-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} btn-filter-absensi" data-filter="Semua">Semua</button>
                <button class="flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${activeFilter === 'Belum Hadir' ? 'bg-white text-qurban-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'} btn-filter-absensi" data-filter="Belum Hadir">Belum Hadir</button>
            </div>
    `;

    if (displayedPanitias.length === 0) {
        html += `
            <div class="bg-white rounded-2xl p-8 text-center border border-slate-100 shadow-sm mt-6">
                <div class="w-16 h-16 mx-auto bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-3">
                    <i class="ph ph-check-circle text-3xl"></i>
                </div>
                <p class="text-slate-500 font-medium">Semua panitia di wilayah ini sudah hadir.</p>
            </div>
        `;
    }

    Object.keys(byWilayah).sort().forEach(wilayah => {
        const members = byWilayah[wilayah];
        html += `
            <div class="mt-6">
                <h3 class="font-bold text-slate-800 flex items-center gap-2 mb-3 px-1">
                    <i class="ph ph-map-pin text-qurban-600"></i> ${wilayah}
                </h3>
                <div class="space-y-2">
                    ${members.map(m => `
                        <div class="bg-white rounded-2xl p-3 px-4 shadow-sm border border-slate-100 flex justify-between items-center transition-colors ${m.hadir ? 'border-l-4 border-l-qurban-500' : ''}">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full ${m.hadir ? 'bg-qurban-50 text-qurban-600' : 'bg-slate-100 text-slate-400'} flex items-center justify-center text-sm font-bold transition-colors">
                                    ${m.nama.substring(0,2).toUpperCase()}
                                </div>
                                <div>
                                    <h4 class="font-bold text-slate-800 text-sm">${m.nama}</h4>
                                    <p class="text-[10px] text-slate-500">${m.tugas.join(', ')}</p>
                                </div>
                            </div>
                            
                            ${currentUser ? `
                                <label class="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" class="sr-only toggle-absensi" data-id="${m.id}" ${m.hadir ? 'checked' : ''}>
                                    <div class="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-qurban-600 transition-colors"></div>
                                </label>
                            ` : `
                                <span class="text-xs font-bold px-2.5 py-1 rounded-full ${m.hadir ? 'bg-qurban-50 text-qurban-600 border border-qurban-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}">
                                    ${m.hadir ? 'Hadir' : 'Tidak Hadir'}
                                </span>
                            `}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function attachAbsensiListeners() {
    document.querySelectorAll('.btn-filter-absensi').forEach(btn => {
        btn.addEventListener('click', (e) => {
            window.absensiFilter = e.target.dataset.filter;
            renderView('absensi');
        });
    });

    document.querySelectorAll('.toggle-absensi').forEach(toggle => {
        toggle.addEventListener('change', async (e) => {
            const id = e.target.dataset.id;
            const hadir = e.target.checked;
            
            try {
                await window.api.panitia.update(id, { hadir });
                // Re-render to update the progress bar and border colors, but without full loader for smooth UX
                // Actually re-rendering the whole view is easiest for now
                renderView('absensi');
            } catch(err) {
                e.target.checked = !hadir; // revert
                showToast('Gagal mengupdate absensi', 'error');
            }
        });
    });
}
