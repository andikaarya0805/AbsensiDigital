const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, PageNumber, PageBreak,
  Header, Footer, NumberFormat, convertInchesToTwip,
  SectionType, BorderStyle, TabStopType, TabStopPosition,
  ImageRun
} = require('docx');
const fs = require('fs');

const A4_WIDTH = 11906;
const A4_HEIGHT = 16838;
const MARGIN = convertInchesToTwip(1.18);
const MARGIN_BINDING = convertInchesToTwip(1.57);

function heading1(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 360, after: 240 },
    children: [new TextRun({ text, bold: true, size: 28, font: 'Times New Roman' })],
  });
}
function heading2(text) {
  return new Paragraph({
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })],
  });
}
function heading3(text) {
  return new Paragraph({
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })],
  });
}
function para(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 200, line: 480, lineRule: 'auto' },
    indent: { firstLine: 720 },
    children: [new TextRun({ text, size: 24, font: 'Times New Roman', ...opts })],
  });
}
function paraNoIndent(text, opts = {}) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 200, line: 480, lineRule: 'auto' },
    children: [new TextRun({ text, size: 24, font: 'Times New Roman', ...opts })],
  });
}
function listItem(text, num, level = 0) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { before: 0, after: 160, line: 480, lineRule: 'auto' },
    indent: { left: level === 0 ? 720 : 1080, hanging: 360 },
    children: [new TextRun({ text: `${num}. ${text}`, size: 24, font: 'Times New Roman' })],
  });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function spacer() { return new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun('')] }); }
function centeredBold(text, size = 24) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 200 },
    children: [new TextRun({ text, bold: true, size, font: 'Times New Roman' })],
  });
}
function centered(text, size = 24) {
  return new Paragraph({
    alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 },
    children: [new TextRun({ text, size, font: 'Times New Roman' })],
  });
}

// ===== BUILD CHILDREN ARRAY =====
const children = [];

// COVER
children.push(spacer(), spacer());
children.push(centeredBold('PROPOSAL SKRIPSI', 28));
children.push(spacer());
children.push(centeredBold('PENERAPAN HMAC SHA-256 DAN HAVERSINE FORMULA', 28));
children.push(centeredBold('UNTUK VALIDASI IDENTITAS PENGGUNA PADA', 28));
children.push(centeredBold('APLIKASI MOBILE BERBASIS QR CODE DINAMIS', 28));
children.push(spacer(), spacer(), spacer());
children.push(new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { before: 0, after: 240 },
  children: [new TextRun({ text: '[Logo Universitas Pamulang]', size: 24, italics: true, font: 'Times New Roman' })],
}));
children.push(spacer(), spacer());
children.push(centered('OLEH:'));
children.push(centeredBold('ANDIKA ARYA'));
children.push(centeredBold('(ISI NIM KAMU DI SINI)'));
children.push(spacer(), spacer(), spacer());
children.push(centeredBold('PROGRAM STUDI TEKNIK INFORMATIKA'));
children.push(centeredBold('FAKULTAS ILMU KOMPUTER'));
children.push(centeredBold('UNIVERSITAS PAMULANG'));
children.push(centeredBold('TANGERANG SELATAN'));
children.push(centeredBold('2025'));
children.push(pageBreak());

