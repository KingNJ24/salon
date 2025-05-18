// Google Maps Location Selector for Salon Website
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
    let geocoder;
    let selectedPlace = null;
    
    // Initialize Google Maps
    function initMap() {
        if (!mapContainer) return;
        
        // Default location (New Delhi, India)
        const defaultLocation = { lat: 28.6139, lng: 77.2090 };
        
        // Initialize map
        map = new google.maps.Map(mapContainer, {
            center: defaultLocation,
            zoom: 13,
            mapTypeControl: true,
            fullscreenControl: true,
            streetViewControl: true,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        
        // Initialize geocoder
        geocoder = new google.maps.Geocoder();
        
        // Create a marker that can be moved
        marker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        
        // Create search box
        const searchBox = new google.maps.places.SearchBox(mapSearchInput);
        
        // Bias search results to current map view
        map.addListener('bounds_changed', function() {
            searchBox.setBounds(map.getBounds());
        });
        
        // Listen for search results
        searchBox.addListener('places_changed', function() {
            const places = searchBox.getPlaces();
            
            if (places.length === 0) return;
            
            // Get first place
            const place = places[0];
            selectedPlace = place;
            
            if (!place.geometry || !place.geometry.location) return;
            
            // If the place has a geometry, center the map
            map.setCenter(place.geometry.location);
            map.setZoom(17);
            
            // Update marker position
            marker.setPosition(place.geometry.location);
            
            // Update address field if available
            if (place.formatted_address && addressInput) {
                addressInput.value = place.formatted_address;
            }
            
            // Create embed URL from selected place
            updateEmbedUrl(place.geometry.location.lat(), place.geometry.location.lng(), place.place_id);
        });
        
        // Handle marker drag events
        marker.addListener('dragend', function() {
            const position = marker.getPosition();
            
            // Update address via geocoding
            geocoder.geocode({ location: position }, function(results, status) {
                if (status === 'OK' && results[0]) {
                    selectedPlace = results[0];
                    
                    // Update address field
                    if (addressInput) {
                        addressInput.value = results[0].formatted_address;
                    }
                    
                    // Create embed URL from marker position
                    updateEmbedUrl(position.lat(), position.lng(), results[0].place_id);
                }
            });
        });
        
        // Select location button
        if (selectLocationBtn) {
            selectLocationBtn.addEventListener('click', function() {
                if (!selectedPlace) {
                    alert('Please search for a location or drag the marker to select a place.');
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
    
    // Create Google Maps embed URL from coordinates and place ID
    function updateEmbedUrl(lat, lng, placeId) {
        if (!mapEmbedUrlInput) return;
        
        let embedUrl = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3000!2d${lng}!3d${lat}`;
        
        if (placeId) {
            // Add place ID if available for better accuracy
            embedUrl += `!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s${placeId}!2s!5e0!3m2!1sen!2sin!4v${Date.now()}!5m2!1sen!2sin`;
        } else {
            // Generic embed without place ID
            embedUrl += `!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2s!5e0!3m2!1sen!2sin!4v${Date.now()}!5m2!1sen!2sin`;
        }
        
        mapEmbedUrlInput.value = embedUrl;
    }
    
    // Load Google Maps API when needed
    if (mapContainer) {
        // Check if Google Maps API is already loaded
        if (typeof google === 'undefined' || typeof google.maps === 'undefined') {
            // Load Google Maps API
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMapSelector';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
            
            // Define callback function in global scope
            window.initMapSelector = initMap;
        } else {
            // API already loaded, initialize map directly
            initMap();
        }
    }
}); 