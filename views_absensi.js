// ===================================================================
// 4. ABSENSI VIEW
// ===================================================================
async function buildAbsensiView() {
    const { data: panitias } = await window.api.panitia.select();
    
    // Group panitia by Wilayah
    const byWilayah = {};
    panitias.forEach(p => {
        if(!byWilayah[p.wilayah]) byWilayah[p.wilayah] = [];
        byWilayah[p.wilayah].push(p);
    });

    const totalHadir = panitias.filter(p => p.hadir).length;

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
    `;

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