// KATA PENGANTAR
children.push(heading1('KATA PENGANTAR'));
children.push(para('Puji syukur penulis panjatkan ke hadirat Allah SWT yang telah melimpahkan rahmat dan karunia-Nya sehingga penulis dapat menyelesaikan penulisan proposal skripsi ini. Sholawat serta salam senantiasa tercurahkan kepada Nabi Muhammad SAW. Proposal skripsi ini berjudul "Penerapan HMAC SHA-256 dan Haversine Formula untuk Validasi Identitas Pengguna pada Aplikasi Mobile Berbasis QR Code Dinamis" disusun sebagai salah satu syarat untuk memenuhi tugas akhir pada Program Studi Teknik Informatika Universitas Pamulang.'));
children.push(para('Dalam penyelesaian proposal ini, penulis mendapatkan banyak bantuan dan dukungan dari berbagai pihak. Oleh karena itu, penulis ingin menyampaikan ucapan terima kasih kepada:'));
children.push(listItem('Bapak Dr. E. Nurzaman A.M., M.M., selaku Rektor Universitas Pamulang, yang telah memberikan fasilitas dan motivasi kepada seluruh civitas akademik.', 1));
children.push(listItem('Bapak Yan Mitha Djaksana, S.Kom., M.Kom., selaku Dekan Fakultas Ilmu Komputer yang telah mendukung kegiatan penelitian mahasiswa.', 2));
children.push(listItem('Bapak Dr. Eng. Ahmad Musyafa, S.Kom., M.Kom., selaku Ketua Program Studi Teknik Informatika Universitas Pamulang, yang senantiasa memberikan bimbingan dan arahan positif.', 3));
children.push(listItem('Seluruh dosen Program Studi Teknik Informatika Universitas Pamulang atas ilmu dan bimbingan yang telah diberikan selama perkuliahan.', 4));
children.push(listItem('Orang tua dan keluarga tercinta yang selalu memberikan dukungan moral maupun materiil serta doa yang tiada henti kepada penulis.', 5));
children.push(para('Penulis menyadari bahwa proposal skripsi ini masih jauh dari sempurna. Oleh karena itu, segala kritik dan saran yang bersifat membangun sangat penulis harapkan demi perbaikan dan penyempurnaan di masa mendatang.'));
children.push(spacer());
children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'Tangerang Selatan, September 2025', size: 24, font: 'Times New Roman' })] }));
children.push(spacer(), spacer(), spacer());
children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: 'Andika Arya', size: 24, font: 'Times New Roman', bold: true })] }));
children.push(new Paragraph({ alignment: AlignmentType.RIGHT, spacing: { before: 0, after: 120 }, children: [new TextRun({ text: '(ISI NIM)', size: 24, font: 'Times New Roman' })] }));
children.push(pageBreak());

// DAFTAR ISI
children.push(heading1('DAFTAR ISI'));
children.push(paraNoIndent('KATA PENGANTAR ............................................................... ii'));
children.push(paraNoIndent('DAFTAR ISI ............................................................................ iii'));
children.push(paraNoIndent('BAB I PENDAHULUAN ........................................................... 1'));
children.push(paraNoIndent('    1.1 Latar Belakang ............................................................... 1'));
children.push(paraNoIndent('    1.2 Identifikasi Masalah ....................................................... 4'));
children.push(paraNoIndent('    1.3 Rumusan Masalah .......................................................... 4'));
children.push(paraNoIndent('    1.4 Batasan Masalah ............................................................ 5'));
children.push(paraNoIndent('    1.5 Tujuan Penelitian ............................................................ 6'));
children.push(paraNoIndent('    1.6 Manfaat Penelitian .......................................................... 6'));
children.push(paraNoIndent('    1.7 Metodologi Penelitian ..................................................... 7'));
children.push(paraNoIndent('    1.8 Sistematika Penulisan ..................................................... 9'));
children.push(paraNoIndent('BAB II LANDASAN TEORI ........................................................ 11'));
children.push(paraNoIndent('    2.1 Penelitian Terdahulu ....................................................... 11'));
children.push(paraNoIndent('    2.2 Tinjauan Pustaka ............................................................ 16'));
children.push(paraNoIndent('    2.3 Aplikasi Pendukung ........................................................ 24'));
children.push(paraNoIndent('    2.4 Kerangka Pemikiran ........................................................ 25'));
children.push(paraNoIndent('BAB III ANALISA DAN PERANCANGAN .................................... 26'));
children.push(paraNoIndent('    3.1 Analisa Sistem ................................................................ 26'));
children.push(paraNoIndent('    3.2 Metode Usulan ................................................................ 28'));
children.push(paraNoIndent('    3.3 Perancangan Sistem ........................................................ 29'));
children.push(paraNoIndent('    3.4 Perancangan Fitur Keamanan ........................................... 34'));
children.push(paraNoIndent('DAFTAR PUSTAKA ..................................................................... 37'));
children.push(pageBreak());

