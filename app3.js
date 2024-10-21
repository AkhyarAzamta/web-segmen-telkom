let map;
let markers = [];  // Array untuk menyimpan marker
let polylines = []; // Array untuk menyimpan garis rute
let routes = window.data; // Ambil data dari data.js
let selectedRoute = null;
let clickedCoords = []; // Array untuk menyimpan koordinat hasil klik

document.addEventListener('DOMContentLoaded', () => {

  // Inisialisasi peta
  map = L.map('map').setView([-6.914744, 107.609810], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

  // Watermark logo Indihome
  L.Control.Watermark = L.Control.extend({
    onAdd: function (map) {
      var img = L.DomUtil.create('img');
      img.src = 'https://www.telkom.co.id/images/logo_horizontal.svg';
      img.style.width = '150px';  // Adjusted size for mobile
      return img;
    },
    onRemove: function (map) {
      // Nothing to do here
    }
  });

  L.control.watermark = function (opts) {
    return new L.Control.Watermark(opts);
  };

  L.control.watermark({ position: 'topright' }).addTo(map);

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

    // Tambahkan marker di lokasi yang diklik
    const newMarker = L.marker([lat, lng]).addTo(map);
    markers.push(newMarker);

    // Simpan koordinat yang diklik ke dalam array
    clickedCoords.push([lat, lng]);

    // Gambarkan polyline berdasarkan titik yang diklik
    drawPolyline();

    // Debugging untuk menampilkan koordinat di konsol
    console.log('Koordinat yang diklik:', clickedCoords);
  });

  // Event listener untuk menambah waypoint
  document.getElementById('addWaypointButton').addEventListener('click', () => {
    if (!selectedRoute) {
      alert('Pilih rute terlebih dahulu');
      return;
    }

    const latLngInput = prompt("Masukkan Latitude dan Longitude dipisahkan dengan koma(,)");
    const description = prompt("Masukkan Deskripsi untuk lokasi baru:");

    const [lat, lng] = latLngInput.split(',').map(coord => parseFloat(coord.trim()));

    if (!isNaN(lat) && !isNaN(lng) && description) {
      const newWaypoint = { lat, lng, description };
      selectedRoute.titikRawan.push(newWaypoint);
      updateMapWithRoute(selectedRoute);
    } else {
      alert("Input tidak valid. Pastikan untuk memasukkan koordinat dalam format yang benar dan deskripsi.");
    }
  });
});

function updateMapWithRoute(route) {
  // Hapus semua marker dan garis (polylines) dari rute sebelumnya
  markers.forEach(marker => map.removeLayer(marker));
  markers = [];  // Kosongkan array marker setelah dihapus
  polylines.forEach(polyline => map.removeLayer(polyline));
  polylines = []; // Kosongkan array garis rute setelah dihapus

  // Tambahkan marker untuk start dan end
  const startMarker = L.marker([route.org_latLng.lat, route.org_latLng.lng]).addTo(map).bindPopup(route.org_latLng.org_site);
  markers.push(startMarker);

  const endMarker = L.marker([route.dst_latLng.lat, route.dst_latLng.lng]).addTo(map).bindPopup(route.dst_latLng.dst_site);
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
  polylines.forEach(polyline => map.removeLayer(polyline));
  polylines = [];

  // Tambahkan polyline baru berdasarkan koordinat yang telah diklik
  const newPolyline = L.polyline(clickedCoords, { color: 'red' }).addTo(map);
  polylines.push(newPolyline);

  // Zoom agar mencakup semua titik
  if (clickedCoords.length > 1) {
    map.fitBounds(newPolyline.getBounds());
  }
}
