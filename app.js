let map;
let routingControl;
let routes = window.data; // Ambil data dari data.js
let selectedRoute = null;

document.addEventListener('DOMContentLoaded', () => {

  // Inisialisasi peta
  map = L.map('map').setView([-6.914744, 107.609810], 10);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

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

  routingControl = L.Routing.control({
    waypoints: [
      L.latLng(route.org_latLng.lat, route.org_latLng.lng),
      ...route.titikRawan.map(wp => L.latLng(wp.lat, wp.lng)),
      L.latLng(route.dst_latLng.lat, route.dst_latLng.lng)
    ],
    routeWhileDragging: true,
    show: false
  }).addTo(map);

  // Tambah marker untuk start, end, dan waypoint
  L.marker([route.org_latLng.lat, route.org_latLng.lng]).addTo(map).bindPopup(route.org_latLng.org_site);
  L.marker([route.dst_latLng.lat, route.dst_latLng.lng]).addTo(map).bindPopup(route.dst_latLng.dst_site);

  route.titikRawan.forEach(({ lat, lng, description }) => {
    L.marker([lat, lng]).addTo(map).bindPopup(`Description: ${description}`);
  });
}
