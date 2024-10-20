let map;
let routingControl;
let markers = [];  // Array untuk menyimpan marker
let routes = window.data; // Ambil data dari data.js
let selectedRoute = null;

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
  }

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
  if (routingControl) {
    map.removeControl(routingControl);
  }

    // Hapus semua marker dari rute sebelumnya
    markers.forEach(marker => map.removeLayer(marker));
    // markers = [];  // Kosongkan array marker setelah dihapus

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(route.org_latLng.lat, route.org_latLng.lng),
      ...route.titikRawan.map(wp => L.latLng(wp.lat, wp.lng)),
      L.latLng(route.dst_latLng.lat, route.dst_latLng.lng)
    ],
    routeWhileDragging: true,
    show: false
  }).addTo(map);

  // Tambah marker untuk start, end, dan waypoint dengan popup yang memiliki tombol
  const orgMarker = L.marker([route.org_latLng.lat, route.org_latLng.lng]).addTo(map)
    .bindPopup(`
      <div>
        <strong>${route.org_latLng.org_site}</strong><br>
        <button id="openOrgLatLng">Buka Google Maps</button>
      </div>
    `);
    markers.push(orgMarker);

  const dstMarker = L.marker([route.dst_latLng.lat, route.dst_latLng.lng]).addTo(map)
    .bindPopup(`
      <div>
        <strong>${route.dst_latLng.dst_site}</strong><br>
        <button id="openDstLatLng">Buka Google Maps</button>
      </div>
    `);
    markers.push(dstMarker);

  // Event listener setelah popup terbuka
  orgMarker.on('popupopen', () => {
    document.getElementById('openOrgLatLng').addEventListener('click', () => {
      if (confirm('Apakah Anda ingin membuka rute di Google Maps?')) {
        const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${route.org_latLng.lat},${route.org_latLng.lng}&destination=${route.dst_latLng.lat},${route.dst_latLng.lng}`;
        window.open(googleMapsLink, '_blank');
      }
    });
  });

  dstMarker.on('popupopen', () => {
    document.getElementById('openDstLatLng').addEventListener('click', () => {
      if (confirm('Apakah Anda ingin membuka rute di Google Maps?')) {
        const googleMapsLink = `https://www.google.com/maps/dir/?api=1&origin=${route.org_latLng.lat},${route.org_latLng.lng}&destination=${route.dst_latLng.lat},${route.dst_latLng.lng}`;
        window.open(googleMapsLink, '_blank');
      }
    });
  });

  // Tambahkan marker untuk titik rawan
  route.titikRawan.forEach(({ lat, lng, description }) => {
    const waypointMarker = L.marker([lat, lng]).addTo(map).bindPopup(`Description: ${description}`);
    markers.push(waypointMarker);
  });
}


