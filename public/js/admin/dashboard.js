// Dashboard functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize any charts or data visualizations
    initializeCharts();
    
    // Load Google Reviews
    loadGoogleReviews();
});

// Initialize charts if needed
function initializeCharts() {
    // Add chart initialization code here if needed
}

// Load Google Reviews
function loadGoogleReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    if (!reviewsContainer) return;

    // Show loading state
    reviewsContainer.innerHTML = `
        <div class="loading-reviews">
            <p>Loading reviews...</p>
            <p class="loading-details">Fetching reviews from Google Places</p>
        </div>
    `;

    // Make API call to fetch reviews
    fetch('/api/reviews')
        .then(response => response.json())
        .then(data => {
            if (data.reviews && data.reviews.length > 0) {
                displayReviews(data.reviews);
            } else {
                showNoReviews();
            }
        })
        .catch(error => {
            console.error('Error loading reviews:', error);
            showReviewsError();
        });
}

// Display reviews in the container
function displayReviews(reviews) {
    const reviewsContainer = document.getElementById('reviewsContainer');
    reviewsContainer.innerHTML = reviews.map(review => `
        <div class="review-card">
            <div class="review-header">
                <h3 class="review-author">${review.author_name}</h3>
                <span class="review-date">${formatReviewDate(review.time)}</span>
            </div>
            <div class="review-rating">
                ${generateStarRating(review.rating)}
            </div>
            <p class="review-text">${review.text}</p>
        </div>
    `).join('');
}

// Format review date
function formatReviewDate(timestamp) {
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diff = now - date;
    
    // Convert to days
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return date.toLocaleDateString();
}

// Generate star rating HTML
function generateStarRating(rating) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    let stars = '';
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}

// Show no reviews message
function showNoReviews() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    reviewsContainer.innerHTML = `
        <div class="no-reviews">
            <p>No reviews available</p>
            <p class="no-reviews-details">There are no Google reviews for your business yet.</p>
        </div>
    `;
}

// Show reviews error message
function showReviewsError() {
    const reviewsContainer = document.getElementById('reviewsContainer');
    reviewsContainer.innerHTML = `
        <div class="reviews-error">
            <p>Unable to load reviews</p>
            <p class="error-details">There was an error loading the reviews. Please try again later.</p>
            <button class="btn btn-sm" onclick="loadGoogleReviews()">
                <i class="fas fa-sync-alt"></i> Retry
            </button>
        </div>
    `;
}

// Refresh reviews
function refreshReviews() {
    loadGoogleReviews();
}

// View booking details
function viewBooking(bookingId) {
    // Implement booking details view
    window.location.href = `/admin/bookings/${bookingId}`;
}

// Update booking status
function updateStatus(bookingId) {
    // Implement booking status update
    window.location.href = `/admin/bookings/${bookingId}/edit`;
}

// Export bookings
function exportBookings() {
    // Implement bookings export
    window.location.href = '/admin/bookings/export';
} 