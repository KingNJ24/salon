# Deploying Your Salon Website to Vercel

This guide will walk you through the process of deploying your salon website to Vercel.

## Prerequisites

1. A [GitHub](https://github.com) account with your salon code repository
2. A [Vercel](https://vercel.com) account (you can sign up using your GitHub account)
3. A MongoDB Atlas account for your database (or any MongoDB hosting service)
4. A [Cloudinary](https://cloudinary.com) account for file uploads (they have a free tier)

## Step 1: Prepare Your MongoDB Database

1. If you're currently using a local MongoDB database, you'll need to migrate to a cloud-hosted MongoDB:
   - Sign up for [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (they have a free tier)
   - Create a new cluster
   - Set up database access (create a user with password)
   - Set up network access (allow access from anywhere for Vercel to connect)
   - Get your MongoDB connection string, which looks like:
     ```
     mongodb+srv://username:password@cluster.mongodb.net/salon?retryWrites=true&w=majority
     ```

## Step 2: Set Up Cloudinary for File Uploads

Vercel's serverless functions cannot write files to the filesystem. To enable file uploads, we need to use Cloudinary:

1. Sign up for a free [Cloudinary](https://cloudinary.com/users/register/free) account
2. After signing up, go to your Dashboard
3. Note your Cloud name, API Key, and API Secret from the dashboard
4. You'll need these values for your Vercel environment variables:
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Step 3: Deploy to Vercel

1. Log in to [Vercel](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: ./
   - Build Command: Leave blank (default)
   - Output Directory: Leave blank (default)
   - Install Command: Leave blank (default)

5. Add the following environment variables:
   - `MONGO_URI` - Your MongoDB Atlas connection string
   - `SESSION_SECRET` - A secure random string
   - `NODE_ENV` - Set to `production`
   - `ADMIN_USERNAME` - Your admin username
   - `ADMIN_PASSWORD` - Your admin password
   - `CLOUDINARY_CLOUD_NAME` - Your Cloudinary cloud name
   - `CLOUDINARY_API_KEY` - Your Cloudinary API key
   - `CLOUDINARY_API_SECRET` - Your Cloudinary API secret

6. Click "Deploy"
7. Wait for the deployment to complete (this may take a few minutes)
8. Once deployed, Vercel will provide you with a URL to access your site

## Step 4: Initialize Your Database

After deploying, you need to initialize your database with the required site information:

1. Go to your deployed site URL followed by `/api/init-db` (e.g., `https://your-site.vercel.app/api/init-db`)
2. This will create the default site information, services, and other necessary data

## Troubleshooting

### 500 Error on File Uploads

If you're getting 500 errors when trying to upload files, ensure that:

1. Your Cloudinary environment variables are set correctly
2. The Cloudinary service is working properly
3. Your account has enough credits (free tier has limitations)

### Site Not Loading Properly

If your site isn't displaying properly:

1. Check the Vercel deployment logs for errors
2. Verify that your MongoDB connection string is correct
3. Ensure that your database is populated with the necessary data

### Admin Login Issues

If you can't log in to the admin panel:

1. Verify that your `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables are set correctly
2. Try resetting your password using MongoDB Atlas

## Managing Your Deployment

- You can configure automatic deployments on push to your GitHub repository
- You can manage environment variables in the Vercel project settings
- You can view logs and monitor performance in the Vercel dashboard

For more information, visit the [Vercel documentation](https://vercel.com/docs) or the [Cloudinary documentation](https://cloudinary.com/documentation). 