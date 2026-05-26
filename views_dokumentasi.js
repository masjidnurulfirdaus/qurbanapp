const CLOUDINARY_CLOUD_NAME = "dx7z6tddw"; // Ganti dengan cloud name Anda
const CLOUDINARY_UPLOAD_PRESET = "hxysk86j"; // Ganti dengan upload preset Anda

// ===================================================================
// DOKUMENTASI VIEW (LIST KELOMPOK)
// ===================================================================
async function buildDokumentasiView() {
    const { data: dokumentasiList } = await window.api.dokumentasi.select();
    const { data: pengqurbanList } = await window.api.pengqurban.select();

    // Buat daftar kategori berdasarkan data pengqurban
    let DOKUMENTASI_GROUPS = [];

    // Kelompok Sapi (hanya yang ada anggotanya)
    const sapiGroups = [...new Set(pengqurbanList.filter(p => p.kelompok.includes('Sapi')).map(p => p.kelompok))].sort();
    DOKUMENTASI_GROUPS.push(...sapiGroups);

    // Kelompok Kambing (kategori untuk tiap pengqurban)
    const kambingList = pengqurbanList.filter(p => p.kelompok === 'Kambing').sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at));
    kambingList.forEach((k, i) => {
        DOKUMENTASI_GROUPS.push(`Kambing ${(i + 1).toString()} - ${k.nama}`);
    });

    // Lainnya
    DOKUMENTASI_GROUPS.push("Lainnya");

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-6">
                <button class="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:text-qurban-600 transition-colors" onclick="renderView('pengqurban')">
                    <i class="ph ph-arrow-left text-xl"></i>
                </button>
                <h2 class="text-xl font-bold text-slate-800">Dokumentasi Kurban</h2>
            </div>
            <p class="text-sm text-slate-500">Kelola dan pantau dokumentasi pelaksanaan kurban untuk setiap kelompok.</p>
    `;

    DOKUMENTASI_GROUPS.forEach((group, index) => {
        const groupDocs = dokumentasiList ? dokumentasiList.filter(d => d.kelompok === group) : [];
        const isSapi = group.includes('Sapi');
        const icon = isSapi ? 'ph-cow' : (group.includes('Kambing') ? 'ph-paw-print' : 'ph-dots-three');
        const count = groupDocs.length;

        html += `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden p-4 flex justify-between items-center hover:border-qurban-200 transition-colors">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full bg-qurban-50 text-qurban-600 flex items-center justify-center text-2xl border border-qurban-100 min-w-[48px]">
                        <i class="ph ${icon}"></i>
                    </div>
                    <div>
                        <h4 class="font-bold text-slate-800 break-words line-clamp-2">${group}</h4>
                        <span class="text-xs font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${count > 0 ? 'bg-qurban-50 text-qurban-600' : 'bg-slate-100 text-slate-500'}">
                            ${count > 0 ? count + ' File' : 'Belum Ada'}
                        </span>
                    </div>
                </div>
                <div class="flex items-center gap-2 ml-2">
                    <button class="bg-qurban-50 text-qurban-700 hover:bg-qurban-100 text-sm font-semibold py-2 px-4 rounded-xl transition-colors btn-lihat-dok whitespace-nowrap" data-kel="${group}">
                        Lihat
                    </button>
                </div>
            </div>
        `;
    });

    html += `</div>`;
    return html;
}

function attachDokumentasiListeners() {
    document.querySelectorAll('.btn-lihat-dok').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kel = e.currentTarget.dataset.kel;
            renderView('dokumentasi_detail', kel);
        });
    });

    document.querySelectorAll('.btn-tambah-dok').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const kel = e.currentTarget.dataset.kel;
            renderView('dokumentasi_detail', kel).then(() => {
                const addBtn = document.getElementById('btn-upload-file');
                if (addBtn) addBtn.click();
            });
        });
    });
}

// ===================================================================
// DOKUMENTASI DETAIL VIEW (FILES)
// ===================================================================
async function buildDokumentasiDetailView(kelompok) {
    const { data: dokumentasiList } = await window.api.dokumentasi.select();
    const groupDocs = dokumentasiList ? dokumentasiList.filter(d => d.kelompok === kelompok) : [];

    let html = `
        <div class="p-4 space-y-4 pb-24 view-enter">
            <!-- Header -->
            <div class="flex items-center gap-3 mb-6">
                <button class="p-2 bg-white rounded-full shadow-sm text-slate-600 hover:text-qurban-600 transition-colors" onclick="renderView('dokumentasi')">
                    <i class="ph ph-arrow-left text-xl"></i>
                </button>
                <div>
                    <h2 class="text-xl font-bold text-slate-800">Detail Dokumentasi</h2>
                    <p class="text-sm text-slate-500">${kelompok}</p>
                </div>
            </div>

            ${canEditDokumentasi() ? `
            <div class="bg-white border border-dashed border-qurban-300 rounded-2xl p-6 text-center hover:bg-qurban-50 transition-colors cursor-pointer" id="btn-upload-area">
                <input type="file" id="file-upload-input" accept="image/*,video/*" class="hidden">
                <div class="w-12 h-12 rounded-full bg-qurban-100 text-qurban-600 flex items-center justify-center text-2xl mx-auto mb-3">
                    <i class="ph ph-cloud-arrow-up"></i>
                </div>
                <h4 class="font-bold text-slate-800 mb-1">Tambah Dokumentasi</h4>
                <p class="text-xs text-slate-500">Klik di sini untuk upload foto atau video (Max 20MB)</p>
                <button id="btn-upload-file" class="mt-4 bg-qurban-700 text-white font-medium py-2 px-6 rounded-xl hover:bg-qurban-800 transition-colors">
                    Pilih File
                </button>
            </div>
            ` : ''}

            <!-- List Dokumentasi Full Width -->
            <div class="flex flex-col gap-4 mt-6">
    `;

    if (groupDocs.length === 0) {
        html += `
            <div class="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
                <i class="ph ph-images text-4xl text-slate-300 mb-2"></i>
                <p class="text-slate-500 text-sm">Belum ada dokumentasi untuk ${kelompok}</p>
            </div>
        `;
    } else {
        groupDocs.forEach(doc => {
            const isVideo = doc.file_type && doc.file_type.includes('video');
            const posterUrl = doc.file_url ? doc.file_url.replace(/\.[^/.]+$/, ".jpg") : '';

            html += `
                <div class="relative group rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-slate-100 w-full">
                    ${isVideo ? `
                        <video src="${doc.file_url}" controls poster="${posterUrl}" class="w-full bg-black"></video>
                    ` : `
                        <img src="${doc.file_url}" alt="${doc.file_name}" class="w-full h-auto object-cover cursor-pointer img-preview" data-src="${doc.file_url}">
                    `}
                    
                    ${canEditDokumentasi() ? `
                    <button class="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 btn-delete-file" data-id="${doc.id}">
                        <i class="ph ph-trash"></i>
                    </button>
                    ` : ''}
                </div>
            `;
        });
    }

    html += `
            </div>
        </div>
        
        <!-- Image Preview Modal -->
        <div id="image-preview-modal" class="fixed inset-0 bg-black/90 z-[120] hidden items-center justify-center p-4 opacity-0 transition-opacity duration-300">
            <button id="close-preview-btn" class="absolute top-4 right-4 text-white hover:text-slate-300 p-2">
                <i class="ph ph-x text-3xl"></i>
            </button>
            <img id="preview-img" src="" class="max-w-full max-h-full object-contain rounded-lg">
        </div>
    `;

    return html;
}

function attachDokumentasiDetailListeners(kelompok) {
    const uploadArea = document.getElementById('btn-upload-area');
    const uploadInput = document.getElementById('file-upload-input');
    const uploadBtn = document.getElementById('btn-upload-file');

    if (uploadArea && uploadInput) {
        const triggerUpload = () => uploadInput.click();
        uploadArea.addEventListener('click', (e) => {
            if (e.target !== uploadBtn && e.target !== uploadInput) {
                triggerUpload();
            }
        });
        if (uploadBtn) uploadBtn.addEventListener('click', triggerUpload);

        uploadInput.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validasi tipe
            if (!file.type.includes('image/') && !file.type.includes('video/')) {
                return showToast('Hanya format gambar dan video yang diperbolehkan', 'error');
            }

            // Validasi ukuran (contoh 20MB)
            if (file.size > 100 * 1024 * 1024) {
                return showToast('Ukuran file maksimal 100MB', 'error');
            }

            // Proses Upload Cloudinary
            appContent.classList.add('opacity-50', 'pointer-events-none');
            showToast('Mengupload file... Mohon tunggu', 'success');

            try {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

                const resourceType = file.type.includes('video') ? 'video' : 'image';
                const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;

                const response = await fetch(uploadUrl, {
                    method: 'POST',
                    body: formData
                });

                if (!response.ok) throw new Error('Network response was not ok');
                const result = await response.json();

                if (result.secure_url) {
                    let fileUrl = result.secure_url;

                    // Tambahkan f_auto,q_auto
                    const parts = fileUrl.split('/upload/');
                    if (parts.length === 2) {
                        fileUrl = parts[0] + '/upload/f_auto,q_auto/' + parts[1];
                    }

                    // Simpan ke database
                    const dbPayload = {
                        kelompok: kelompok,
                        file_id: result.public_id,
                        file_url: fileUrl,
                        file_name: file.name,
                        file_type: file.type
                    };

                    await window.api.dokumentasi.insert(dbPayload);
                    showToast('File berhasil diupload!');
                    renderView('dokumentasi_detail', kelompok);
                } else {
                    throw new Error(result.error?.message || 'Upload gagal');
                }

            } catch (err) {
                console.error(err);
                showToast('Gagal mengupload file ke Cloudinary.', 'error');
            } finally {
                appContent.classList.remove('opacity-50', 'pointer-events-none');
                uploadInput.value = '';
            }
        });
    }

    // Delete handlers
    document.querySelectorAll('.btn-delete-file').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const id = e.currentTarget.dataset.id;

            if (await showConfirm('Hapus File', 'Yakin ingin menghapus dokumentasi ini? File yang dihapus tidak bisa dikembalikan.')) {
                appContent.classList.add('opacity-50', 'pointer-events-none');
                try {
                    // Hapus dari db (Hanya db, tidak hapus di cloudinary untuk saat ini)
                    await window.api.dokumentasi.delete(id);
                    showToast('File terhapus');
                    renderView('dokumentasi_detail', kelompok);
                } catch (err) {
                    showToast('Gagal menghapus file', 'error');
                } finally {
                    appContent.classList.remove('opacity-50', 'pointer-events-none');
                }
            }
        });
    });

    // Image Preview Handlers
    const previewModal = document.getElementById('image-preview-modal');
    const previewImg = document.getElementById('preview-img');
    const closePreviewBtn = document.getElementById('close-preview-btn');

    if (previewModal) {
        document.querySelectorAll('.img-preview').forEach(img => {
            img.addEventListener('click', (e) => {
                previewImg.src = e.currentTarget.dataset.src;
                previewModal.classList.remove('hidden');
                requestAnimationFrame(() => {
                    previewModal.classList.remove('opacity-0');
                });
            });
        });

        closePreviewBtn.addEventListener('click', () => {
            previewModal.classList.add('opacity-0');
            setTimeout(() => {
                previewModal.classList.add('hidden');
                previewImg.src = '';
            }, 300);
        });

        previewModal.addEventListener('click', (e) => {
            if (e.target === previewModal) {
                closePreviewBtn.click();
            }
        });
    }
}

