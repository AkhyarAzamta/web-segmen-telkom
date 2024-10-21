let map;
let markers = [];  // Array untuk menyimpan marker
let routeMarkers = []; // Array untuk menyimpan marker rute awal dan akhir
let waypointPolylines = []; // Array untuk menyimpan polyline waypoint
let clickedCoords = []; // Array untuk menyimpan koordinat hasil klik
let initialCoordinates = [-6.914744, 107.609810]; // Koordinat awal default

// Definisikan custom icon
var yellowIcon = L.icon({
    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/yellow.png',
    iconSize: [40, 40],  // Ukuran icon
});

// Definisikan icon default
var defaultIcon = L.icon({
    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/red.png', // Ganti dengan icon default yang diinginkan
    iconSize: [40, 40],  // Ukuran icon
});

document.addEventListener('DOMContentLoaded', () => {
    // Inisialisasi peta
    initializeMap();

    // Muat waypoint dan rute dari localStorage
    loadWaypoints();
    loadRoute();

    // Event listener untuk menambahkan titik awal dan akhir
    document.getElementById('addKoordinat').addEventListener('click', () => {
        const latLngInput = prompt("Masukkan koordinat dalam format (-6.656108,106.847114)(-6.777657,106.787172)");

        // Ekstrak koordinat dari input
        const regex = /\(([^)]+)\)/g; // Regex untuk menangkap isi dalam kurung
        const matches = [];
        let match;
        while ((match = regex.exec(latLngInput)) !== null) {
            matches.push(match[1]);
        }

        if (matches.length === 2) {
            // Ambil titik awal dan akhir
            const [startLat, startLng] = matches[0].split(',').map(coord => parseFloat(coord.trim()));
            const [endLat, endLng] = matches[1].split(',').map(coord => parseFloat(coord.trim()));

            if (!isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng)) {
                // Simpan titik awal dan akhir ke localStorage
                const routeData = {
                    start: [startLat, startLng],
                    end: [endLat, endLng]
                };
                localStorage.setItem('routeData', JSON.stringify(routeData));

                // Tambahkan marker untuk titik awal dengan ikon default
                const startMarker = L.marker([startLat, startLng], { icon: defaultIcon }).addTo(map);
                routeMarkers.push(startMarker);

                // Tambahkan marker untuk titik akhir dengan ikon default
                const endMarker = L.marker([endLat, endLng], { icon: defaultIcon }).addTo(map);
                routeMarkers.push(endMarker);

                // Gambarkan garis rute dari titik awal ke titik akhir dengan warna biru
                drawRoute([[startLat, startLng], [endLat, endLng]], 'blue');
            } else {
                alert("Input tidak valid. Pastikan untuk memasukkan koordinat dalam format yang benar.");
            }
        } else {
            alert("Input tidak valid. Pastikan untuk memasukkan dua titik koordinat dalam format yang benar.");
        }
    });

    // Tambahkan event click pada map untuk waypoint
    // Tambahkan event click pada map untuk waypoint
    map.on('click', (e) => {
        const { lat, lng } = e.latlng; // Ambil latitude dan longitude dari klik

        // Cek apakah titik awal dan akhir sudah ada
        if (routeMarkers.length < 2) {
            alert('Silakan masukkan titik awal dan akhir terlebih dahulu sebelum menambahkan waypoint.');
            return; // Tidak lanjut menambahkan waypoint jika titik awal dan akhir belum ada
        }

        // Tambahkan marker di lokasi yang diklik dengan custom icon
        const newMarker = L.marker([lat, lng], { icon: yellowIcon }).addTo(map); // Menggunakan icon kuning
        markers.push(newMarker);

        // Simpan koordinat yang diklik ke dalam array
        clickedCoords.push([lat, lng]);
        saveWaypoints(); // Simpan waypoint ke localStorage

        // Gambarkan polyline berdasarkan waypoint yang diklik
        drawWaypointPolyline();

        // Tambahkan event listener untuk menghapus marker saat diklik
        newMarker.on('click', function () {
            map.removeLayer(newMarker);
            markers = markers.filter(marker => marker !== newMarker); // Hapus dari array markers
            clickedCoords = clickedCoords.filter(coord => coord[0] !== lat || coord[1] !== lng); // Hapus dari clickedCoords
            drawWaypointPolyline(); // Gambar ulang polyline
            saveWaypoints(); // Simpan waypoint ke localStorage setelah penghapusan
        });

        // Debugging untuk menampilkan koordinat di konsol
        // console.log('Koordinat yang diklik:', clickedCoords);
    });


    // Ganti event listener untuk menyalin waypoint ke clipboard
    document.getElementById('addWaypointButton').addEventListener('click', () => {
        if (clickedCoords.length === 0) {
            alert('Belum ada rute yang ditambahkan.');
            return;
        }

        // Buat format string manual
        const formattedData = `[\n` +
            clickedCoords.map(coord => `                [${coord[0]},${coord[1]}],`).join('\n') +
            `\n]`;

        navigator.clipboard.writeText(formattedData).then(() => {
            alert('Polyline berhasil disalin ke clipboard:\n' + formattedData);
        }).catch(err => {
            console.error('Gagal menyalin: ', err);
        });
    });

    // Event listener untuk mereset localStorage
    document.getElementById('resetPolyline').addEventListener('click', () => {
        const confirmReset = confirm('Apakah Anda yakin ingin mereset semua polyline?');
        if (confirmReset) {
            localStorage.removeItem('waypoints');
            localStorage.removeItem('routeData');
            resetWaypoints(); // Hapus semua marker dari peta
            initializeMap(); // Kembali ke peta dengan koordinat awal default
        }
    });
});