// BAB I
children.push(heading1('BAB I'));
children.push(heading1('PENDAHULUAN'));
children.push(spacer());
children.push(heading2('1.1 Latar Belakang'));
children.push(para('Perkembangan teknologi informasi yang pesat telah membawa perubahan signifikan pada berbagai aspek kehidupan manusia, termasuk dalam pengelolaan kehadiran atau absensi di lingkungan pendidikan. Sistem absensi manual yang masih banyak digunakan hingga saat ini terbukti memiliki berbagai kelemahan, seperti tingginya potensi kecurangan berupa titip absen, lambatnya proses rekapitulasi data, serta sulitnya pemantauan kehadiran secara real-time oleh pengajar maupun pihak administrasi. Fenomena ini menuntut adanya inovasi dalam mekanisme pencatatan kehadiran yang tidak hanya efisien, tetapi juga aman dari berbagai bentuk manipulasi.'));
children.push(para('Di era digital ini, pemanfaatan teknologi seperti Quick Response Code (QR Code), Location-Based Services (LBS), dan mobile computing membuka peluang besar untuk mengembangkan sistem absensi yang lebih akurat, efisien, dan sulit untuk dimanipulasi. QR Code merupakan representasi dua dimensi dari data yang dapat dipindai secara cepat menggunakan kamera perangkat mobile. Teknologi ini telah banyak diaplikasikan dalam berbagai sektor, termasuk pembayaran digital, identifikasi produk, dan autentikasi pengguna. Namun demikian, sistem absensi berbasis QR Code statis saja tidak cukup untuk mencegah kecurangan. Salah satu bentuk kecurangan yang umum terjadi adalah titip absen, yaitu kondisi di mana seorang mahasiswa meminjam kode QR atau mengirimkan tangkapan layar (screenshot) kepada temannya untuk melakukan absensi tanpa kehadirannya yang sesungguhnya.'));
children.push(para('Untuk mengatasi permasalahan keamanan pada QR Code statis, diperlukan mekanisme pengamanan yang menjamin integritas dan keaslian data. Hash-based Message Authentication Code (HMAC) menggunakan SHA-256 merupakan salah satu mekanisme kriptografi yang handal untuk tujuan tersebut. HMAC SHA-256 bekerja dengan cara menandatangani (signing) payload data menggunakan kunci rahasia (secret key), sehingga menghasilkan signature unik yang tidak dapat dipalsukan tanpa mengetahui kunci tersebut. Dalam konteks sistem absensi, HMAC SHA-256 digunakan untuk mengamankan token QR Code dinamis yang berubah setiap interval waktu tertentu (misalnya 30 detik). Dengan demikian, setiap QR Code yang dihasilkan memiliki masa berlaku yang sangat singkat dan tidak dapat direproduksi tanpa kunci rahasia yang tepat.'));
children.push(para('Selain pengamanan token, validasi kehadiran fisik pengguna di lokasi yang ditentukan merupakan aspek yang tidak kalah penting. Teknologi Geofencing memungkinkan sistem untuk mendefinisikan batas virtual di sekitar area tertentu dan memverifikasi apakah perangkat pengguna berada dalam radius yang telah ditentukan. Untuk mendapatkan tingkat akurasi yang tinggi dalam perhitungan jarak, penelitian ini menerapkan Haversine Formula. Formula Haversine merupakan persamaan trigonometri yang digunakan untuk menghitung jarak lingkaran besar (great-circle distance) antara dua titik pada permukaan bola berdasarkan koordinat lintang (latitude) dan bujur (longitude). Formula ini dipilih karena mempertimbangkan kelengkungan permukaan bumi, sehingga memberikan hasil perhitungan jarak yang lebih presisi untuk navigasi jarak pendek dibandingkan metode Euclidean yang mengasumsikan permukaan datar.'));
children.push(para('Berdasarkan kondisi tersebut, peneliti tertarik untuk mengembangkan aplikasi absensi digital bernama HadirMu yang mengintegrasikan dua komponen algoritmik utama: HMAC SHA-256 untuk validasi keaslian token QR Code dinamis, dan Haversine Formula untuk validasi lokasi kehadiran fisik pengguna. Aplikasi ini dikembangkan menggunakan framework React Native dengan Expo SDK untuk platform mobile (Android dan iOS), serta Supabase sebagai infrastruktur cloud database yang mendukung sinkronisasi data secara realtime. Penelitian ini diharapkan dapat menjadi solusi komprehensif atas permasalahan keamanan absensi di lingkungan pendidikan.'));
children.push(spacer());

