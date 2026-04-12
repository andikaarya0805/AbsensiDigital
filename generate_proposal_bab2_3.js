const { Paragraph, TextRun, AlignmentType, PageBreak } = require('docx');

function heading1(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 360, after: 240 }, children: [new TextRun({ text, bold: true, size: 28, font: 'Times New Roman' })] });
}
function heading2(text) {
  return new Paragraph({ spacing: { before: 280, after: 160 }, children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })] });
}
function heading3(text) {
  return new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })] });
}
function para(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 200, line: 480, lineRule: 'auto' }, indent: { firstLine: 720 }, children: [new TextRun({ text, size: 24, font: 'Times New Roman' })] });
}
function paraNoIndent(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 200, line: 480, lineRule: 'auto' }, children: [new TextRun({ text, size: 24, font: 'Times New Roman' })] });
}
function listItem(text, num) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { before: 0, after: 160, line: 480, lineRule: 'auto' }, indent: { left: 720, hanging: 360 }, children: [new TextRun({ text: `${num}. ${text}`, size: 24, font: 'Times New Roman' })] });
}
function spacer() { return new Paragraph({ spacing: { before: 0, after: 200 }, children: [new TextRun('')] }); }
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function centeredItalic(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text, italics: true, size: 24, font: 'Times New Roman' })] });
}
function centeredBoldSmall(text) {
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 0, after: 120 }, children: [new TextRun({ text, bold: true, size: 24, font: 'Times New Roman' })] });
}

const c = [];

// BAB II
c.push(heading1('BAB II'));
c.push(heading1('LANDASAN TEORI'));
c.push(spacer());

c.push(heading2('2.1 Penelitian Terdahulu'));
c.push(para('Dalam penulisan penelitian ini, penulis mengacu pada beberapa penelitian sebelumnya yang berkaitan dengan sistem absensi digital, QR Code, Geofencing, keamanan kriptografi, dan teknologi mobile. Berikut adalah penelitian terdahulu yang relevan:'));
c.push(spacer());

c.push(para('a. Penelitian oleh Kurniadi, D., Septiana, Y., dan Hanifah, M. A. Y. (2022) yang berjudul "Pengembangan Aplikasi Presensi Karyawan Menggunakan Quick Response Code Berbasis Web dan Android" dipublikasikan di Jurnal Algoritma Vol. 19 No. 1 (DOI: 10.33364/algoritma/v.19-1.1062). Penelitian ini mengembangkan sistem presensi karyawan yang memanfaatkan QR Code sebagai pengganti sistem manual. Hasil penelitian menunjukkan bahwa QR Code mampu mempercepat proses input data kehadiran hingga 70% dibandingkan metode konvensional. Namun, penelitian ini masih menggunakan QR Code statis dan belum menerapkan mekanisme keamanan kriptografi untuk mencegah duplikasi kode. Penelitian HadirMu melengkapi kelemahan ini dengan menerapkan HMAC SHA-256 pada payload QR Code.'));

c.push(para('b. Penelitian oleh Siska, et al. (2022) yang berjudul "Aplikasi Presensi Siswa Berbasis Web dan QR-Code pada Pembelajaran Tatap Muka di Sekolah" dipublikasikan di Jurnal Algoritma Vol. 19 No. 1 (DOI: 10.33364/algoritma/v.19-1.983). Penelitian ini menyoroti relevansi penggunaan QR Code pasca pandemi COVID-19 untuk meminimalkan kontak fisik dalam proses pencatatan kehadiran. Kontribusi utama penelitian ini adalah pengembangan antarmuka berbasis web yang dapat diakses melalui berbagai perangkat. Kelemahan penelitian ini terletak pada tidak adanya validasi lokasi fisik pengguna. Penelitian HadirMu menambahkan lapisan validasi lokasi menggunakan Haversine Formula.'));

c.push(para('c. Penelitian oleh Arizal, L., Pravitasari, N., dan Putri, R. W. (2023) yang berjudul "Perancangan Sistem Informasi Absensi Berbasis Android Menggunakan Geofence pada The Gade Coffee and Gold Kramat Raya" dipublikasikan di Jurnal Ilmiah Multidisiplin Vol. 2 No. 2. Penelitian ini berfokus pada implementasi teknologi Geofence berbasis Android untuk membatasi area kerja karyawan saat melakukan absensi. Hasil penelitian membuktikan bahwa Geofence efektif dalam memastikan kehadiran fisik pengguna di lokasi yang ditentukan. Namun, penelitian ini belum menggunakan formula geodesik yang presisi untuk perhitungan jarak. Penelitian HadirMu mengadopsi dan menyempurnakan pendekatan ini dengan menerapkan Haversine Formula untuk akurasi perhitungan yang lebih tinggi.'));

