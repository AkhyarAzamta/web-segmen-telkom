// Kode yang sudah ada...
let map;
let markers = [];  // Array untuk menyimpan marker
let polylines = []; // Array untuk menyimpan garis rute
let routes = window.data; // Ambil data dari data.js
let selectedRoute = null;
let clickedCoords = []; // Array untuk menyimpan koordinat hasil klik

// Definisikan custom icon
var yellowIcon = L.icon({
    iconUrl: 'http://maps.google.com/mapfiles/ms/icons/yellow.png',
    iconSize: [40, 40],  // Ukuran icon
});

document.addEventListener('DOMContentLoaded', () => {
  // Inisialisasi peta
  map = L.map('map').setView([-6.914744, 107.609810], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  document.getElementById('map').style.cursor = 'pointer'; // Menambahkan cursor: pointer


  // Tambahkan opsi rute ke dropdown
  const routeSelector = document.getElementById('routeSelector');
  routes.forEach(route => {
    const option = document.createElement('option');
    option.value = route.name;
    option.textContent = route.name;
    routeSelector.appendChild(option);
  });

  // Event listener untuk pemilihan rute
  routeSelector.addEventListener('change', (e) => {
    const routeName = e.target.value;
    selectedRoute = routes.find(route => route.name === routeName);

    if (selectedRoute) {
      updateMapWithRoute(selectedRoute);
    }
  });

  // Tambahkan event click pada map
  map.on('click', (e) => {
    const { lat, lng } = e.latlng; // Ambil latitude dan longitude dari klik

    // Tambahkan marker di lokasi yang diklik dengan custom icon
    const newMarker = L.marker([lat, lng], { icon: yellowIcon }).addTo(map); // Menggunakan icon kuning
    markers.push(newMarker);

    // Simpan koordinat yang diklik ke dalam array
    clickedCoords.push([lat, lng]);

    // Gambarkan polyline berdasarkan titik yang diklik
    drawPolyline();

    // Tambahkan event listener untuk menghapus marker saat diklik
    newMarker.on('click', function() {
      map.removeLayer(newMarker);
      markers = markers.filter(marker => marker !== newMarker); // Hapus dari array markers
      clickedCoords = clickedCoords.filter(coord => coord[0] !== lat || coord[1] !== lng); // Hapus dari clickedCoords
      drawPolyline(); // Gambar ulang polyline
    });

    // Debugging untuk menampilkan koordinat di konsol
    console.log('Koordinat yang diklik:', clickedCoords);
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



});

// Fungsi lainnya tetap sama...
function updateMapWithRoute(route) {
  // Hapus semua marker dan garis (polylines) dari rute sebelumnya
  markers.forEach(marker => {
    if (!marker.isStart && !marker.isEnd) {
      map.removeLayer(marker);
    }
  });

  polylines.forEach(polyline => map.removeLayer(polyline));
  polylines = []; // Kosongkan array garis rute setelah dihapus

  // Tambahkan marker untuk start dan end dengan icon default
  const startMarker = L.marker([route.org_latLng.lat, route.org_latLng.lng]).addTo(map).bindPopup(route.org_latLng.org_site);
  startMarker.isStart = true; // Tandai sebagai marker awal
  markers.push(startMarker);

  const endMarker = L.marker([route.dst_latLng.lat, route.dst_latLng.lng]).addTo(map).bindPopup(route.dst_latLng.dst_site);
  endMarker.isEnd = true; // Tandai sebagai marker akhir
  markers.push(endMarker);

  // Gambarkan garis rute dari start ke titik rawan dan ke end
  const allPoints = [
    [route.org_latLng.lat, route.org_latLng.lng], // Start point
    [route.dst_latLng.lat, route.dst_latLng.lng] // End point
  ];

  const polyline = L.polyline(allPoints, { color: 'blue' }).addTo(map); // Tambahkan garis rute
  polylines.push(polyline);

  // Zoom ke area rute
  map.fitBounds(polyline.getBounds());
}

function drawPolyline() {
  // Hapus polyline lama jika ada
  // Hanya hapus polyline merah, bukan semua polylines
  const redPolylines = polylines.filter(polyline => polyline.options.color === 'red');
  redPolylines.forEach(polyline => map.removeLayer(polyline));
  
  // Tambahkan polyline baru berdasarkan koordinat yang telah diklik
  if (clickedCoords.length > 0) {
      const newPolyline = L.polyline(clickedCoords, { color: 'red' }).addTo(map);
      polylines.push(newPolyline);
  }
}