children.push(heading2('1.2 Identifikasi Masalah'));
children.push(para('Berdasarkan uraian latar belakang di atas, dapat diidentifikasi beberapa permasalahan utama yang menjadi dasar penelitian ini, yaitu:'));
children.push(listItem('Sistem absensi berbasis QR Code statis rentan terhadap kecurangan berupa titip absen melalui tangkapan layar (screenshot), sehingga data kehadiran tidak mencerminkan kondisi yang sesungguhnya.', 1));
children.push(listItem('Belum adanya mekanisme kriptografi yang menjamin integritas dan keaslian data pada token QR Code yang digunakan untuk proses absensi di lingkungan pendidikan.', 2));
children.push(listItem('Tidak tersedianya validasi lokasi secara otomatis yang memastikan pengguna benar-benar hadir di tempat yang telah ditentukan saat melakukan absensi, sehingga memungkinkan manipulasi lokasi.', 3));
children.push(listItem('Belum adanya implementasi perhitungan jarak yang akurat menggunakan formula geodesik untuk membatasi radius absensi pada permukaan bumi yang melengkung.', 4));
children.push(listItem('Proses rekapitulasi data kehadiran yang masih dilakukan secara manual membutuhkan waktu lama dan rentan terhadap kesalahan pencatatan.', 5));
children.push(spacer());

children.push(heading2('1.3 Rumusan Masalah'));
children.push(para('Berdasarkan identifikasi masalah yang telah diuraikan, maka dapat dirumuskan beberapa pertanyaan penelitian sebagai berikut:'));
children.push(listItem('Bagaimana merancang dan mengimplementasikan algoritma HMAC SHA-256 untuk mengamankan token QR Code dinamis pada aplikasi absensi mobile HadirMu?', 1));
children.push(listItem('Bagaimana menerapkan Haversine Formula untuk menentukan radius geofencing yang akurat dalam memvalidasi lokasi kehadiran fisik pengguna?', 2));
children.push(listItem('Bagaimana mengintegrasikan kedua algoritma tersebut ke dalam aplikasi mobile berbasis React Native dengan backend Supabase untuk mendukung validasi identitas dan lokasi secara simultan?', 3));
children.push(listItem('Seberapa efektif penerapan HMAC SHA-256 dan Haversine Formula dalam mencegah praktik manipulasi absensi dibandingkan dengan sistem konvensional?', 4));
children.push(spacer());

children.push(heading2('1.4 Batasan Masalah'));
children.push(para('Untuk menjaga fokus penelitian agar tetap terarah dan sesuai dengan tujuan yang ingin dicapai, maka penelitian ini dibatasi pada hal-hal berikut:'));
children.push(listItem('Aplikasi HadirMu dikembangkan menggunakan framework React Native (Expo) dan ditujukan untuk platform Android dan iOS, namun pengujian utama dilakukan pada platform Android.', 1));
children.push(listItem('Algoritma keamanan token menggunakan HMAC SHA-256 dengan secret key yang disimpan sebagai environment variable pada sisi server dan aplikasi.', 2));
children.push(listItem('Perhitungan jarak geofencing menggunakan Haversine Formula dengan radius default 50 meter dari titik pusat absensi yang dikonfigurasi oleh administrator.', 3));
children.push(listItem('Backend sistem menggunakan Supabase sebagai platform Backend-as-a-Service, meliputi database PostgreSQL, autentikasi, dan real-time subscription.', 4));
children.push(listItem('QR Code dinamis diperbarui setiap 30 detik menggunakan kombinasi timestamp dan signature HMAC SHA-256.', 5));
children.push(listItem('Device Binding dilakukan menggunakan identifikasi unik perangkat yang disimpan secara persisten menggunakan Expo SecureStore. Satu akun hanya dapat terikat pada satu perangkat pada satu waktu.', 6));
children.push(listItem('Sistem mendukung tiga peran pengguna: Administrator (pengelolaan data), Guru (pembuatan sesi absensi), dan Siswa (pelaksanaan absensi).', 7));
children.push(spacer());

