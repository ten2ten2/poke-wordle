# Google AdSense Integration Setup

This guide explains how to set up Google AdSense for the Poke Wordle application.

## Overview

The Google AdSense integration is designed to:
- Respect user privacy and cookie consent
- Show ads only when users have consented to cookies
- Display ads in non-intrusive locations that don't interfere with gameplay
- Support multiple ad placements (header, content, footer)
- Work seamlessly with the existing cookie consent system

## Prerequisites

1. **Google AdSense Account**: You need an approved Google AdSense account
2. **AdSense Publisher ID**: Your AdSense publisher ID (format: `ca-pub-XXXXXXXXXXXXXXXXX`)
3. **Ad Unit Slots**: Create ad units in your AdSense dashboard and note their slot IDs

## Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Google AdSense Configuration
NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-XXXXXXXXXXXXXXXXX
NEXT_PUBLIC_ADSENSE_HEADER_SLOT=1234567890
NEXT_PUBLIC_ADSENSE_CONTENT_SLOT=1234567891
NEXT_PUBLIC_ADSENSE_FOOTER_SLOT=1234567892
```

### Environment Variable Details

- **NEXT_PUBLIC_ADSENSE_PUBLISHER_ID**: Your AdSense publisher ID
  - Required for AdSense to work
  - Format: `ca-pub-` followed by 16 digits
  
- **NEXT_PUBLIC_ADSENSE_HEADER_SLOT**: Ad slot ID for header banner ads
  - Optional - header ads will only show if this is set
  - Recommended size: 728x90 (Leaderboard) or responsive
  
- **NEXT_PUBLIC_ADSENSE_CONTENT_SLOT**: Ad slot ID for in-content ads
  - Optional - content ads will only show if this is set
  - Shows only when game is active and user has made at least 2 guesses
  - Recommended size: 300x250 (Medium Rectangle) or responsive
  
- **NEXT_PUBLIC_ADSENSE_FOOTER_SLOT**: Ad slot ID for footer banner ads
  - Optional - footer ads will only show if this is set
  - Recommended size: 728x90 (Leaderboard) or responsive

## AdSense Setup Steps

### 1. Create AdSense Account
1. Go to [Google AdSense](https://www.google.com/adsense/)
2. Sign up or sign in with your Google account
3. Add your website URL (`https://www.pokewordle.app`)
4. Wait for approval (this can take several days to weeks)

### 2. Create Ad Units
Once approved, create ad units in your AdSense dashboard:

1. Go to **Ads** > **By ad unit** in your AdSense dashboard
2. Click **+ New ad unit**
3. Choose **Display ads**
4. Configure each ad unit:

#### Header Ad Unit
- **Name**: "Poke Wordle - Header Banner"
- **Size**: Responsive or 728x90 (Leaderboard)
- **Ad type**: Display ads

#### Content Ad Unit
- **Name**: "Poke Wordle - In-Content"
- **Size**: Responsive or 300x250 (Medium Rectangle)
- **Ad type**: Display ads

#### Footer Ad Unit
- **Name**: "Poke Wordle - Footer Banner"
- **Size**: Responsive or 728x90 (Leaderboard)
- **Ad type**: Display ads

### 3. Get Your Publisher ID and Slot IDs
- **Publisher ID**: Found in AdSense dashboard under **Account** > **Account information**
- **Slot IDs**: Found when you create each ad unit (displayed after creation)

### 4. Update Environment Variables
Add the IDs to your `.env.local` file as shown above.

## Ad Placement Strategy

### Header Ad
- **Location**: Below the navigation bar
- **When shown**: Always (if slot ID is configured and user consented)
- **Format**: Horizontal banner
- **Size**: 728x90 or responsive

### In-Content Ad
- **Location**: Between game input and game status sections
- **When shown**: Only when:
  - Game is active (user has started playing)
  - User has made at least 2 guesses
  - User has consented to cookies
- **Format**: Rectangle
- **Size**: 300x250 or responsive

### Footer Ad
- **Location**: Above the footer
- **When shown**: Always (if slot ID is configured and user consented)
- **Format**: Horizontal banner
- **Size**: 728x90 or responsive

## Cookie Consent Integration

The AdSense integration respects the existing cookie consent system:

- **No ads shown** until user consents to cookies
- **Ads removed** if user withdraws consent
- **AdSense script** only loads if user has consented
- **Consistent behavior** with Google Analytics integration

## Technical Implementation

### Components Created

1. **GoogleAdSense.tsx**: Main AdSense component
   - Initializes AdSense when user consents
   - Provides reusable ad banner components
   
2. **Ad Banner Components**:
   - `AdBanner`: Generic ad component
   - `HeaderAdBanner`: Pre-configured header ad
   - `InContentAdBanner`: Pre-configured content ad
   - `FooterAdBanner`: Pre-configured footer ad

### Integration Points

1. **Layout.tsx**: AdSense script and initialization
2. **Game Page**: Strategic ad placements
3. **Cookie Consent**: Respect user privacy choices

## Testing

### Development Testing
1. Set environment variables in `.env.local`
2. Run `npm run dev`
3. Accept cookie consent
4. Verify ads appear in designated locations

### Production Testing
1. Deploy with environment variables set
2. Test on actual domain (AdSense requires real domain)
3. Verify ads load correctly
4. Check AdSense dashboard for impressions

## Best Practices

### Ad Placement
- **Non-intrusive**: Ads don't interfere with gameplay
- **Strategic timing**: Content ads only show during active gameplay
- **Responsive design**: Ads adapt to different screen sizes
- **User experience**: Minimal impact on game performance

### Performance
- **Lazy loading**: Ads load only when needed
- **Error handling**: Graceful failure if AdSense unavailable
- **Conditional rendering**: Ads only render with consent

### Privacy
- **Cookie consent**: Full integration with existing consent system
- **No tracking**: Without consent, no AdSense tracking occurs
- **Transparent**: Clear privacy policy about ad usage

## Troubleshooting

### Common Issues

1. **Ads not showing**:
   - Check environment variables are set correctly
   - Verify user has consented to cookies
   - Ensure AdSense account is approved
   - Check browser console for errors

2. **Invalid slot ID**:
   - Verify slot IDs in AdSense dashboard
   - Ensure IDs are correctly copied to environment variables

3. **Publisher ID format**:
   - Must start with `ca-pub-`
   - Followed by exactly 16 digits
   - No spaces or extra characters

### Debug Mode
Enable debug logging by checking browser console:
- AdSense errors are logged with context
- Cookie consent status is tracked
- Environment variable warnings are shown

## Revenue Optimization

### Tips for Better Performance
1. **Quality content**: Maintain high-quality gaming experience
2. **User engagement**: Encourage longer play sessions
3. **Mobile optimization**: Ensure ads work well on mobile devices
4. **Ad placement testing**: Monitor which placements perform best

### AdSense Policies
- **Content guidelines**: Ensure game content complies with AdSense policies
- **Click policy**: Never encourage users to click ads
- **Traffic quality**: Focus on organic, engaged users

## Support

- **AdSense Help**: [Google AdSense Help Center](https://support.google.com/adsense/)
- **Policy Center**: [AdSense Policies](https://support.google.com/adsense/answer/48182)
- **Community**: [AdSense Community Forum](https://support.google.com/adsense/community) 