// Supabase Configuration & Initialization
const SUPABASE_URL = window.ENV?.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.ENV?.SUPABASE_ANON_KEY || '';

let supabaseClient = null;

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
    console.log("Menghubungkan ke Supabase...");
    console.log("URL:", SUPABASE_URL);
    console.log("Key Length:", SUPABASE_ANON_KEY.length); // Cek panjang kunci
    supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.warn("Supabase credentials not found. Using Mock Data mode for demonstration.");
}

// -------------------------------------------------------------------
// MOCK DATA LAYER (Fallback if Supabase is not configured)
// -------------------------------------------------------------------
const mockData = {
    pengguna: [
        { id: 'u1', username: 'admin', nama: 'Administrator', role: 'admin' },
        { id: 'u2', username: 'doku', nama: 'Tim Dokumentasi', role: 'dokumentasi' },
        { id: 'u3', username: 'dist', nama: 'Tim Distribusi', role: 'distribusi' }
    ],
    pengqurban: [
        { id: '1', nama: 'Ahmad Abdullah', wilayah: 'RT 1 RW 6', alamat: '', no_telp: '081234567890', kelompok: 'Sapi Kelompok 1', status_lunas: true, created_at: new Date().toISOString() },
        { id: '2', nama: 'Budi Santoso', wilayah: 'RT 2 RW 6', alamat: '', no_telp: '', kelompok: 'Sapi Kelompok 1', status_lunas: false, created_at: new Date().toISOString() },
        { id: '3', nama: 'Rizky Pratama', wilayah: 'RT 1 RW 7', alamat: '', no_telp: '085612345678', kelompok: 'Kambing', status_lunas: true, created_at: new Date().toISOString() }
    ],
    penerima: [
        { id: '1', nama: 'Bapak Slamet', wilayah: 'RT 1 RW 6', alamat: 'Jl. Melati No. 12', jumlah: 1, jumlah_kg: 0, no_telp: '', muslim: true, created_at: new Date().toISOString() },
        { id: '2', nama: 'Ibu Wahyuni', wilayah: 'RT 1 RW 6', alamat: 'Jl. Mawar No. 45', jumlah: 1, jumlah_kg: 0, no_telp: '', muslim: true, created_at: new Date().toISOString() },
        { id: '3', nama: 'Pak RT Mulyono', wilayah: 'RT 2 RW 6', alamat: 'Kompleks Asri B-10', jumlah: 1, jumlah_kg: 0, no_telp: '', muslim: true, created_at: new Date().toISOString() }
    ],
    panitia: [
        { id: '1', nama: 'Ahmad Yani', wilayah: 'RT 1 RW 6', tugas: ['Penyembelihan', 'Pengulitan'], is_koordinator: true, hadir: true, created_at: new Date().toISOString() },
        { id: '2', nama: 'Siti Aminah', wilayah: 'RT 2 RW 6', tugas: ['Pencacahan', 'Penimbangan'], is_koordinator: true, hadir: false, created_at: new Date().toISOString() },
        { id: '3', nama: 'Rizky Ridho', wilayah: 'RT 1 RW 7', tugas: ['Distribusi'], is_koordinator: false, hadir: false, created_at: new Date().toISOString() }
    ],
    transaksi: [
        { id: '1', nama_transaksi: 'Uang Muka Sapi 1', tanggal: '2024-06-01', jenis: 'pendapatan', nominal: 5000000, created_at: new Date().toISOString() },
        { id: '2', nama_transaksi: 'Beli Tali & Plastik', tanggal: '2024-06-02', jenis: 'pengeluaran', nominal: 150000, created_at: new Date().toISOString() }
    ],
    distribusi: [
        { id: '1', kelompok: 'Pengqurban', id_penerima: '2', wilayah: null, nama_petugas: 'Ahmad', porsi_kg: 4, porsi_sapi: 2, porsi_kambing: 0, porsi_khusus: '', request: 'Daging 4 kg + 3 bungkus (sapi/kambing)', created_at: new Date().toISOString() },
        { id: '2', kelompok: 'Penerima', id_penerima: null, wilayah: 'RT 2 RW 7', nama_petugas: 'Budi', porsi_kg: 0, porsi_sapi: 45, porsi_kambing: 0, porsi_khusus: '', request: '45 Porsi', created_at: new Date().toISOString() }
    ],
    dokumentasi: []
};

// Simple ID generator
const generateId = () => Math.random().toString(36).substr(2, 9);