children.push(heading2('1.5 Tujuan Penelitian'));
children.push(para('Adapun tujuan yang ingin dicapai dalam penelitian ini adalah sebagai berikut:'));
children.push(listItem('Mengimplementasikan algoritma HMAC SHA-256 untuk menghasilkan signature unik pada setiap token QR Code dinamis, sehingga menjamin integritas dan keaslian data absensi.', 1));
children.push(listItem('Menerapkan Haversine Formula untuk menghitung jarak geodesik secara presisi antara koordinat perangkat pengguna dan titik lokasi absensi sebagai mekanisme geofencing.', 2));
children.push(listItem('Mengintegrasikan kedua algoritma tersebut ke dalam satu sistem aplikasi mobile yang terhubung dengan database realtime Supabase.', 3));
children.push(listItem('Mengukur efektivitas kombinasi HMAC SHA-256 dan Haversine Formula dalam mencegah kecurangan absensi pada lingkungan pendidikan.', 4));
children.push(spacer());

children.push(heading2('1.6 Manfaat Penelitian'));
children.push(heading3('1. Bagi Penulis'));
children.push(para('Penelitian ini memberikan pengalaman praktis dalam penerapan algoritma kriptografi HMAC SHA-256 dan formula geodesik Haversine pada pengembangan aplikasi mobile menggunakan React Native dan Expo. Penulis juga dapat mengembangkan kompetensi di bidang mobile computing, keamanan sistem informasi, dan implementasi backend modern dengan Supabase.'));
children.push(heading3('2. Bagi Institusi Pendidikan'));
children.push(para('Hasil penelitian ini dapat menjadi solusi nyata bagi institusi pendidikan yang ingin meningkatkan akurasi dan integritas data kehadiran. Dengan mengadopsi sistem HadirMu yang dilengkapi validasi kriptografi dan geolokasi, proses absensi dapat dilakukan lebih efisien, transparan, dan bebas dari manipulasi.'));
children.push(heading3('3. Bagi Universitas Pamulang'));
children.push(para('Penelitian ini menunjukkan kemampuan mahasiswa dalam mengaplikasikan ilmu kriptografi dan matematika geodesik untuk memecahkan permasalahan nyata di dunia pendidikan, serta memperkaya koleksi karya ilmiah di bidang keamanan aplikasi mobile.'));
children.push(spacer());

children.push(heading2('1.7 Metodologi Penelitian'));
children.push(heading3('1.7.1 Metode Pengumpulan Data'));
children.push(para('Metode yang digunakan untuk memperoleh data dan informasi dalam penelitian ini adalah:'));
children.push(listItem('Studi Literatur: Dilakukan dengan menelaah berbagai sumber pustaka, termasuk jurnal ilmiah nasional dan internasional, buku teks kriptografi, artikel teknis mengenai HMAC dan Haversine, serta dokumentasi resmi teknologi yang digunakan (React Native, Expo, Supabase).', 1));
children.push(listItem('Observasi: Penulis melakukan pengamatan langsung terhadap proses absensi yang berjalan saat ini di lingkungan pendidikan, untuk mengidentifikasi kelemahan sistem yang ada dan kebutuhan pengguna.', 2));
children.push(listItem('Studi Dokumenter: Mengumpulkan dan mempelajari referensi perancangan sistem absensi digital, implementasi algoritma HMAC, dan penerapan formula Haversine dari berbagai sumber yang relevan.', 3));
children.push(spacer());
children.push(heading3('1.7.2 Metode Pengembangan Sistem (Agile Scrum)'));
children.push(para('Metodologi pengembangan sistem dalam penelitian ini menggunakan pendekatan Agile Scrum yang terdiri dari tahapan-tahapan iteratif sebagai berikut:'));
children.push(listItem('Product Backlog: Mengidentifikasi seluruh kebutuhan fungsional dan non-fungsional sistem HadirMu, termasuk fitur HMAC SHA-256, Haversine Geofencing, Device Binding, manajemen kelas, dan laporan kehadiran. Setiap kebutuhan didefinisikan sebagai User Story dengan prioritas.', 1));
children.push(listItem('Sprint Planning: Merencanakan pembagian kerja dalam siklus pengembangan pendek (sprint) berdurasi 2 minggu. Setiap sprint memiliki tujuan spesifik, seperti implementasi modul autentikasi, modul QR Code, atau modul geofencing.', 2));
children.push(listItem('Sprint Execution: Proses pengembangan kode, desain antarmuka, dan integrasi backend dilakukan selama sprint. Daily stand-up meeting dilakukan untuk memantau progress dan mengatasi hambatan.', 3));
children.push(listItem('Sprint Review: Di akhir setiap sprint, dilakukan evaluasi terhadap fitur yang telah selesai dikembangkan. Demonstrasi produk dilakukan kepada stakeholder untuk mendapatkan umpan balik.', 4));
children.push(listItem('Sprint Retrospective: Tim melakukan refleksi terhadap proses pengembangan sprint sebelumnya untuk mengidentifikasi area perbaikan pada sprint berikutnya.', 5));
children.push(spacer());