c.push(para('d. Penelitian oleh Putra, M., et al. (2023) yang berjudul "Fraud Mitigation in Attendance Monitoring Systems using Dynamic QR Code, Geofencing and IMEI Technologies" dipublikasikan di International Journal of Advanced Computer Science and Applications (IJACSA) Vol. 14 No. 4 (DOI: 10.14569/IJACSA.2023.01404104). Penelitian internasional ini secara spesifik membahas mitigasi kecurangan pada sistem monitoring kehadiran dengan menggabungkan tiga teknologi: QR Code dinamis, Geofencing, dan identifikasi IMEI perangkat. Penelitian ini menguatkan urgensi pendekatan multilayer security yang juga diterapkan pada aplikasi HadirMu, dengan perbedaan pada penggunaan HMAC SHA-256 sebagai pengganti metode enkripsi tradisional.'));

c.push(para('e. Penelitian oleh Saputra, A. R. (2023) dalam tugas akhir di Universitas Semarang berjudul "Sistem Presensi Pegawai Menggunakan QR Code dan Geolocation pada Dinas Kesehatan Kabupaten Demak". Penelitian ini mengimplementasikan kombinasi QR Code dan Geolocation untuk presensi pegawai instansi pemerintah. Kesimpulan penelitian menyatakan bahwa kombinasi kedua teknologi ini sangat krusial untuk instansi dengan mobilitas tinggi. Kelemahan utama penelitian ini adalah belum menerapkan pengamanan kriptografi pada token QR Code. Hal ini menjadi celah yang diatasi oleh penelitian HadirMu melalui implementasi HMAC SHA-256.'));

c.push(para('f. Penelitian yang dipublikasikan di Jurnal JAMIKA Vol. 14 No. 1 (2024) berjudul "Aplikasi Absensi Mahasiswa Kerja Praktik Menggunakan QR Code Berbasis Android" (DOI: 10.34010/jamika.v14i1.11775). Penelitian ini berfokus pada kemudahan dan efisiensi penggunaan platform Android untuk mobilitas tinggi dalam kegiatan kerja praktik. Hasil penelitian menunjukkan tingkat kepuasan pengguna yang tinggi terhadap antarmuka berbasis mobile. Kontribusi penelitian ini terhadap HadirMu adalah validasi bahwa platform mobile merupakan pilihan yang tepat untuk sistem absensi modern.'));

c.push(para('g. Penelitian yang dipublikasikan di TEKNIMEDIA - Teknologi Informasi dan Multimedia Vol. 5 No. 1 (2024) berjudul "Sistem Absensi Menggunakan Scan QR Code Berbasis Android". Penelitian ini menganalisis performa modul kamera scanner pada berbagai kondisi pencahayaan dan menemukan bahwa kualitas pemindaian sangat bergantung pada resolusi kamera dan intensitas cahaya. Temuan ini menjadi pertimbangan penting dalam desain antarmuka pemindaian pada aplikasi HadirMu.'));

c.push(para('h. Penelitian yang dipublikasikan di Jurnal Media Infotama Vol. 20 No. 1 (2024) berjudul "Rancang Bangun Aplikasi Absensi Siswa Berbasis Web Pada SMAN 05 Seluma Dengan Menggunakan Kode QR". Penelitian ini menitikberatkan pada manajemen data absensi yang terpusat dan terstruktur. Penerapan arsitektur web memungkinkan akses data dari berbagai perangkat. Perbedaan dengan penelitian HadirMu terletak pada pendekatan native mobile yang memberikan akses langsung ke hardware perangkat (GPS dan kamera) dengan performa yang lebih optimal.'));

c.push(para('i. Penelitian yang dipublikasikan di Jurnal Minfo Polgan Vol. 14 No. 1 (2025) berjudul "Sistem Absensi Karyawan Berbasis Web Menggunakan Metode QR Code pada Kantor Desa Cinta Raja". Penelitian terbaru ini membahas implementasi sistem mandiri dengan skalabilitas tinggi untuk instansi pemerintahan skala kecil. Kontribusinya terhadap penelitian HadirMu adalah pembuktian bahwa QR Code tetap relevan sebagai media input kehadiran pada berbagai skala organisasi.'));

c.push(para('j. Penelitian yang dipublikasikan di JUMISTIK - Jurnal Multimedia dan Teknologi Informasi Vol. 4 No. 1 (2025) berjudul "Pengembangan Sistem Absensi Mahasiswa berbasis QR-Code di Prodi Teknologi Informasi". Penelitian ini menekankan pada aspek User Experience (UX) mahasiswa dalam penggunaan QR Code untuk absensi harian. Temuan bahwa kemudahan penggunaan menjadi faktor utama adopsi sistem menjadi insight penting dalam perancangan antarmuka HadirMu.'));

c.push(para('k. Penelitian yang dipublikasikan di International Journal of Advances in Engineering and Management (IJAEM) tahun 2025 berjudul "Enhancing Attendance Accuracy with QR Code and Real-Time Location Tracking". Studi kasus internasional ini membahas peningkatan akurasi koordinat GPS menggunakan filter lokasi dan teknik averaging untuk mengurangi error. Metode filtering ini diadopsi dalam implementasi Haversine pada HadirMu untuk memastikan koordinat yang digunakan memiliki tingkat akurasi yang memadai.'));

