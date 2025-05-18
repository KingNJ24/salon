# Google Maps Location Selector Setup

This feature allows you to select any location on Google Maps and display it on your salon website.

## Setup Instructions

### 1. Get a Google Maps API Key

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Create API credentials:
   - Go to "Credentials" > "Create Credentials" > "API Key"
   - Restrict the key to the APIs mentioned above
   - Set up HTTP referrer restrictions (optional but recommended for security)

### 2. Update the API Key in Your Code

1. Open the file `/public/js/admin/map-selector.js`
2. Replace `YOUR_API_KEY` with your actual Google Maps API key:

```javascript
script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_ACTUAL_KEY_HERE&libraries=places&callback=initMapSelector';
```

### 3. Using the Map Selector

1. Go to your admin panel and navigate to the "Settings" page
2. In the "Map Location" section, you'll find the interactive map
3. Search for your salon location using the search box
4. Fine-tune the position by dragging the marker
5. Click "Use This Location" to update the map embed URL
6. Click "Save Settings" to update your website

### 4. Billing Considerations

- Google Maps Platform has a free tier ($200 monthly credit)
- For most small to medium businesses, this should be sufficient
- Set up billing alerts in Google Cloud Console to avoid unexpected charges

## Troubleshooting

- If the map doesn't load, check your browser console for errors
- Verify that your API key is correct and has the necessary APIs enabled
- Ensure your billing account is active in Google Cloud Console

For more information, refer to the [Google Maps Platform documentation](https://developers.google.com/maps) 