// Mock DB wrapper to simulate Supabase API structure
const db = {
    pengguna: {
        login: async (username, password) => {
            if (supabaseClient) {
                // In a real app, you might query a custom table if not using Supabase Auth
                const { data, error } = await supabaseClient.from('pengguna').select('*').eq('username', username).single();
                if (error) throw error;
                // Note: Real app should check hashed password!
                if (data.password !== password) throw new Error("Invalid credentials");
                return { user: data };
            } else {
                const user = mockData.pengguna.find(u => u.username === username);
                if (user && password === 'admin123') { // hardcoded mock pass
                    return { user };
                }
                throw new Error("Invalid credentials (Mock: try admin/admin123)");
            }
        }
    },
    pengqurban: {
        select: async () => supabaseClient ? await supabaseClient.from('pengqurban').select('*').order('created_at', { ascending: false }) : { data: [...mockData.pengqurban], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('pengqurban').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.pengqurban.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('pengqurban').update(data).eq('id', id).select();
            const idx = mockData.pengqurban.findIndex(item => item.id === id);
            if (idx > -1) mockData.pengqurban[idx] = { ...mockData.pengqurban[idx], ...data };
            return { data: [mockData.pengqurban[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('pengqurban').delete().eq('id', id);
            mockData.pengqurban = mockData.pengqurban.filter(item => item.id !== id);
            return { error: null };
        }
    },
    penerima: {
        select: async () => supabaseClient ? await supabaseClient.from('penerima').select('*').order('created_at', { ascending: false }) : { data: [...mockData.penerima], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('penerima').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.penerima.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('penerima').update(data).eq('id', id).select();
            const idx = mockData.penerima.findIndex(item => item.id === id);
            if (idx > -1) mockData.penerima[idx] = { ...mockData.penerima[idx], ...data };
            return { data: [mockData.penerima[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('penerima').delete().eq('id', id);
            mockData.penerima = mockData.penerima.filter(item => item.id !== id);
            return { error: null };
        }
    },
    panitia: {
        select: async () => supabaseClient ? await supabaseClient.from('panitia').select('*').order('created_at', { ascending: false }) : { data: [...mockData.panitia], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('panitia').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.panitia.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('panitia').update(data).eq('id', id).select();
            const idx = mockData.panitia.findIndex(item => item.id === id);
            if (idx > -1) mockData.panitia[idx] = { ...mockData.panitia[idx], ...data };
            return { data: [mockData.panitia[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('panitia').delete().eq('id', id);
            mockData.panitia = mockData.panitia.filter(item => item.id !== id);
            return { error: null };
        }
    },
    transaksi: {
        select: async () => supabaseClient ? await supabaseClient.from('transaksi').select('*').order('tanggal', { ascending: false }) : { data: [...mockData.transaksi], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('transaksi').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.transaksi.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('transaksi').update(data).eq('id', id).select();
            const idx = mockData.transaksi.findIndex(item => item.id === id);
            if (idx > -1) mockData.transaksi[idx] = { ...mockData.transaksi[idx], ...data };
            return { data: [mockData.transaksi[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('transaksi').delete().eq('id', id);
            mockData.transaksi = mockData.transaksi.filter(item => item.id !== id);
            return { error: null };
        }
    },
    distribusi: {
        select: async () => supabaseClient ? await supabaseClient.from('distribusi').select('*').order('created_at', { ascending: false }) : { data: [...mockData.distribusi], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('distribusi').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.distribusi.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('distribusi').update(data).eq('id', id).select();
            const idx = mockData.distribusi.findIndex(item => item.id === id);
            if (idx > -1) mockData.distribusi[idx] = { ...mockData.distribusi[idx], ...data };
            return { data: [mockData.distribusi[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('distribusi').delete().eq('id', id);
            mockData.distribusi = mockData.distribusi.filter(item => item.id !== id);
            return { error: null };
        }
    },
    dokumentasi: {
        select: async () => supabaseClient ? await supabaseClient.from('dokumentasi').select('*').order('created_at', { ascending: false }) : { data: [...mockData.dokumentasi], error: null },
        insert: async (data) => {
            if (supabaseClient) return await supabaseClient.from('dokumentasi').insert([data]).select();
            const newItem = { id: generateId(), created_at: new Date().toISOString(), ...data };
            mockData.dokumentasi.unshift(newItem);
            return { data: [newItem], error: null };
        },
        update: async (id, data) => {
            if (supabaseClient) return await supabaseClient.from('dokumentasi').update(data).eq('id', id).select();
            const idx = mockData.dokumentasi.findIndex(item => item.id === id);
            if (idx > -1) mockData.dokumentasi[idx] = { ...mockData.dokumentasi[idx], ...data };
            return { data: [mockData.dokumentasi[idx]], error: null };
        },
        delete: async (id) => {
            if (supabaseClient) return await supabaseClient.from('dokumentasi').delete().eq('id', id);
            mockData.dokumentasi = mockData.dokumentasi.filter(item => item.id !== id);
            return { error: null };
        }
    }
};

window.api = db;
