# Environment Variables Setup

This file contains all the environment variables needed for the Poke Wordle application.

## Setup Instructions

1. Create a `.env.local` file in the root directory
2. Copy the variables below and fill in your actual values
3. Never commit `.env.local` to version control (it's already in `.gitignore`)

## Required Environment Variables

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Google AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXXX
```

## Optional Environment Variables

```env
# Google AdSense Ad Slots (all optional)
# Header banner ad (recommended: 728x90 or responsive)
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=1234567890

# In-content ad (recommended: 300x250 or responsive)
# Shows only during active gameplay after 2+ guesses
NEXT_PUBLIC_ADSENSE_CONTENT_SLOT=1234567891

# Footer banner ad (recommended: 728x90 or responsive)
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT=1234567892
```

## Variable Descriptions

### Google Analytics
- **NEXT_PUBLIC_GA_MEASUREMENT_ID**: Your Google Analytics 4 measurement ID
  - Format: `G-` followed by 10 characters
  - Find in: Google Analytics > Admin > Data Streams

### Google AdSense
- **NEXT_PUBLIC_ADSENSE_PUBLISHER_ID**: Your AdSense publisher ID
  - Required for AdSense to work
  - Format: `ca-pub-` followed by 16 digits
  - Find in: AdSense > Account > Account information

- **NEXT_PUBLIC_ADSENSE_HEADER_SLOT**: Header banner ad slot ID
  - Optional - header ads only show if this is set
  - Find in: AdSense > Ads > By ad unit (after creating ad unit)

- **NEXT_PUBLIC_ADSENSE_CONTENT_SLOT**: In-content ad slot ID
  - Optional - content ads only show if this is set
  - Strategic placement during gameplay

- **NEXT_PUBLIC_ADSENSE_FOOTER_SLOT**: Footer banner ad slot ID
  - Optional - footer ads only show if this is set
  - Find in: AdSense > Ads > By ad unit (after creating ad unit)

## Example .env.local File

```env
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-1234567890

# Google AdSense
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-1234567890123456
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_CONTENT_SLOT=1234567891
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT=1234567892
```

## Deployment

When deploying to production (Vercel, Netlify, etc.), make sure to set these environment variables in your deployment platform's settings.

### Vercel
1. Go to your project dashboard
2. Navigate to Settings > Environment Variables
3. Add each variable with its value
4. Redeploy your application

### Netlify
1. Go to your site dashboard
2. Navigate to Site settings > Environment variables
3. Add each variable with its value
4. Trigger a new deploy

## Security Notes

- Never commit `.env.local` to version control
- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Keep your Publisher ID and Measurement ID secure but not secret (they're public)
- AdSense slot IDs are public and safe to expose

## Testing

1. Set up your `.env.local` file with real values
2. Run `npm run dev`
3. Open browser developer tools
4. Check for any console errors related to missing environment variables
5. Test cookie consent and verify ads appear (if AdSense account is approved) 