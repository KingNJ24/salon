const mongoose = require('mongoose');

const siteInfoSchema = new mongoose.Schema({
  salonName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  logo: {
    type: String,
    default: '/images/logo.png',
    trim: true
  },
  currencySymbol: {
    type: String,
    default: '₹',
    trim: true
  },
  // Social media links
  socialMedia: {
    facebook: {
      type: String,
      default: '',
      trim: true
    },
    instagram: {
      type: String,
      default: '',
      trim: true
    },
    twitter: {
      type: String,
      default: '',
      trim: true
    },
    pinterest: {
      type: String,
      default: '',
      trim: true
    },
    youtube: {
      type: String,
      default: '',
      trim: true
    },
    whatsapp: {
      type: String,
      default: '',
      trim: true
    }
  },
  // Homepage featured services
  featuredServices: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'Service',
    default: []
  },
  // Homepage content fields
  heroTitle: {
    type: String,
    default: 'Your Hair, Our Passion',
    trim: true
  },
  heroSubtitle: {
    type: String,
    default: 'Experience the best in hair care and styling',
    trim: true
  },
  aboutText: {
    type: String,
    default: 'We are a team of passionate stylists dedicated to helping you look and feel your best. With years of experience and a commitment to excellence, we provide top-quality hair services in a welcoming environment.',
    trim: true
  },
  homeVideo: {
    type: String,
    default: '/videos/salon-ad.mp4',
    trim: true
  },
  homepageImage: {
    type: String,
    default: '/images/salon-homepage.jpg',
    trim: true
  },
  aboutImage: {
    type: String,
    default: '/images/about.jpg',
    trim: true
  },
  hours: {
    monday: {
      type: String,
      default: '9am - 8pm'
    },
    tuesday: {
      type: String,
      default: '9am - 8pm'
    },
    wednesday: {
      type: String,
      default: '9am - 8pm'
    },
    thursday: {
      type: String,
      default: '9am - 8pm'
    },
    friday: {
      type: String,
      default: '9am - 8pm'
    },
    saturday: {
      type: String,
      default: '9am - 6pm'
    },
    sunday: {
      type: String,
      default: '10am - 5pm'
    }
  }
});

const SiteInfo = mongoose.model('SiteInfo', siteInfoSchema);

module.exports = SiteInfo; 