c.push(spacer());
c.push(para('Berdasarkan analisis terhadap sebelas penelitian terdahulu tersebut, dapat disimpulkan bahwa penelitian HadirMu memiliki keunggulan kompetitif pada penerapan algoritma kriptografi HMAC SHA-256 untuk keamanan token QR Code dinamis dan Haversine Formula untuk akurasi perhitungan jarak geofencing, yang belum ditemukan secara bersamaan pada penelitian-penelitian sebelumnya.'));
c.push(spacer());

c.push(heading2('2.2 Tinjauan Pustaka'));
c.push(heading3('2.2.1 Sistem Absensi Digital'));
c.push(para('Sistem absensi digital merupakan sistem yang memanfaatkan teknologi informasi untuk mencatat, menyimpan, dan mengelola data kehadiran secara elektronik. Sistem absensi digital yang baik harus memenuhi tiga kriteria utama: akurasi data yang memastikan data tercatat mencerminkan kehadiran sesungguhnya, kemudahan penggunaan dengan antarmuka yang intuitif bagi semua tingkat pengguna, dan keamanan data berupa perlindungan terhadap manipulasi dan akses tidak sah. Evolusi sistem absensi telah berkembang dari pencatatan manual menggunakan tanda tangan, sidik jari, kartu RFID, hingga teknologi berbasis QR Code dan biometrik.'));
c.push(spacer());

c.push(heading3('2.2.2 QR Code (Quick Response Code)'));
c.push(para('QR Code adalah jenis kode matriks dua dimensi yang dapat menyimpan informasi dalam format yang dapat dibaca oleh kamera. Menurut Soon (2021) dalam penelitiannya mengenai evolusi QR Code, teknologi ini telah berkembang menjadi salah satu media encoding data yang paling banyak digunakan di dunia dengan kemampuan menyimpan hingga 7.089 karakter numerik atau 4.296 karakter alfanumerik dalam satu simbol. Dalam konteks sistem absensi, QR Code dinamis diimplementasikan dengan mengikutsertakan elemen waktu (timestamp) dan kunci rahasia (secret key) dalam payload kode. Sistem HadirMu menggunakan format payload yang di-sign menggunakan HMAC SHA-256, di mana signature diperbarui setiap 30 detik untuk mencegah penggunaan ulang kode.'));
c.push(spacer());

c.push(heading3('2.2.3 HMAC SHA-256 (Hash-based Message Authentication Code)'));
c.push(para('HMAC (Hash-based Message Authentication Code) adalah konstruksi spesifik untuk menghitung kode autentikasi pesan (Message Authentication Code/MAC) yang melibatkan fungsi hash kriptografis serta kunci rahasia. Menurut Stallings (2022) dalam bukunya Cryptography and Network Security: Principles and Practice edisi ke-8, HMAC merupakan standar industri yang paling banyak digunakan untuk validasi integritas dan keaslian data. SHA-256 (Secure Hash Algorithm 256-bit) merupakan bagian dari keluarga SHA-2 yang distandarisasi oleh National Institute of Standards and Technology dalam NIST SP 800-185 (2016) sebagai fungsi hash kriptografi yang direkomendasikan untuk aplikasi keamanan modern.'));
c.push(para('Secara matematis, HMAC didefinisikan sebagai: HMAC(K, m) = H((K\' ⊕ opad) || H((K\' ⊕ ipad) || m)), di mana H adalah fungsi hash (SHA-256), K adalah kunci rahasia, K\' adalah kunci yang telah di-padding, opad adalah outer padding (0x5c berulang), ipad adalah inner padding (0x36 berulang), m adalah pesan yang akan di-autentikasi, dan || adalah operasi concatenation. HMAC SHA-256 menghasilkan output hash sepanjang 256-bit (32 byte) yang sangat tahan terhadap serangan collision dan preimage.'));
c.push(para('Dalam sistem HadirMu, HMAC SHA-256 digunakan untuk menandatangani payload QR Code yang berisi kombinasi Session ID, Timestamp Window (Math.floor(Date.now() / 30000)), dan Secret Key. Proses validasi dilakukan dengan cara: (1) Aplikasi siswa memindai QR Code dan mengekstrak payload, (2) Sistem menghitung ulang signature HMAC menggunakan secret key yang sama, (3) Signature hasil perhitungan dibandingkan dengan signature dalam payload QR, (4) Jika cocok, token dinyatakan valid dan belum kedaluwarsa.'));
c.push(spacer());

