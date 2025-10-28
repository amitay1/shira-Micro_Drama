# PWA Setup Guide

## Overview
This application is now configured as a Progressive Web App (PWA), allowing users to install it on their devices for a native app-like experience.

## Features Implemented

### ✅ Service Worker (`/public/sw.js`)
- **Offline Support**: Caches pages and assets for offline viewing
- **Background Sync**: Syncs favorites and watch history when connection is restored
- **Push Notifications**: Ready for web push notifications
- **Smart Caching Strategy**:
  - Static assets: Cache first
  - API requests: Network only
  - Images: Cache with fallback to network
  - Videos: Network only (no caching of large files)
  - HTML pages: Network first with offline fallback

### ✅ PWA Manifest (`/public/manifest.json`)
- App name and branding
- 8 icon sizes (72x72 to 512x512)
- Standalone display mode (full-screen experience)
- Portrait orientation
- Theme colors (pink and dark gray)
- Shortcuts: Continue Watching, Favorites, Search
- Share target for receiving shared content

### ✅ Install Prompt Component
- Shows after 30 seconds of usage
- Beautiful gradient design with features list
- "Add to Home Screen" functionality
- Dismissible with 7-day cooldown
- Auto-detects if app is already installed

### ✅ Offline Page (`/app/offline/page.tsx`)
- Shown when user is offline and page isn't cached
- Retry button to check connection
- Tips for troubleshooting connection issues
- Matches app design theme

### ✅ Service Worker Registration
- Auto-registers service worker on app load
- Checks for updates every hour
- Prompts user to reload when new version is available
- Handles controller changes

## Icon Generation

### Option 1: Use the Icon Generator (Recommended)

1. Open the icon generator in your browser:
   ```
   http://localhost:3001/icon-generator.html
   ```

2. Click "Download All Icons" button

3. Move all downloaded icons to `/public/icons/` folder

4. Icons will be named: `icon-72x72.png`, `icon-96x96.png`, etc.

### Option 2: Create Custom Icons

If you want to use your own custom icons:

1. Create 8 PNG images with these exact sizes:
   - 72×72 pixels
   - 96×96 pixels
   - 128×128 pixels
   - 144×144 pixels
   - 152×152 pixels
   - 192×192 pixels
   - 384×384 pixels
   - 512×512 pixels

2. Name them: `icon-72x72.png`, `icon-96x96.png`, etc.

3. Place all icons in the `/public/icons/` folder

### Icon Design Guidelines
- Use the brand colors: Pink (#ec4899) and Purple (#8b5cf6)
- Include a recognizable symbol (e.g., play button, logo)
- Make sure icons are clear and visible at all sizes
- Use transparent or gradient backgrounds
- Add rounded corners for larger icons (192px+)

## Testing PWA Installation

### Desktop (Chrome/Edge)
1. Open your app in Chrome/Edge
2. Wait for the install prompt (or look for install icon in address bar)
3. Click "Install" to add to desktop
4. App will open in standalone window

### Mobile (Android)
1. Open your app in Chrome
2. Wait 30 seconds for the install prompt to appear
3. Or tap menu (⋮) → "Add to Home screen"
4. Confirm installation
5. App icon will appear on home screen

### Mobile (iOS)
1. Open your app in Safari
2. Tap Share button (□↑)
3. Scroll and tap "Add to Home Screen"
4. Customize name and tap "Add"
5. App icon will appear on home screen

## Testing Offline Mode

1. Install the app on your device
2. Open DevTools (F12) → Network tab
3. Set throttling to "Offline"
4. Navigate through the app
5. Cached pages should load
6. Uncached pages show offline page

## Background Sync

The service worker automatically syncs data in the background:

### Favorites Sync
- Saves favorites to localStorage immediately
- Syncs to backend when connection is restored
- Triggered on: `sync-favorites` event

### Watch History Sync
- Saves progress to localStorage every 5 seconds
- Syncs to backend when connection is restored
- Triggered on: `sync-watch-history` event

## Push Notifications (Future)

The service worker is ready for push notifications. To implement:

1. Generate VAPID keys for web push
2. Subscribe users to push notifications
3. Send notifications from backend
4. Service worker will display notifications
5. Handle notification clicks to open relevant pages

## Troubleshooting

### Icons Not Showing
- Make sure icons are in `/public/icons/` folder
- Check that filenames match exactly: `icon-72x72.png`, etc.
- Clear browser cache and service worker
- Uninstall and reinstall the app

### Service Worker Not Updating
- Open DevTools → Application → Service Workers
- Click "Unregister" on old service worker
- Refresh the page
- New service worker will register

### Install Prompt Not Showing
- Must be served over HTTPS (or localhost)
- User must interact with page first
- Install criteria must be met (manifest, service worker, etc.)
- Check that prompt wasn't dismissed in last 7 days

### Offline Mode Not Working
- Check service worker is registered and active
- Verify caching strategy in DevTools → Application → Cache Storage
- Make sure pages were visited before going offline
- Videos won't work offline (intentionally not cached)

## Performance Tips

1. **Preload Critical Assets**: Add important assets to `STATIC_ASSETS` array in `sw.js`

2. **Cache Cleanup**: Service worker automatically removes old caches on activation

3. **Update Strategy**: Service worker checks for updates every hour

4. **Network First**: HTML pages use network-first strategy for fresh content

5. **Cache Images**: Images are cached indefinitely until cache is cleared

## Security Considerations

- Service worker only works over HTTPS (except localhost)
- Cache sensitive user data carefully
- Don't cache authentication tokens
- Clear caches on logout
- Validate data before syncing to backend

## Browser Support

- ✅ Chrome 45+
- ✅ Firefox 44+
- ✅ Safari 11.1+
- ✅ Edge 17+
- ✅ Opera 32+
- ⚠️ iOS Safari (limited support, no background sync)

## Next Steps

After generating icons:

1. ✅ Generate PWA icons using the icon generator
2. ✅ Test installation on desktop and mobile
3. ✅ Test offline functionality
4. ⬜ Implement push notifications (Task 6)
5. ⬜ Add social sharing features (Task 7)
6. ⬜ Submit to app stores as TWA (Trusted Web Activity)

## Resources

- [PWA Documentation](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Workbox (Advanced Caching)](https://developers.google.com/web/tools/workbox)
