# Salon Website

A modern, responsive salon website built with Node.js and Express.

## Features

- Beautiful and responsive design
- Gallery/Lookbook with category filtering
- Mobile-friendly layout
- Animations for smooth user experience

## Getting Started

### Prerequisites

- Node.js installed on your machine
- MongoDB (optional, will fallback to in-memory database if unavailable)

### Installation

1. Clone the repository or download the files
2. Navigate to the project directory
3. Install dependencies:

```bash
npm install
```

### Environment Setup

1. Copy the example environment file to create your own:

```bash
cp env.example .env
```

2. Open the `.env` file and customize the values:

```
# Server Configuration
PORT=3000

# MongoDB Configuration
MONGODB_URI=mongodb://127.0.0.1:27017/salon

# Session Secret (change this in production)
SESSION_SECRET=yoursalonsecret123

# Admin Credentials (change these in production)
ADMIN_USERNAME=nikhil
ADMIN_PASSWORD=123456
```

### Running the Application

To start the server in development mode with automatic reloading:

```bash
npm run dev
```

To start the server in production mode:

```bash
npm start
```

The website will be available at http://localhost:3000

## Project Structure

- `app.js` - Main application file
- `db/` - Database connection and initialization
- `models/` - MongoDB data models
- `views/` - EJS templates
- `public/` - Static assets (CSS, JavaScript, images)

## Admin Access

After starting the application, you can access the admin panel at:
http://localhost:3000/admin

Use the credentials defined in your .env file (default: username `nikhil`, password `123456`).

## Customizing the Website

### Images

Replace the placeholder images in `public/images/` with your own photos.

### Content

Edit the EJS templates in `views/` to customize the content.

### Styling

Modify `public/css/style.css` to change the look and feel.

## License

This project is licensed under the ISC License 