c.push(heading3('2.2.4 Haversine Formula'));
c.push(para('Haversine Formula merupakan persamaan penting dalam bidang navigasi untuk menghitung jarak lingkaran besar (great-circle distance) antara dua titik pada permukaan bola berdasarkan koordinat lintang (latitude) dan bujur (longitude). Formula ini pertama kali dipublikasikan oleh James Inman pada tahun 1835 dalam bukunya "Navigation and Nautical Astronomy: Being a Practical Treatise on the Subject". Haversine dipilih karena akurasi yang lebih baik dibandingkan rumus Euclidean untuk perhitungan jarak pada permukaan melengkung, terutama untuk jarak pendek seperti radius kampus.'));
c.push(para('Rumus Haversine secara matematis didefinisikan sebagai berikut:'));
c.push(centeredItalic('Δlat = lat₂ - lat₁'));
c.push(centeredItalic('Δlon = lon₂ - lon₁'));
c.push(centeredItalic('a = sin²(Δlat/2) + cos(lat₁) × cos(lat₂) × sin²(Δlon/2)'));
c.push(centeredItalic('c = 2 × atan2(√a, √(1−a))'));
c.push(centeredBoldSmall('d = R × c'));
c.push(para('Di mana: φ (phi) adalah latitude dalam radian, λ (lambda) adalah longitude dalam radian, R adalah jari-jari rata-rata bumi yaitu 6.371 kilometer, dan d adalah jarak geodesik antara dua titik dalam kilometer. Nilai a merupakan setengah kuadrat panjang chord antara dua titik, sedangkan c adalah jarak sudut (angular distance) dalam radian.'));
c.push(para('Dalam implementasi pada aplikasi HadirMu, Haversine Formula diterapkan menggunakan fungsi TypeScript yang menerima empat parameter input (lat1, lon1, lat2, lon2) dan mengembalikan jarak dalam satuan meter. Koordinat referensi (titik pusat absensi) disimpan di tabel konfigurasi Supabase dan dapat diubah oleh administrator. Jika jarak hasil perhitungan Haversine melebihi radius yang ditentukan (default 50 meter), maka sistem secara otomatis menolak pengajuan absensi.'));
c.push(spacer());

c.push(heading3('2.2.5 Geofencing'));
c.push(para('Geofencing adalah teknik pemrograman berbasis lokasi yang mendefinisikan batas virtual (virtual boundary) di sekitar area geografis nyata. Ketika perangkat mobile memasuki atau meninggalkan area yang telah didefinisikan, sistem dapat memicu respons otomatis seperti notifikasi, validasi, atau pencatatan. Teknologi ini memanfaatkan kombinasi GPS (Global Positioning System), Wi-Fi, dan cell tower untuk menentukan posisi perangkat. Dalam aplikasi HadirMu, Geofencing diimplementasikan menggunakan Expo Location API yang mengakses data GPS perangkat, dengan perhitungan jarak menggunakan Haversine Formula.'));
c.push(spacer());

c.push(heading3('2.2.6 Device Binding'));
c.push(para('Device Binding atau pengikatan perangkat adalah mekanisme keamanan yang mengikat akun pengguna pada perangkat fisik tertentu menggunakan identifikasi unik perangkat. Menurut Grassi, et al. (2020) dalam panduan Digital Identity Guidelines yang diperbarui oleh NIST, penggunaan identifikasi perangkat sebagai faktor autentikasi tambahan dapat meningkatkan tingkat keamanan sistem secara signifikan. Dalam aplikasi HadirMu, Device Binding diimplementasikan menggunakan Expo SecureStore yang memanfaatkan Keychain (iOS) atau Keystore (Android) untuk menyimpan ID unik perangkat secara terenkripsi. Mekanisme ini efektif mencegah praktik titip absen karena setiap mahasiswa hanya dapat melakukan absensi dari perangkatnya sendiri.'));
c.push(spacer());

c.push(heading3('2.2.7 React Native dan Expo'));
c.push(para('React Native adalah framework open-source yang dikembangkan oleh Meta (Facebook) untuk membangun aplikasi mobile lintas platform menggunakan JavaScript dan React. Berbeda dengan aplikasi web hybrid, React Native menghasilkan komponen UI native asli sehingga memberikan performa yang mendekati aplikasi native. Expo adalah platform dan toolkit yang dibangun di atas React Native, menyediakan berbagai API siap pakai untuk mengakses fitur perangkat seperti kamera (expo-camera), GPS (expo-location), penyimpanan aman (expo-secure-store), dan notifikasi push (expo-notifications).'));
c.push(spacer());

c.push(heading3('2.2.8 Supabase'));
c.push(para('Supabase adalah platform Backend-as-a-Service (BaaS) open-source yang menyediakan database PostgreSQL, autentikasi, real-time subscriptions, penyimpanan file, dan edge functions. Supabase dirancang sebagai alternatif open-source dari Firebase dengan keunggulan menggunakan database relasional PostgreSQL. Dalam aplikasi HadirMu, Supabase digunakan sebagai backend utama untuk menyimpan data pengguna, kelas, jadwal, dan catatan absensi. Fitur real-time subscription dimanfaatkan agar dosen dapat melihat daftar hadir secara langsung saat proses scanning berlangsung tanpa perlu melakukan refresh manual.'));
c.push(spacer());

