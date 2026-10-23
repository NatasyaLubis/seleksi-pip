const bcrypt = require('bcryptjs');

// Initial Criteria configuration for PIP (Default 6 criteria)
const DEFAULT_CRITERIA = [
  {
    id: 'crit-1',
    code: 'C1',
    name: 'Penghasilan Orang Tua',
    type: 'cost',
    value_type: 'real_numeric',
    unit: 'Rupiah',
    description: 'Rata-rata pendapatan kotor bulanan gabungan orang tua (Semakin kecil semakin diprioritaskan).',
    final_weight: 0.2845
  },
  {
    id: 'crit-2',
    code: 'C2',
    name: 'Jumlah Tanggungan Anak',
    type: 'benefit',
    value_type: 'real_numeric',
    unit: 'Anak',
    description: 'Jumlah anak yang masih menjadi tanggungan nafkah keluarga.',
    final_weight: 0.1782
  },
  {
    id: 'crit-3',
    code: 'C3',
    name: 'Kondisi Tempat Tinggal',
    type: 'benefit',
    value_type: 'discrete_scale',
    unit: 'Skala 1-5',
    description: 'Kondisi fisik kelayakan rumah (Nilai 5: Sangat Memprihatinkan/Menumpang, Nilai 1: Rumah Mewah).',
    final_weight: 0.1420,
    options: [
      { point: 1, label: 'Rumah Permanen Mewah / Sangat Layak' },
      { point: 2, label: 'Rumah Permanen Standar / Cukup Layak' },
      { point: 3, label: 'Rumah Semi Permanen / Rusak Sedang' },
      { point: 4, label: 'Rumah Papan / Rusak Berat' },
      { point: 5, label: 'Menumpang / Bilik Bambu / Sangat Tidak Layak' }
    ]
  },
  {
    id: 'crit-4',
    code: 'C4',
    name: 'Daya Listrik Rumah',
    type: 'cost',
    value_type: 'real_numeric',
    unit: 'Volt Ampere (VA)',
    description: 'Besaran daya listrik terpasang PLN (450 VA, 900 VA, 1300 VA, dst). Semakin kecil daya, semakin prioritas.',
    final_weight: 0.0890
  },
  {
    id: 'crit-5',
    code: 'C5',
    name: 'Kepemilikan Kartu Bansos (KIP/KKS/PKH)',
    type: 'benefit',
    value_type: 'discrete_scale',
    unit: 'Skala 1-5',
    description: 'Kelengkapan kepemilikan jaminan sosial (Nilai 5: KIP & PKH, Nilai 1: Tidak Memiliki).',
    final_weight: 0.2155,
    options: [
      { point: 1, label: 'Tidak Memiliki Kartu Bansos / SKTM' },
      { point: 2, label: 'Memiliki Surat Keterangan Tidak Mampu (SKTM) Kelurahan' },
      { point: 3, label: 'Memiliki Kartu Keluarga Sejahtera (KKS)' },
      { point: 4, label: 'Memiliki Program Keluarga Harapan (PKH)' },
      { point: 5, label: 'Memiliki Kartu Indonesia Pintar (KIP) & PKH Terdaftar' }
    ]
  },
  {
    id: 'crit-6',
    code: 'C6',
    name: 'Rata-rata Nilai Akademik / Rapor',
    type: 'benefit',
    value_type: 'real_numeric',
    unit: 'Nilai (0-100)',
    description: 'Rata-rata nilai rapor semester terakhir sebagai pertimbangan prestasi akademik siswa.',
    final_weight: 0.0908
  }
];

// 3 Default Decision Makers
const DEFAULT_DECISION_MAKERS = [
  {
    id: 'dm-1',
    name: 'Drs. H. Mulyadi, M.Pd',
    title: 'Kepala Sekolah',
    institution: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
    evaluation: {
      bestCode: 'C1',
      worstCode: 'C4',
      bestToOthers: { C1: 1, C2: 2, C3: 3, C4: 4, C5: 2, C6: 4 },
      othersToWorst: { C1: 4, C2: 3, C3: 2, C4: 1, C5: 3, C6: 2 },
      weights: { C1: 0.2982, C2: 0.1852, C3: 0.1418, C4: 0.0864, C5: 0.2010, C6: 0.0874 },
      xi: 0.048,
      consistencyRatio: 0.029,
      isConsistent: true,
      submittedAt: '2026-10-18T08:30:00.000Z'
    }
  },
  {
    id: 'dm-2',
    name: 'Siti Rahmawati, S.Pd',
    title: 'Wakil Kepala Sekolah Bidang Kesiswaan',
    institution: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
    evaluation: {
      bestCode: 'C1',
      worstCode: 'C6',
      bestToOthers: { C1: 1, C2: 2, C3: 2, C4: 4, C5: 2, C6: 5 },
      othersToWorst: { C1: 5, C2: 3, C3: 3, C4: 2, C5: 3, C6: 1 },
      weights: { C1: 0.2814, C2: 0.1790, C3: 0.1550, C4: 0.0920, C5: 0.2186, C6: 0.0740 },
      xi: 0.052,
      consistencyRatio: 0.023,
      isConsistent: true,
      submittedAt: '2026-10-18T09:15:00.000Z'
    }
  },
  {
    id: 'dm-3',
    name: 'Ahmad Fauzi, S.Kom',
    title: 'Operator & Verifikator PIP Sekolah',
    institution: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
    evaluation: {
      bestCode: 'C5',
      worstCode: 'C4',
      bestToOthers: { C1: 2, C2: 2, C3: 3, C4: 5, C5: 1, C6: 3 },
      othersToWorst: { C1: 4, C2: 3, C3: 2, C4: 1, C5: 5, C6: 2 },
      weights: { C1: 0.2740, C2: 0.1704, C3: 0.1292, C4: 0.0886, C5: 0.2268, C6: 0.1110 },
      xi: 0.045,
      consistencyRatio: 0.020,
      isConsistent: true,
      submittedAt: '2026-10-18T10:00:00.000Z'
    }
  }
];