// Fungsi untuk menginisialisasi peta
function initializeMap() {
    const storedInitialCoords = localStorage.getItem('routeData');
    const initialCoords = storedInitialCoords ? JSON.parse(storedInitialCoords).start : initialCoordinates;

    map = L.map('map').setView(initialCoords, 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
}

// Fungsi untuk menggambar rute dari koordinat yang diberikan
function drawRoute(coords, color) {
    // Hapus polyline lama jika ada
    waypointPolylines.forEach(polyline => map.removeLayer(polyline));

    const polyline = L.polyline(coords, { color: color }).addTo(map); // Tambahkan garis rute
    waypointPolylines.push(polyline);

    // Zoom ke area rute
    map.fitBounds(polyline.getBounds());
}

function drawWaypointPolyline() {
    // Hapus polyline lama jika ada
    const redPolylines = waypointPolylines.filter(polyline => polyline.options.color === 'red');
    redPolylines.forEach(polyline => map.removeLayer(polyline));

    // Tambahkan polyline baru berdasarkan koordinat yang telah diklik
    if (clickedCoords.length > 0) {
        const newPolyline = L.polyline(clickedCoords, { color: 'red' }).addTo(map);
        waypointPolylines.push(newPolyline);
    }
}

// Fungsi untuk menyimpan waypoint ke localStorage
function saveWaypoints() {
    localStorage.setItem('waypoints', JSON.stringify(clickedCoords));
}

// Fungsi untuk memuat waypoint dari localStorage
function loadWaypoints() {
    const storedWaypoints = localStorage.getItem('waypoints');
    if (storedWaypoints) {
        clickedCoords = JSON.parse(storedWaypoints);

        // Gambar ulang marker dan polyline dari waypoint yang disimpan
        clickedCoords.forEach(coord => {
            const marker = L.marker([coord[0], coord[1]], { icon: yellowIcon }).addTo(map);
            markers.push(marker);
        });

        drawWaypointPolyline();
    }
}

// Fungsi untuk memuat rute dari localStorage
function loadRoute() {
    const storedRouteData = localStorage.getItem('routeData');
    if (storedRouteData) {
        const routeData = JSON.parse(storedRouteData);
        const [startLat, startLng] = routeData.start;
        const [endLat, endLng] = routeData.end;

        // Tambahkan marker untuk titik awal dan akhir
        const startMarker = L.marker([startLat, startLng], { icon: defaultIcon }).addTo(map);
        const endMarker = L.marker([endLat, endLng], { icon: defaultIcon }).addTo(map);
        routeMarkers.push(startMarker, endMarker);

        // Gambarkan garis rute dari titik awal ke titik akhir dengan warna biru
        drawRoute([[startLat, startLng], [endLat, endLng]], 'blue');
    }
}

// Fungsi untuk mereset waypoint
function resetWaypoints() {
    // Hapus semua marker untuk titik awal dan akhir
    routeMarkers.forEach(marker => map.removeLayer(marker)); // Hapus marker awal dan akhir
    routeMarkers = []; // Kosongkan array routeMarkers

    clickedCoords = [];
    markers.forEach(marker => map.removeLayer(marker));
    markers = [];
    waypointPolylines.forEach(polyline => map.removeLayer(polyline));
    waypointPolylines = [];
}