c.push(heading2('2.3 Aplikasi Pendukung'));
c.push(heading3('2.3.1 Visual Studio Code'));
c.push(para('Visual Studio Code (VS Code) adalah editor kode sumber yang dikembangkan oleh Microsoft dan bersifat open-source. VS Code digunakan sebagai lingkungan pengembangan utama dalam penelitian ini berkat dukungan ekstensi yang kaya, termasuk React Native Tools, ESLint, dan Prettier.'));
c.push(spacer());
c.push(heading3('2.3.2 Expo Go dan Expo CLI'));
c.push(para('Expo Go adalah aplikasi mobile yang memungkinkan pengembang menguji aplikasi React Native secara langsung pada perangkat fisik. Expo CLI adalah antarmuka baris perintah untuk menginisialisasi, mengelola, dan menjalankan proyek Expo karena keduanya digunakan selama proses pengembangan dan pengujian HadirMu.'));
c.push(spacer());
c.push(heading3('2.3.3 Supabase Dashboard'));
c.push(para('Supabase menyediakan dasbor web yang komprehensif untuk mengelola database, memonitor penggunaan API, mengonfigurasi aturan keamanan (Row Level Security), dan mengelola penyimpanan file. Dasbor ini digunakan untuk administrasi database HadirMu selama proses pengembangan.'));
c.push(spacer());

c.push(heading2('2.4 Kerangka Pemikiran'));
c.push(para('Kerangka pemikiran dalam penelitian ini menggambarkan alur logis dari identifikasi masalah hingga solusi yang dihasilkan berupa aplikasi HadirMu. Penelitian ini diawali dari identifikasi masalah utama: sistem absensi berbasis QR Code statis yang rentan terhadap kecurangan dan tidak memiliki validasi lokasi. Untuk mengatasi masalah keaslian token, diterapkan algoritma HMAC SHA-256 yang menghasilkan signature unik pada setiap QR Code dinamis. Untuk mengatasi masalah validasi lokasi, diterapkan Haversine Formula yang menghitung jarak geodesik antara perangkat pengguna dan titik absensi.'));
c.push(para('Kedua algoritma ini diintegrasikan ke dalam alur proses absensi yang berjalan di atas aplikasi mobile React Native (Expo) dengan backend Supabase. Proses validasi berjalan secara berlapis: pertama, sistem memverifikasi Device ID pengguna (Device Binding); kedua, sistem memvalidasi signature HMAC SHA-256 pada token QR Code; ketiga, sistem menghitung jarak Haversine antara koordinat pengguna dan titik referensi. Hanya jika ketiga validasi berhasil, absensi dicatat ke dalam database dan notifikasi dikirimkan.'));
c.push(pageBreak());

// BAB III
c.push(heading1('BAB III'));
c.push(heading1('ANALISA DAN PERANCANGAN'));
c.push(spacer());

c.push(heading2('3.1 Analisa Sistem'));
c.push(heading3('3.1.1 Analisa Kebutuhan Fungsional'));
c.push(para('Sistem HadirMu harus mampu menjalankan fungsi-fungsi berikut berdasarkan masing-masing peran pengguna:'));
c.push(listItem('Administrator: Mengelola data guru, siswa, dan kelas; mengatur jadwal pelajaran dan koordinat geofencing; memantau statistik absensi keseluruhan; serta mengakses laporan dan ekspor data.', 1));
c.push(listItem('Guru: Memilih kelas dan mata pelajaran untuk sesi absensi; menampilkan QR Code dinamis yang ditandatangani HMAC SHA-256 dan diperbarui otomatis setiap 30 detik; memantau daftar kehadiran siswa secara real-time; dan mengekspor laporan absensi.', 2));
c.push(listItem('Siswa: Melakukan verifikasi akun; memindai QR Code yang ditampilkan guru menggunakan kamera perangkat; sistem secara otomatis memvalidasi signature HMAC dan jarak Haversine; menerima konfirmasi kehadiran; serta melihat riwayat kehadiran pribadi.', 3));
c.push(spacer());

c.push(heading3('3.1.2 Analisa Kebutuhan Non-Fungsional'));
c.push(listItem('Keamanan: Sistem harus menerapkan HMAC SHA-256 untuk integritas token, Haversine Formula untuk validasi lokasi, dan Device Binding untuk autentikasi perangkat.', 1));
c.push(listItem('Performa: Proses validasi HMAC dan perhitungan Haversine harus selesai dalam waktu kurang dari 1 detik.', 2));
c.push(listItem('Akurasi: Perhitungan jarak Haversine harus memiliki tingkat akurasi minimal 95% pada radius 50 meter.', 3));
c.push(listItem('Usabilitas: Antarmuka pengguna harus intuitif dan dapat digunakan tanpa pelatihan khusus.', 4));
c.push(listItem('Kompatibilitas: Aplikasi berjalan pada perangkat Android versi 8.0 ke atas dan iOS versi 13 ke atas.', 5));
c.push(spacer());

