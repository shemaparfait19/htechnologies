# 🔔 How to Test Notifications

## Quick Test Steps:

### 1. Open Test Page
Navigate to: `https://your-app.vercel.app/test-notifications`

### 2. Follow On-Screen Steps:
1. Click **"Request Permission"** → Allow notifications
2. Click **"Subscribe"** → Subscribe to push notifications
3. Click **"Browser Notification"** → See instant notification
4. Click **"Push Notification"** → Test server-sent notification

### 3. Verify Notifications Work:
- ✅ Notification appears on screen
- ✅ Notification shows correct title and message
- ✅ Clicking notification works
- ✅ Notification appears even when app is in background

---

## Testing on Phone (After Installation):

### Android:
1. Install PWA from Chrome
2. Open installed app
3. Go to `/test-notifications`
4. Allow notifications when prompted
5. Send test notification
6. **Close the app** or minimize it
7. Notification should appear in notification tray

### iOS:
1. Install PWA from Safari
2. Open installed app
3. Go to `/test-notifications`
4. Allow notifications when prompted
5. Send test notification
6. **Close the app** or minimize it
7. Notification should appear in notification center

---

## What to Check:

✅ **Permission Granted**: Green checkmark next to "Permission Status"  
✅ **Subscribed**: Green checkmark next to "Subscription Status"  
✅ **Browser Notification Works**: Instant notification appears  
✅ **Push Notification Works**: Server notification appears  
✅ **Background Notifications**: Notifications appear when app is closed  

---

## Troubleshooting:

### Notifications not appearing?
1. Check browser/phone notification settings
2. Ensure notifications are enabled for the app
3. Try in incognito/private mode
4. Clear cache and try again

### Permission denied?
1. Go to browser settings
2. Find site permissions
3. Enable notifications for your app
4. Refresh and try again

### On iOS not working?
- iOS requires PWA to be installed for push notifications
- Notifications only work in installed PWAs, not Safari browser
- Make sure to "Add to Home Screen" first

---

## Production Testing:

Once deployed, test these scenarios:

1. **New Repair Assignment**:
   - Create a repair and assign to a technician
   - Technician should receive notification

2. **Status Change**:
   - Update repair status to "Ready"
   - Customer should receive notification

3. **Low Stock**:
   - Reduce inventory below reorder level
   - Manager should receive notification

4. **Appointment Reminder**:
   - Schedule appointment
   - Notification should be sent before appointment

---

**Test URL**: `https://your-app.vercel.app/test-notifications`

Good luck! 🎉
