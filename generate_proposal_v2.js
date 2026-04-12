const { Document, Packer, Paragraph, TextRun, AlignmentType, HeadingLevel, ImageRun, PageBreak, Table, TableRow, TableCell, BorderStyle, WidthType } = require('docx');
const fs = require('fs');

const doc = new Document({
    styles: {
        default: {
            document: {
                run: { font: "Arial", size: 24, color: "000000" },
                paragraph: { spacing: { line: 360 } } // 1.5 Lini Spacing
            }
        },
        paragraphStyles: [
            {
                id: "Heading1",
                name: "Heading 1",
                run: { size: 28, bold: true },
                paragraph: { alignment: AlignmentType.CENTER, spacing: { before: 480, after: 240 } }
            },
            {
                id: "Heading2",
                name: "Heading 2",
                run: { size: 24, bold: true },
                paragraph: { spacing: { before: 240, after: 120 } }
            }
        ]
    },
    sections: [{
        properties: {
            page: { margin: { top: 1700, right: 1700, bottom: 1700, left: 2267 } }
        },
        children: [
            // COVER
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROPOSAL SKRIPSI", bold: true, size: 32 })] }),
            new Paragraph({ spacing: { before: 800 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PENERAPAN HMAC SHA-256 DAN HAVERSINE FORMULA UNTUK VALIDASI IDENTITAS PENGGUNA PADA APLIKASI MOBILE BERBASIS QR CODE DINAMIS", bold: true, size: 28 })] }),
            new Paragraph({ spacing: { before: 2000 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "OLEH:", bold: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "ANDIKA ARYA", bold: true, size: 28 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "(isi NIM kamu di sini)", bold: true, size: 28 })] }),
            new Paragraph({ spacing: { before: 2500 } }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "PROGRAM STUDI TEKNIK INFORMATIKA", bold: true, size: 24 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "FAKULTAS ILMU KOMPUTER", bold: true, size: 24 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "UNIVERSITAS PAMULANG", bold: true, size: 24 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TANGERANG SELATAN", bold: true, size: 24 })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "2025", bold: true, size: 24 })] }),
            new Paragraph({ children: [new PageBreak()] }),

            // KATA PENGANTAR
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "KATA PENGANTAR", bold: true, size: 28 })] }),
            new Paragraph({ spacing: { before: 240 } }),
            new Paragraph({
                children: [
                    new TextRun("Puji syukur penulis panjatkan ke hadirat Allah SWT atas segala rahmat dan hidayah-Nya, sehingga penulis dapat menyelesaikan penulisan proposal skripsi ini dengan judul 'PENERAPAN HMAC SHA-256 DAN HAVERSINE FORMULA UNTUK VALIDASI IDENTITAS PENGGUNA PADA APLIKASI MOBILE BERBASIS QR CODE DINAMIS'. Proposal ini disusun sebagai salah satu syarat untuk menempuh tahap skripsi di Program Studi Teknik Informatika Universitas Pamulang."),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun("Penulisan ini tidak lepas dari dukungan berbagai pihak. Penulis ingin menyampaikan terima kasih kepada rektor, dekan, ketua program studi, serta dosen pembimbing yang telah memberikan arahan. Semoga proposal ini dapat memberikan kontribusi nyata bagi perkembangan sistem informasi di dunia pendidikan."),
                ]
            }),
            new Paragraph({ children: [new PageBreak()] }),

            // BAB I
            new Paragraph({ text: "BAB I", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "PENDAHULUAN", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "1.1 Latar Belakang", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({
                children: [
                    new TextRun("Pencatatan kehadiran atau absensi merupakan elemen krusial dalam lingkungan akademik maupun profesional. Pada era revolusi industri 4.0, sistem absensi manual mulai digantikan oleh solusi digital untuk meningkatkan efisiensi dan akurasi data. Namun, implementasi teknologi digital saat ini, seperti penggunaan QR Code statis, seringkali masih dihantui oleh berbagai celah keamanan. Fenomena 'titip absen' dengan cara mengirimkan tangkapan layar (screenshot) kode QR kepada rekan yang tidak hadir menjadi praktik yang merugikan integritas institusi."),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun("Masalah keamanan lainnya adalah manipulasi lokasi. Sebagian besar aplikasi absensi berbasis web atau mobile sederhana tidak memiliki mekanisme validasi yang ketat terhadap posisi geografis pengguna. Oleh karena itu, diperlukan integrasi antara sistem keamanan data dan validasi fisik lokasi secara realtime. Dalam penelitian ini, penulis mengusulkan penggunaan algoritma "),
                    new TextRun({ text: "Hash-based Message Authentication Code (HMAC) menggunakan SHA-256", bold: true }),
                    new TextRun(" untuk mengamankan identitas pengguna dalam QR Code dinamis yang berubah setiap interval waktu tertentu. HMAC SHA-256 dipilih karena kemampuannya menjamin data integrity dan authenticity melalui penggunaan kunci rahasia (secret key)."),
                ]
            }),
            new Paragraph({
                children: [
                    new TextRun("Selain pengamanan token, validasi kehadiran fisik mahasiswa dipastikan melalui teknologi geofencing. Untuk mendapatkan tingkat akurasi yang tinggi dalam lingkungan kampus yang terbatas, perhitungan jarak antara koordinat perangkat mahasiswa dan titik absensi dilakukan menggunakan "),
                    new TextRun({ text: "Haversine Formula", bold: true }),
                    new TextRun(". Formula ini mempertimbangkan kelengkungan permukaan bumi, sehingga memberikan hasil perhitungan jarak yang lebih presisi untuk navigasi jarak pendek dibandingkan metode Euclidean. Aplikasi 'HadirMu' akan dibangun menggunakan framework React Native untuk platform Android dan iOS, dengan dukungan Supabase sebagai infrastruktur cloud database yang mendukung sinkronisasi data secara realtime."),
                ]
            }),

            new Paragraph({ text: "1.2 Identifikasi Masalah", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Berdasarkan latar belakang di atas, dapat diidentifikasi beberapa permasalahan sebagai berikut:" }),
            new Paragraph({ text: "1. Tingginya angka kecurangan absensi akibat penggunaan QR Code statis yang mudah dibagikan (social engineering)." }),
            new Paragraph({ text: "2. Lemahnya validasi lokasi pada sistem absensi digital saat ini yang memungkinkan manipulasi koordinat GPS." }),
            new Paragraph({ text: "3. Belum adanya standarisasi algoritma pengamanan data identitas pada aplikasi mobiltiy tinggi dalam lingkup institusi pendidikan." }),

            new Paragraph({ text: "1.3 Rumusan Masalah", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Bagaimana merancang mekanisme QR Code Dinamis menggunakan algoritma HMAC SHA-256 untuk mencegah duplikasi token absensi?" }),
            new Paragraph({ text: "2. Bagaimana mengimplementasikan Haversine Formula untuk menentukan radius geofencing yang akurat pada aplikasi mobile?" }),
            new Paragraph({ text: "3. Bagaimana mengintegrasikan aplikasi mobile berbasis React Native dengan database realtime Supabase untuk mendukung validasi identitas dan lokasi secara simultan?" }),

            new Paragraph({ text: "1.4 Batasan Masalah", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Aplikasi dikembangkan untuk platform mobile (Android dan iOS) menggunakan React Native dan Expo SDK." }),
            new Paragraph({ text: "2. Algoritma keamanan terbatas pada penggunaan HMAC SHA-256 untuk signing token absensi." }),
            new Paragraph({ text: "3. Validasi lokasi dilakukan dengan radius maksimal 50 meter dari titik pusat absensi (koordinat kelas)." }),
            new Paragraph({ text: "4. Pengelolaan data mahasiswa dan dosen menggunakan database PostgreSQL pada layanan cloud Supabase." }),

            new Paragraph({ text: "1.5 Tujuan Penelitian", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "1. Mengembangkan sistem absensi berbasis mobile dengan tingkat keamanan tinggi melalui signature HMAC SHA-256." }),
            new Paragraph({ text: "2. Menerapkan perhitungan jarak presisi menggunakan Haversine Formula untuk sistem geofencing." }),
            new Paragraph({ text: "3. Menghasilkan laporan kehadiran yang akurat dan antititip absen bagi dosen maupun administrator kampus." }),

            new Paragraph({ text: "1.7 Metodologi Penelitian (Agile Scrum)", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Pengembangan sistem 'HadirMu' menggunakan metode Agile Scrum yang terdiri dari tahapan-tahapan berikut:" }),
            new Paragraph({ text: "1. Product Backlog: Mengidentifikasi seluruh kebutuhan fungsional (scan QR, GPS, laporan) dan non-fungsional (security)." }),
            new Paragraph({ text: "2. Sprint Planning: Merencanakan pembagian kerja dalam siklus pendek (2 minggu per sprint)." }),
            new Paragraph({ text: "3. Sprints: Proses koding dan desain antarmuka aplikasi. Fokus utama pada implementasi library HMAC dan lokasi." }),
            new Paragraph({ text: "4. Sprint Review & Retrospective: Melakukan evaluasi berkala terhadap progres fitur yang telah selesai dideploy ke pengujian internal." }),
            new Paragraph({ children: [new PageBreak()] }),

            // BAB II
            new Paragraph({ text: "BAB II", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "LANDASAN TEORI", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "2.1 Penelitian Terdahulu", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Berikut adalah 11 penelitian terkait yang mendasari dan membuktikan orisinalitas penelitian ini:" }),
            
            new Paragraph({
              children: [
                new TextRun({ text: "1. Kurniadi, et al. (2022)", bold: true }),
                new TextRun(" meneliti tentang pengembangan aplikasi presensi karyawan berbasis QR Code di Jurnal Algoritma. Penelitian ini menunjukkan bahwa QR Code mampu mempercepat proses input data hingga 70% dibandingkan manual. Relevansinya adalah penggunaan QR sebagai media input utama, namun penelitian ini belum menyentuh aspek security HMAC yang penulis usulkan."),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "2. Arizal, et al. (2023)", bold: true }),
                new TextRun(" dalam Jurnal Ilmiah Multidisiplin berfokus pada implementasi Geofence berbasis Android. Hasil penelitian membuktikan bahwa Geofence efektif membatasi area kerja karyawan. Penelitian penulis akan mengembangkan metode ini dengan penajaman rumus Haversine untuk akurasi radius."),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "3. Putra, et al. (2023)", bold: true }),
                new TextRun(" mempublikasikan riset internasional di IJACSA mengenai mitigasi fraud menggunakan Dinamis QR dan IMEI. Penelitian ini menguatkan urgensi Device Binding yang penulis terapkan pada aplikasi HadirMu."),
              ]
            }),
            new Paragraph({
              children: [
                new TextRun({ text: "4. Apriyanto (2023)", bold: true }),
                new TextRun(" dari Univ. Semarang mengimplementasikan QR dan Geolocation pada Dinas Kesehatan. Kesimpulannya, kombinasi kedua teknologi ini sangat krusial dalam instansi dengan mobilitas tinggi."),
              ]
            }),
            new Paragraph({ text: "5. Penelitian lainnya mencakup Jurnal JAMIKA (2024), TEKNIMEDIA (2024), Media Infotama (2024), Minfo Polgan (2025), JUMISTIK (2025), IJAEM (2025), dan Siska et al. (2022) yang secara konsisten membahas tentang evolusi scanner QR dan efektivitas transmisi data pada platform mobile terbaru." }),
            
            new Paragraph({ text: "2.2 Tinjauan Pustaka", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "2.2.1 HMAC SHA-256", bold: true }),
            new Paragraph({ text: "Hash-based Message Authentication Code (HMAC) adalah konstruksi spesifik untuk menghitung kode otentikasi pesan (MAC) yang melibatkan fungsi hash kriptografis serta kunci rahasia. SHA-256 menghasilkan output hash sepanjang 256-bit (32 byte) yang sangat tahan terhadap tabrakan (collission). Dalam sistem ini, token QR mengandung: (UserID + Timestamp + SecretKey) yang di-hash menjadi signature. Server akan men-dekripsi atau mem-validasi signature tersebut untuk memastikan keaslian data." }),

            new Paragraph({ text: "2.2.2 Haversine Formula", bold: true }),
            new Paragraph({
                children: [
                    new TextRun("Digunakan untuk menghitung jarak antara dua koordinat bola. Dalam kodingan JavaScript, rumusnya adalah:"),
                ]
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "dlon = lon2 - lon1, dlat = lat2 - lat1", italic: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "a = (sin(dlat/2))^2 + cos(lat1) * cos(lat2) * (sin(dlon/2))^2", italic: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "c = 2 * atan2(sqrt(a), sqrt(1-a))", italic: true })] }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "d = 6371 * c (Hasil dalam Kilometer)", italic: true, bold: true })] }),
            
            new Paragraph({ text: "2.2.3 React Native & Supabase", bold: true }),
            new Paragraph({ text: "React Native memungkinkan pembuatan UI yang responsif dan native, sementara Supabase (Firebase Alternative) menyediakan Realtime Postgres yang memungkinkan dosen melihat daftar hadir detik demi detik saat proses scanning berlangsung." }),
            new Paragraph({ children: [new PageBreak()] }),

            // BAB III
            new Paragraph({ text: "BAB III", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "ANALISA DAN PERANCANGAN", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ text: "3.1 Flowchart Geofencing", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Alur sistem dimulai saat mahasiswa berada di depan layar dosen. GPS akan aktif dan mengambil koordinat latitude/longitude secara realtime, kemudian diproses melalui filter Haversine." }),
            
            new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                    new ImageRun({
                        data: fs.readFileSync("d:/dika/tugas/AbsensiDigital/flowchart_haversine.png"),
                        transformation: { width: 450, height: 500 },
                        type: "png",
                    }),
                ],
            }),
            new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Gambar 3.1 Flowchart Validasi Geofencing HadirMu", bold: true })] }),

            new Paragraph({ text: "3.2 Rancangan Basis Data", heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: "Pada Supabase, tabel utama dirancang sebagai berikut:" }),
            new Paragraph({ text: "1. students: Menyimpan identitas tunggal dan DeviceID/BindingKey." }),
            new Paragraph({ text: "2. locations: Koordinat titik kelas dosen (Lat_target, Lon_target)." }),
            new Paragraph({ text: "3. attendance_logs: Hasil perhitungan d <= radius, status (hadir/telat), dan signature validasi." }),
            new Paragraph({ children: [new PageBreak()] }),

            // DAFTAR PUSTAKA
            new Paragraph({ text: "DAFTAR PUSTAKA", heading: HeadingLevel.HEADING_1 }),
            new Paragraph({ spacing: { before: 240 } }),
            new Paragraph({ text: "Arizal, L., Pravitasari, N., & Putri, R. W. (2023). Perancangan Sistem Informasi Absensi Berbasis Android Menggunakan Geofence Pada The Gade Coffee and Gold Kramat Raya. Jurnal Ilmiah Multidisiplin, 2(2)." }),
            new Paragraph({ text: "Kurniadi, D., Septiana, Y., & Hanifah, M. A. Y. (2022). Pengembangan Aplikasi Presensi Karyawan Menggunakan Quick Response Code Berbasis Web dan Android. Jurnal Algoritma, 19(1). doi:10.33364/algoritma/v.19-1.1062" }),
            new Paragraph({ text: "Putra, M., et al. (2023). Fraud Mitigation in Attendance Monitoring Systems using Dynamic QR Code, Geofencing and IMEI Technologies. International Journal of Advanced Computer Science and Applications (IJACSA), 14(4). doi:10.14569/IJACSA.2023.01404104" }),
            new Paragraph({ text: "Saputra, A. R. (2023). Sistem Presensi Pegawai Menggunakan QR Code dan Geolocation pada Dinas Kesehatan Kabupaten Demak. [Tugas Akhir]. Universitas Semarang." }),
            new Paragraph({ text: "JAMIKA. (2024). Aplikasi Absensi Mahasiswa Kerja Praktik Menggunakan QR Code Berbasis Android. Jurnal Manajemen Informatika, 14(1). doi:10.34010/jamika.v14i1.11775" }),
            new Paragraph({ text: "IJAEM. (2025). Enhancing Attendance Accuracy with QR Code and Real-Time Location Tracking. International Journal of Advances in Engineering and Management." }),
            new Paragraph({ text: "JUMISTIK. (2025). Pengembangan Sistem Absensi Mahasiswa berbasis QR-Code di Prodi Teknologi Informasi. Jurnal Multimedia dan Teknologi Informasi, 4(1)." }),
            new Paragraph({ text: "Minfo Polgan. (2025). Sistem Absensi Karyawan Berbasis Web Menggunakan Metode QR Code pada Kantor Desa Cinta Raja. Jurnal Minfo Polgan, 14(1)." }),
            new Paragraph({ text: "TEKNIMEDIA. (2024). SISTEM ABSENSI MENGGUNAKAN SCAN QR CODE BERBASIS ANDROID. TEKNIMEDIA - Teknologi Informasi dan Multimedia, 5(1)." }),
            new Paragraph({ text: "Media Infotama. (2024). Rancang Bangun Aplikasi Absensi Siswa Berbasis Web Pada SMAN 05 Seluma Dengan Menggunakan Kode QR. Jurnal Media Infotama, 20(1)." }),
            new Paragraph({ text: "Siska, et al. (2022). Aplikasi Presensi Siswa Berbasis Web dan Qr-Code pada Pembelajaran Tatap Muka di Sekolah. Jurnal Algoritma, 19(1)." })
        ]
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("d:/dika/tugas/AbsensiDigital/Proposal_Skripsi_Andika_Arya_Final_Ready.docx", buffer);
    console.log("Proposal SIAP AJUAN generated successfully!");
});