c.push(heading2('3.2 Metode Usulan'));
c.push(para('Metode yang diusulkan dalam penelitian ini mengintegrasikan dua algoritma utama ke dalam satu alur proses absensi yang koheren. Algoritma HMAC SHA-256 diterapkan pada sisi pembuatan dan validasi token QR Code (security layer), sedangkan Haversine Formula diterapkan pada sisi validasi lokasi (location layer). Kedua layer ini bekerja secara sekuensial: validasi token wajib berhasil terlebih dahulu sebelum validasi lokasi dilakukan.'));
c.push(para('Alur proses absensi berjalan sebagai berikut: (1) Guru membuka sesi absensi, sistem menghasilkan QR Code dinamis dengan payload yang ditandatangani HMAC SHA-256, (2) Siswa memindai QR Code menggunakan kamera perangkat, (3) Sistem memverifikasi Device ID siswa, (4) Sistem mengekstrak dan memvalidasi signature HMAC dari payload QR Code, (5) Jika signature valid, sistem mengambil koordinat GPS perangkat siswa, (6) Sistem menghitung jarak geodesik menggunakan Haversine Formula antara koordinat siswa dan koordinat referensi, (7) Jika jarak dalam radius yang ditentukan, absensi dicatat ke database Supabase, (8) Status kehadiran diperbarui secara real-time pada dasbor guru.'));
c.push(spacer());

c.push(heading2('3.3 Perancangan Sistem'));
c.push(heading3('3.3.1 Arsitektur Sistem'));
c.push(para('Sistem HadirMu dirancang menggunakan arsitektur tiga lapisan (three-tier architecture) yang terdiri dari:'));
c.push(listItem('Lapisan Presentasi: Aplikasi mobile React Native (Expo) yang berjalan pada perangkat Android dan iOS. Lapisan ini menangani semua interaksi pengguna, pemindaian QR Code, dan akses GPS.', 1));
c.push(listItem('Lapisan Logika Aplikasi: Logika bisnis yang mencakup modul HMAC SHA-256 (pembangkitan dan validasi signature), modul Haversine (perhitungan jarak geodesik), modul Device Binding (verifikasi identitas perangkat), dan komunikasi dengan API Supabase.', 2));
c.push(listItem('Lapisan Data: Database PostgreSQL yang dikelola oleh Supabase, menyimpan seluruh data pengguna, konfigurasi lokasi, dan catatan absensi dengan dukungan real-time subscription.', 3));
c.push(spacer());

c.push(heading3('3.3.2 Perancangan Basis Data'));
c.push(para('Skema basis data sistem HadirMu terdiri dari tabel-tabel utama sebagai berikut:'));
c.push(listItem('Tabel teachers: Menyimpan data guru dan administrator. Kolom utama meliputi id (UUID), full_name, email, nip, password (hashed), role (admin/guru), avatar_url, dan expo_push_token.', 1));
c.push(listItem('Tabel students: Menyimpan data siswa. Kolom utama meliputi id (UUID), full_name, nis, class_id (FK ke tabel classes), password (hashed), device_id (untuk Device Binding), telegram_chat_id, dan verification_token.', 2));
c.push(listItem('Tabel classes: Menyimpan data kelas dengan kolom id, name, dan level.', 3));
c.push(listItem('Tabel subjects: Menyimpan data mata pelajaran dengan kolom id dan name.', 4));
c.push(listItem('Tabel schedules: Menyimpan jadwal mengajar dengan kolom id, teacher_id (FK), class_name, subject, day_of_week, start_time, dan end_time.', 5));
c.push(listItem('Tabel attendance: Menyimpan catatan kehadiran dengan kolom id, student_id (FK), session_name (berisi informasi sesi dari payload QR), status_type (hadir/izin/sakit/alpha), timestamp, dan hmac_signature (signature yang divalidasi).', 6));
c.push(listItem('Tabel app_config: Menyimpan konfigurasi sistem termasuk koordinat geofencing (geo_latitude, geo_longitude) dan radius (geo_radius) dengan kolom id, key, dan value.', 7));
c.push(spacer());

c.push(heading3('3.3.3 Alur Proses Validasi HMAC SHA-256'));
c.push(para('Proses validasi HMAC SHA-256 pada QR Code dinamis berjalan melalui tahapan berikut:'));
c.push(listItem('Guru memulai sesi absensi. Sistem mengambil secret key dari environment variable dan menghitung timestamp window saat ini (tw = Math.floor(Date.now() / 30000)).', 1));
c.push(listItem('Payload QR Code disusun dengan format: {sessionId}_{tw}_{sessionName}. Payload ini kemudian di-hash menggunakan HMAC SHA-256 dengan secret key untuk menghasilkan signature.', 2));
c.push(listItem('QR Code ditampilkan dengan data: {payload}_{signature}. Timer countdown 30 detik berjalan, dan QR Code diperbarui secara otomatis saat timer habis.', 3));
c.push(listItem('Siswa memindai QR Code. Aplikasi mengekstrak payload dan signature dari data QR.', 4));
c.push(listItem('Aplikasi menghitung ulang HMAC SHA-256 dari payload menggunakan secret key yang sama. Hasil perhitungan dibandingkan dengan signature dalam QR Code.', 5));
c.push(listItem('Jika signature cocok dan timestamp window masih dalam toleransi (±1 window), token dinyatakan valid. Jika tidak, absensi ditolak.', 6));
c.push(spacer());

