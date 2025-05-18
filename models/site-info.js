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
  mapEmbedUrl: {
    type: String,
    default: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3474.4431684712117!2d77.30589979999999!3d29.4450669!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x390c2f98f7a35099%3A0x1cc5130c96e9864d!2sNandini%20J%20Makeup%20Studio%20%26%20Luxury%20Salon%20-HD%20Party%20Makeup%20%7CHaircut%20%26%20Styling%20%7CHD%20Bridal%20Makeup%20in%20Shamli!5e0!3m2!1sen!2sin!4v1747572096609!5m2!1sen!2sin',
    trim: true
  },
  servicesViewMode: {
    type: String,
    enum: ['grid', 'catalog'],
    default: 'grid',
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