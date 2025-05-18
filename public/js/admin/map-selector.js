// OpenStreetMap Location Selector for Salon Website
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const mapContainer = document.getElementById('map-selector-container');
    const mapSearchInput = document.getElementById('map-search-input');
    const mapEmbedUrlInput = document.getElementById('map-embed-url');
    const mapPreview = document.querySelector('.map-preview iframe');
    const addressInput = document.getElementById('salon-address');
    const selectLocationBtn = document.getElementById('select-location-btn');
    
    let map;
    let marker;
    let selectedPlace = null;
    
    // Initialize map
    function initMap() {
        if (!mapContainer) return;
        
        // Add Leaflet CSS if not already added
        if (!document.querySelector('link[href*="leaflet.css"]')) {
            const leafletCSS = document.createElement('link');
            leafletCSS.rel = 'stylesheet';
            leafletCSS.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            leafletCSS.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            leafletCSS.crossOrigin = '';
            document.head.appendChild(leafletCSS);
        }
        
        // Add Leaflet JS if not already added
        if (typeof L === 'undefined') {
            const leafletScript = document.createElement('script');
            leafletScript.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            leafletScript.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
            leafletScript.crossOrigin = '';
            document.head.appendChild(leafletScript);
            
            leafletScript.onload = initLeafletMap;
        } else {
            initLeafletMap();
        }
    }
    
    function initLeafletMap() {
        // Default location (New Delhi, India)
        const defaultLocation = [28.6139, 77.2090];
        
        // Initialize the map
        map = L.map(mapContainer).setView(defaultLocation, 13);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(map);
        
        // Add a marker that can be moved
        marker = L.marker(defaultLocation, {
            draggable: true
        }).addTo(map);
        
        // Handle marker drag events
        marker.on('dragend', function() {
            const position = marker.getLatLng();
            updateLocationInfo(position.lat, position.lng);
        });
        
        // Handle clicks on the map
        map.on('click', function(e) {
            marker.setLatLng(e.latlng);
            updateLocationInfo(e.latlng.lat, e.latlng.lng);
        });
        
        // Add search functionality using OpenStreetMap Nominatim
        if (mapSearchInput) {
            mapSearchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    searchLocation(mapSearchInput.value);
                }
            });
        }
        
        // Select location button
        if (selectLocationBtn) {
            selectLocationBtn.addEventListener('click', function() {
                if (!selectedPlace) {
                    alert('Please search for a location or click on the map to select a place.');
                    return;
                }
                
                // Preview map with new URL
                if (mapPreview && mapEmbedUrlInput.value) {
                    mapPreview.src = mapEmbedUrlInput.value;
                }
                
                // Show success message
                alert('Location selected! Save settings to apply this location to your website.');
            });
        }
    }
    
    // Search for a location using OpenStreetMap Nominatim
    function searchLocation(query) {
        if (!query) return;
        
        // Show loading state
        mapSearchInput.setAttribute('disabled', true);
        mapSearchInput.value = 'Searching...';
        
        // Use Nominatim API to search for the location
        fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.length > 0) {
                    const result = data[0];
                    const lat = parseFloat(result.lat);
                    const lng = parseFloat(result.lon);
                    
                    // Update the map
                    map.setView([lat, lng], 16);
                    marker.setLatLng([lat, lng]);
                    
                    // Update location info
                    updateLocationInfo(lat, lng, result.display_name);
                } else {
                    alert('Location not found. Please try a different search term.');
                }
            })
            .catch(error => {
                console.error('Error searching location:', error);
                alert('Error searching for location. Please try again.');
            })
            .finally(() => {
                // Restore search input
                mapSearchInput.removeAttribute('disabled');
                mapSearchInput.value = query;
            });
    }
    
    // Update location information and embed URL
    function updateLocationInfo(lat, lng, address) {
        // Store selected place
        selectedPlace = { lat, lng, address };
        
        // Update address field if available
        if (address && addressInput) {
            addressInput.value = address;
        } else if (addressInput) {
            // Reverse geocode to get address
            fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
                .then(response => response.json())
                .then(data => {
                    if (data && data.display_name) {
                        addressInput.value = data.display_name;
                        selectedPlace.address = data.display_name;
                    }
                })
                .catch(error => console.error('Error in reverse geocoding:', error));
        }
        
        // Create embed URL
        updateEmbedUrl(lat, lng);
    }
    
    // Create OpenStreetMap embed URL
    function updateEmbedUrl(lat, lng) {
        if (!mapEmbedUrlInput) return;
        
        // Create OpenStreetMap embed URL
        const embedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
        
        mapEmbedUrlInput.value = embedUrl;
    }
    
    // Initialize the map if container exists
    if (mapContainer) {
        initMap();
    }
}); 