c.push(heading3('3.3.4 Alur Proses Validasi Haversine'));
c.push(para('Proses validasi lokasi menggunakan Haversine Formula berjalan melalui tahapan berikut:'));
c.push(listItem('Setelah token HMAC dinyatakan valid, sistem meminta izin akses GPS dari perangkat siswa menggunakan expo-location.', 1));
c.push(listItem('Koordinat GPS siswa (lat1, lon1) diperoleh dengan akurasi tinggi (high accuracy mode). Koordinat referensi (lat2, lon2) diambil dari tabel app_config di Supabase.', 2));
c.push(listItem('Kedua koordinat dikonversi dari derajat ke radian: rad = derajat × (π / 180).', 3));
c.push(listItem('Selisih latitude (Δlat) dan longitude (Δlon) dihitung.', 4));
c.push(listItem('Nilai a dihitung menggunakan rumus: a = sin²(Δlat/2) + cos(lat1) × cos(lat2) × sin²(Δlon/2).', 5));
c.push(listItem('Nilai c (angular distance) dihitung: c = 2 × atan2(√a, √(1-a)).', 6));
c.push(listItem('Jarak geodesik d dihitung: d = R × c, di mana R = 6.371 km. Hasil dikonversi ke meter (d × 1000).', 7));
c.push(listItem('Jika d ≤ radius yang dikonfigurasi (default 50 meter), validasi berhasil. Jika d > radius, absensi ditolak dengan pesan "Anda berada di luar jangkauan area absensi".', 8));

// Flowchart
try {
  const { ImageRun } = require('docx');
  const imgData = fs.readFileSync('d:/dika/tugas/AbsensiDigital/flowchart_haversine.png');
  c.push(spacer());
  c.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    children: [new ImageRun({ data: imgData, transformation: { width: 450, height: 500 }, type: 'png' })],
  }));
  c.push(centeredBoldSmall('Gambar 3.1 Flowchart Validasi Geofencing Haversine'));
} catch (e) {
  c.push(para('[Gambar Flowchart Haversine - sisipkan manual]'));
}
c.push(spacer());

c.push(heading3('3.3.5 Rancangan Antarmuka'));
c.push(para('Antarmuka aplikasi HadirMu dirancang dengan prinsip Material Design untuk tiga peran pengguna:'));
c.push(listItem('Halaman Login: Formulir NIS (siswa) atau email (guru/admin) dan password, dengan validasi dan pesan error informatif.', 1));
c.push(listItem('Dasbor Siswa: Status verifikasi, kamera pemindaian QR Code, status kehadiran hari ini, dan indikator GPS.', 2));
c.push(listItem('Dasbor Guru: Pilihan kelas/mata pelajaran, QR Code dinamis dengan timer countdown 30 detik, tabel rekap kehadiran real-time, dan tombol ekspor.', 3));
c.push(listItem('Dasbor Administrator: Statistik sistem, launchpad modul manajemen, dan konfigurasi koordinat geofencing.', 4));
c.push(spacer());

c.push(heading2('3.4 Perancangan Fitur Keamanan'));
c.push(heading3('3.4.1 Mekanisme QR Code Dinamis + HMAC SHA-256'));
c.push(para('QR Code dinamis diimplementasikan dengan payload yang ditandatangani menggunakan HMAC SHA-256. Secret key disimpan sebagai environment variable dan tidak pernah dikirimkan melalui jaringan. Timestamp window dihitung menggunakan formula Math.floor(Date.now() / (30 * 1000)) yang menghasilkan nilai integer berbeda setiap 30 detik. Validasi dilakukan dengan toleransi satu window (±30 detik) untuk mengakomodasi perbedaan waktu antar perangkat. Dengan mekanisme ini, setiap QR Code yang dihasilkan unik, memiliki masa berlaku singkat, dan tidak dapat direproduksi tanpa mengetahui secret key.'));
c.push(spacer());

c.push(heading3('3.4.2 Mekanisme Geofencing + Haversine Formula'));
c.push(para('Validasi lokasi menggunakan Haversine Formula untuk menghitung jarak geodesik antara koordinat GPS pengguna dan koordinat referensi. Koordinat referensi dan radius geofencing dikonfigurasi oleh administrator melalui tabel app_config pada Supabase. Pengecekan lokasi dilakukan secara sinkron pada saat pemindaian QR Code, sebelum data absensi disimpan ke database. Jika GPS tidak tersedia atau akurasi tidak memadai (> 20 meter), sistem meminta pengguna mengaktifkan GPS dan menunggu sinyal stabil sebelum melanjutkan proses validasi.'));
c.push(spacer());

