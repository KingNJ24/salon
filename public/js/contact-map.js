// OpenStreetMap display for contact page
document.addEventListener('DOMContentLoaded', function() {
    // Get the map container element
    const mapContainer = document.getElementById('contact-map-container');
    
    if (!mapContainer) return; // Exit if container not found
    
    // Get map coordinates and address from data attributes
    const lat = parseFloat(mapContainer.getAttribute('data-lat') || 28.6139);
    const lng = parseFloat(mapContainer.getAttribute('data-lng') || 77.2090);
    const address = mapContainer.getAttribute('data-address') || '';
    
    // Add Leaflet CSS if not present
    if (!document.querySelector('link[href*="leaflet.css"]')) {
        const leafletCSS = document.createElement('link');
        leafletCSS.rel = 'stylesheet';
        leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
        leafletCSS.crossOrigin = '';
        document.head.appendChild(leafletCSS);
    }
    
    // Function to initialize map after Leaflet is loaded
    function initMap() {
        // Create map
        const map = L.map(mapContainer).setView([lat, lng], 16);
        
        // Add tile layer (OpenStreetMap)
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        
        // Add marker
        const marker = L.marker([lat, lng]).addTo(map);
        
        // Add popup with address if available
        if (address) {
            marker.bindPopup(address).openPopup();
        }
    }
    
    // Check if Leaflet is already loaded
    if (typeof L === 'undefined') {
        // Load Leaflet JS
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
        script.crossOrigin = '';
        
        // Initialize map after script is loaded
        script.onload = initMap;
        
        document.head.appendChild(script);
    } else {
        // Leaflet already loaded, initialize map directly
        initMap();
    }
}); 