// Helper to generate realistic student samples
function generateRealisticStudents(count = 120) {
  const firstNames = [
    'Ahmad', 'Muhammad', 'Rizky', 'Dimas', 'Bagus', 'Aditya', 'Fajar', 'Bayu', 'Ilham', 'Arif',
    'Budi', 'Gilang', 'Rian', 'Fauzan', 'Indra', 'Reza', 'Hendra', 'Wahyu', 'Yoga', 'Dedi',
    'Siti', 'Nur', 'Dewi', 'Putri', 'Ayu', 'Rini', 'Dian', 'Tri', 'Indah', 'Lestari',
    'Mega', 'Nadia', 'Nabila', 'Annisa', 'Fitri', 'Aulia', 'Zahra', 'Maya', 'Tia', 'Anggi'
  ];

  const lastNames = [
    'Pratama', 'Saputra', 'Hidayat', 'Kurniawan', 'Santoso', 'Wijaya', 'Setiawan', 'Ramadhan',
    'Nugroho', 'Wibowo', 'Siregar', 'Lubis', 'Nasution', 'Harahap', 'Sinaga', 'Simanjuntak',
    'Utami', 'Wulandari', 'Kusuma', 'Handayani', 'Puspitang', 'Wardani', 'Anggraini', 'Safitri',
    'Pangestu', 'Firmansyah', 'Hakim', 'Anwar', 'Gunawan', 'Susanto', 'Permana', 'Saputri'
  ];

  const parentFirst = ['Joko', 'Bambang', 'Slamet', 'Agus', 'Herman', 'Yanto', 'Supriadi', 'Mulyono', 'Subur', 'Wagino', 'Sutrisno', 'Hasan'];
  const classes = [
    'X-MM', 'X-AKL', 'X-OTKP', 'X-BDP',
    'XI-MM', 'XI-AKL', 'XI-OTKP', 'XI-BDP',
    'XII-MM', 'XII-AKL', 'XII-OTKP', 'XII-BDP'
  ];
  const streets = ['Jl. Melati', 'Jl. Mawar', 'Jl. Merpati', 'Jl. Kenanga', 'Jl. Diponegoro', 'Jl. Sudirman', 'Dusun Krajan', 'Dusun Sukamaju', 'Desa Karanganyar', 'Kampung Nelayan'];

  const incomeLevels = [
    400000, 500000, 600000, 750000, 850000, 950000, 1100000, 1250000, 1400000, 1600000, 1800000, 2100000, 2500000, 3200000
  ];
  const electricPowers = [450, 450, 450, 900, 900, 900, 1300, 1300, 2200];

  const students = [];
  const baseNisn = 3084120000;

  for (let i = 1; i <= count; i++) {
    const fn = firstNames[Math.floor(Math.random() * firstNames.length)];
    const ln = lastNames[Math.floor(Math.random() * lastNames.length)];
    const pn = parentFirst[Math.floor(Math.random() * parentFirst.length)] + ' ' + ln;
    const cls = classes[Math.floor(Math.random() * classes.length)];
    const street = streets[Math.floor(Math.random() * streets.length)] + ' No. ' + (Math.floor(Math.random() * 80) + 1);

    const income = incomeLevels[Math.floor(Math.random() * incomeLevels.length)];
    const dependents = Math.floor(Math.random() * 5) + 1;
    const houseCondition = Math.floor(Math.random() * 5) + 1;
    const electricity = electricPowers[Math.floor(Math.random() * electricPowers.length)];
    const welfareCard = Math.floor(Math.random() * 5) + 1;
    const academicScore = Math.floor(Math.random() * 26) + 70;

    students.push({
      id: `std-${i.toString().padStart(4, '0')}`,
      nisn: (baseNisn + i).toString(),
      nama_lengkap: `${fn} ${ln}`,
      kelas: cls,
      asal_sekolah: 'SMKS DHARMA BHAKTI WALTER MANALU SIBORONGBORONG',
      nama_wali: pn,
      alamat: street,
      values: {
        C1: income,
        C2: dependents,
        C3: houseCondition,
        C4: electricity,
        C5: welfareCard,
        C6: academicScore
      }
    });
  }

  return students;
}

// Default Users for Security / RBAC
const DEFAULT_USERS = [
  {
    id: 'user-operator-1',
    username: 'operator',
    password_hash: bcrypt.hashSync('pip2026', 10),
    full_name: 'Ahmad Fauzi, S.Kom',
    role: 'operator',
    title: 'Operator & Verifikator PIP Sekolah',
    created_at: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'user-kepsek-1',
    username: 'kepsek',
    password_hash: bcrypt.hashSync('kepsek2026', 10),
    full_name: 'Drs. H. Mulyadi, M.Pd',
    role: 'pengambil_keputusan',
    title: 'Kepala Sekolah (Pengambil Keputusan)',
    created_at: '2026-10-18T00:00:00.000Z'
  },
  {
    id: 'user-admin-compat',
    username: 'admin',
    password_hash: bcrypt.hashSync('adminpip2026', 10),
    full_name: 'Drs. H. Mulyadi, M.Pd',
    role: 'pengambil_keputusan',
    title: 'Kepala Sekolah (Pengambil Keputusan)',
    created_at: '2026-10-18T00:00:00.000Z'
  }
];

module.exports = {
  DEFAULT_CRITERIA,
  DEFAULT_DECISION_MAKERS,
  DEFAULT_USERS,
  generateRealisticStudents
};
