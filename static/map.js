// Map variables
let map, marker, accuracyCircle;
let mapMode = 'area'; // 'area' or 'point'

// Initialize map when DOM is loaded
function initMap() {
    // Create map if it doesn't exist
    if (!map) {
        map = L.map('map').setView([0, 0], 2);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        
        // Create marker for position
        marker = L.marker([0, 0]).addTo(map);
        
        // Create accuracy circle (NEO-6M typically has 2.5m accuracy)
        accuracyCircle = L.circle([0, 0], {
            color: 'blue',
            fillColor: '#3388ff',
            fillOpacity: 0.2,
            radius: 2.5 // default radius in meters
        }).addTo(map);
        
        // Setup mode toggle button
        document.getElementById('toggle-map-mode').addEventListener('click', toggleMapMode);
    }
}

// Update map with new coordinates
function updateMap(latitude, longitude) {
    if (!map || isNaN(latitude) || isNaN(longitude)) return;
    
    // Only update if we have valid coordinates
    if (latitude !== 0 && longitude !== 0) {
        const position = [latitude, longitude];
        
        // Update marker position
        marker.setLatLng(position);
        
        // Update accuracy circle
        accuracyCircle.setLatLng(position);
        
        // Apply current mode display
        updateMapMode();
        
        // Center map on current position
        map.setView(position, 18);
    }
}

// Toggle between area and point modes
function toggleMapMode() {
    const button = document.getElementById('toggle-map-mode');
    
    if (mapMode === 'area') {
        mapMode = 'point';
        button.innerHTML = '<i class="bi bi-geo-alt"></i> Point Mode';
    } else {
        mapMode = 'area';
        button.innerHTML = '<i class="bi bi-circle"></i> Area Mode';
    }
    
    // Update display based on new mode
    updateMapMode();
}

// Update map display based on current mode
function updateMapMode() {
    if (mapMode === 'area') {
        // Show accuracy circle with NEO-6M typical accuracy (2.5m)
        accuracyCircle.setRadius(2.5);
        accuracyCircle.setStyle({opacity: 1, fillOpacity: 0.2});
    } else {
        // Hide accuracy circle in point mode
        accuracyCircle.setStyle({opacity: 0, fillOpacity: 0});
    }
}
