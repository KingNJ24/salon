# Deploying Your Salon Website to Vercel

This guide will walk you through the process of deploying your salon website to Vercel.

## Prerequisites

1. A [GitHub](https://github.com) account with your salon code repository
2. A [Vercel](https://vercel.com) account (you can sign up using your GitHub account)
3. A MongoDB Atlas account for your database (or any MongoDB hosting service)

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

## Step 2: Deploy to Vercel

### Option 1: Using the Vercel Website (Easiest)

1. Go to [Vercel](https://vercel.com) and sign in with your GitHub account
2. Click "Add New..." and select "Project"
3. Import your salon repository from GitHub
4. Configure your project:
   - Framework Preset: Select "Other"
   - Root Directory: Keep as is (/)
   - Build Command: Leave blank (Vercel will use the vercel.json configuration)
   - Output Directory: Leave blank
5. Expand "Environment Variables" and add the following:
   - `MONGO_URI`: Your MongoDB Atlas connection string
   - `SESSION_SECRET`: A secure random string for session encryption
   - `NODE_ENV`: Set to `production`
   - `ADMIN_USERNAME`: Your admin panel username
   - `ADMIN_PASSWORD`: Your admin panel password
6. Click "Deploy"

### Option 2: Using the Vercel CLI

1. Install the Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Log in to Vercel:
   ```
   vercel login
   ```

3. Navigate to your project directory and run:
   ```
   vercel
   ```

4. Follow the CLI prompts to configure your project
5. When asked about environment variables, add the ones listed above

## Step 3: Configure Your Domain (Optional)

1. In your Vercel dashboard, go to your project
2. Click on "Settings" > "Domains"
3. Add your custom domain and follow the verification steps

## Step 4: Seed Your Database (If Needed)

If you need to initialize your database with data:

1. Update the MongoDB connection string in your seed scripts to use your MongoDB Atlas URI
2. Run your seed scripts locally:
   ```
   node seed-gallery.js
   ```

## Troubleshooting

If you encounter issues:

1. Check Vercel logs in your project dashboard
2. Verify your environment variables are set correctly
3. Make sure your MongoDB Atlas cluster is accessible (check network access settings)
4. Check that your package.json includes all necessary dependencies

## Ongoing Maintenance

1. Any pushes to your main branch on GitHub will automatically trigger a new deployment on Vercel
2. You can roll back to previous deployments in the Vercel dashboard
3. Monitor usage on your MongoDB Atlas dashboard to ensure you stay within free tier limits 