c.push(heading3('3.4.3 Mekanisme Device Binding'));
c.push(para('Device ID dihasilkan sekali pada saat instalasi menggunakan kombinasi UUID acak dan timestamp, kemudian disimpan secara permanen menggunakan Expo SecureStore. Saat siswa pertama kali login, Device ID disimpan ke kolom device_id pada tabel students. Setiap percobaan absensi berikutnya membandingkan Device ID aktif dengan yang tersimpan di database. Jika tidak cocok, sistem menolak absensi dan menampilkan pesan kesalahan yang meminta siswa menghubungi administrator untuk reset perangkat.'));
c.push(pageBreak());

// DAFTAR PUSTAKA
c.push(heading1('DAFTAR PUSTAKA'));
c.push(spacer());
c.push(paraNoIndent('Arizal, L., Pravitasari, N., & Putri, R. W. (2023). Perancangan Sistem Informasi Absensi Berbasis Android Menggunakan Geofence Pada The Gade Coffee and Gold Kramat Raya. Jurnal Ilmiah Multidisiplin, 2(2).'));
c.push(spacer());
c.push(paraNoIndent('Expo Documentation. (2024). Expo SDK 54 API Reference. Diakses dari https://docs.expo.dev/'));
c.push(spacer());
c.push(paraNoIndent('IJAEM. (2025). Enhancing Attendance Accuracy with QR Code and Real-Time Location Tracking. International Journal of Advances in Engineering and Management.'));
c.push(spacer());
c.push(paraNoIndent('Soon, T. J. (2021). QR Code: Evolution, Current Applications, and Future Prospects. International Journal of Digital Technology and Economy, 6(1), 1-12.'));
c.push(spacer());
c.push(paraNoIndent('JAMIKA. (2024). Aplikasi Absensi Mahasiswa Kerja Praktik Menggunakan QR Code Berbasis Android. Jurnal Manajemen Informatika, 14(1). doi:10.34010/jamika.v14i1.11775'));
c.push(spacer());
c.push(paraNoIndent('JUMISTIK. (2025). Pengembangan Sistem Absensi Mahasiswa berbasis QR-Code di Prodi Teknologi Informasi. Jurnal Multimedia dan Teknologi Informasi, 4(1).'));
c.push(spacer());
c.push(paraNoIndent('Stallings, W. (2022). Cryptography and Network Security: Principles and Practice (8th ed.). Pearson Education.'));
c.push(spacer());
c.push(paraNoIndent('Kurniadi, D., Septiana, Y., & Hanifah, M. A. Y. (2022). Pengembangan Aplikasi Presensi Karyawan Menggunakan Quick Response Code Berbasis Web dan Android. Jurnal Algoritma, 19(1). doi:10.33364/algoritma/v.19-1.1062'));
c.push(spacer());
c.push(paraNoIndent('Media Infotama. (2024). Rancang Bangun Aplikasi Absensi Siswa Berbasis Web Pada SMAN 05 Seluma Dengan Menggunakan Kode QR. Jurnal Media Infotama, 20(1).'));
c.push(spacer());
c.push(paraNoIndent('Minfo Polgan. (2025). Sistem Absensi Karyawan Berbasis Web Menggunakan Metode QR Code pada Kantor Desa Cinta Raja. Jurnal Minfo Polgan, 14(1).'));
c.push(spacer());
c.push(paraNoIndent('NIST. (2016). NIST Special Publication 800-185: SHA-3 Derived Functions. National Institute of Standards and Technology.'));
c.push(spacer());
c.push(paraNoIndent('Grassi, P. A., et al. (2020). NIST Special Publication 800-63B: Digital Identity Guidelines - Authentication and Lifecycle Management (Updated). National Institute of Standards and Technology.'));
c.push(spacer());
c.push(paraNoIndent('Putra, M., et al. (2023). Fraud Mitigation in Attendance Monitoring Systems using Dynamic QR Code, Geofencing and IMEI Technologies. IJACSA, 14(4). doi:10.14569/IJACSA.2023.01404104'));
c.push(spacer());
c.push(paraNoIndent('React Native Documentation. (2024). React Native 0.81 Release Notes. Diakses dari https://reactnative.dev/'));
c.push(spacer());
c.push(paraNoIndent('Saputra, A. R. (2023). Sistem Presensi Pegawai Menggunakan QR Code dan Geolocation pada Dinas Kesehatan Kabupaten Demak. [Tugas Akhir]. Universitas Semarang.'));
c.push(spacer());
c.push(paraNoIndent('Siska, et al. (2022). Aplikasi Presensi Siswa Berbasis Web dan Qr-Code pada Pembelajaran Tatap Muka di Sekolah. Jurnal Algoritma, 19(1). doi:10.33364/algoritma/v.19-1.983'));
c.push(spacer());
c.push(paraNoIndent('Supabase Documentation. (2024). Supabase Docs: Database, Auth, Storage, Edge Functions. Diakses dari https://supabase.com/docs/'));
c.push(spacer());
c.push(paraNoIndent('TEKNIMEDIA. (2024). Sistem Absensi Menggunakan Scan QR Code Berbasis Android. TEKNIMEDIA, 5(1).'));

module.exports = c;