children.push(heading2('1.8 Sistematika Penulisan'));
children.push(para('Sistematika penulisan dalam proposal skripsi ini disusun untuk memberikan gambaran yang jelas dan terstruktur mengenai tahapan penelitian yang dilakukan. Penulis membagi laporan menjadi beberapa bab dengan konteks permasalahannya masing-masing.'));
children.push(heading3('BAB I PENDAHULUAN'));
children.push(para('Bab ini menguraikan latar belakang permasalahan yang menjadi dasar dilakukannya penelitian, identifikasi masalah, rumusan masalah, batasan masalah, tujuan penelitian, manfaat penelitian, metodologi penelitian, serta sistematika penulisan.'));
children.push(heading3('BAB II LANDASAN TEORI'));
children.push(para('Bab ini berisi uraian teori-teori yang menjadi dasar penelitian, meliputi konsep HMAC SHA-256, Haversine Formula, QR Code dinamis, Geofencing, React Native, Supabase, dan Device Binding. Di dalamnya juga terdapat kajian penelitian terdahulu yang relevan sebagai pembanding dan penguat teori.'));
children.push(heading3('BAB III ANALISA DAN PERANCANGAN SISTEM'));
children.push(para('Bab ini menjelaskan tahapan analisis kebutuhan sistem HadirMu dan bagaimana sistem tersebut dirancang. Bab ini memuat perancangan arsitektur sistem, pemodelan basis data, diagram alur proses implementasi algoritma HMAC dan Haversine, serta rancangan antarmuka pengguna.'));
children.push(heading3('BAB IV IMPLEMENTASI DAN PENGUJIAN'));
children.push(para('Bab ini menjelaskan proses implementasi aplikasi HadirMu secara lengkap, termasuk kode program utama algoritma HMAC SHA-256 dan Haversine, konfigurasi sistem, hasil implementasi masing-masing fitur, serta hasil pengujian fungsional dan evaluasi efektivitas sistem.'));
children.push(heading3('BAB V PENUTUP'));
children.push(para('Bab ini merupakan bagian akhir yang berisi kesimpulan dari keseluruhan hasil penelitian dan saran-saran untuk pengembangan lebih lanjut.'));
children.push(pageBreak());

// Load BAB II & III from separate file
const babIIIII = require('./generate_proposal_bab2_3.js');
babIIIII.forEach(c => children.push(c));

// BUILD DOCUMENT
const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullets',
      levels: [{ level: 0, format: LevelFormat.BULLET, text: '\u2022', alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 720, hanging: 360 } } } }],
    }],
  },
  styles: { default: { document: { run: { font: 'Times New Roman', size: 24 } } } },
  sections: [{
    properties: {
      page: {
        size: { width: A4_WIDTH, height: A4_HEIGHT },
        margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN_BINDING },
      },
    },
    children,
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync('d:/dika/tugas/AbsensiDigital/Proposal_Skripsi_AndikaArya_V3.docx', buffer);
  console.log('Proposal FINAL generated successfully!');
});
