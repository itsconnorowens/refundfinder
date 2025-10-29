# How to Get Your Vercel Blob Token

## Step 1: Access Vercel Dashboard
1. Go to [https://vercel.com/dashboard/stores](https://vercel.com/dashboard/stores)
2. Sign in to your Vercel account

## Step 2: Create a Blob Store
1. Click **"Create Store"**
2. Choose **"Blob"** as the store type
3. Give it a name (e.g., "flghtly-files")
4. Select your preferred region
5. Click **"Create"**

## Step 3: Get Your Token
1. Once created, click on your store
2. Go to the **"Settings"** tab
3. Copy the **"Read-Write Token"** (starts with `vercel_blob_rw_...`)

## Step 4: Add to Environment Variables
1. Open your `.env.local` file
2. Add the token:
```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_your_token_here
```

## Step 5: Deploy to Vercel
1. Add the environment variable to your Vercel project:
   - Go to your project dashboard
   - Settings → Environment Variables
   - Add `BLOB_READ_WRITE_TOKEN` with your token value
2. Redeploy your project

## Testing
After setup, test the file upload functionality:
1. Run `npm run dev`
2. Go to `/claim` page
3. Upload a test file in Step 3
4. Check your Vercel Blob store to see the uploaded file

## Pricing
- **Free Tier**: 1GB storage + 10GB transfer per month
- **Paid**: $0.023/GB/month storage + $5/million uploads
- Perfect for your MVP needs!

## Troubleshooting
- **Token Error**: Make sure the token is correctly copied (no extra spaces)
- **Upload Fails**: Check that the token has read-write permissions
- **Files Not Appearing**: Verify the token is added to both local and Vercel environment variables
