# Live Tourist Location & Navigation Feature

## Overview
Integrated live tourist location tracking and navigation using Mapbox Directions API, providing Google Maps-like navigation experience.

## Features Implemented

### 1. Live Location Tracking
- **Browser Geolocation API**: Fetches tourist's current location
- **Automatic Detection**: Gets location when directions dialog opens
- **Error Handling**: Graceful fallback if location is unavailable
- **Permission Handling**: Requests location permission from browser

### 2. Directions Component (`DirectionsMap.tsx`)
- **Mapbox Directions API**: Direct integration (no plugins needed)
- **Route Visualization**: Blue route line on map
- **Origin/Destination Markers**: 
  - Blue marker for user location
  - Red marker for monument
- **Real-time Route Calculation**: Fetches route from Mapbox API
- **Route Drawing**: Draws route as GeoJSON line on map

### 3. Travel Mode Support
- **Driving Mode**: Optimized for car travel
- **Walking Mode**: Optimized for pedestrian travel
- **Mode Toggle**: Easy switching between modes
- **Dynamic Route Update**: Recalculates route when mode changes

### 4. Navigation UI
- **Info Panel**: Shows destination name, time, and distance
- **Time Display**: Estimated travel time in minutes
- **Distance Display**: Route distance in kilometers
- **Mode Selector**: Buttons to switch between driving/walking
- **Loading States**: Shows "Calculating route..." while fetching
- **Error Handling**: Displays error messages if route fails

### 5. Directions Dialog (`DirectionsDialog.tsx`)
- **Full-screen Modal**: Large dialog for navigation view
- **Location Fetching**: Gets user location on open
- **Loading States**: Shows spinner while getting location
- **Error Recovery**: "Try again" button if location fails
- **Responsive Design**: Works on mobile and desktop

### 6. Integration with Monument Detail Page
- **"Show Directions" Button**: Added next to "Buy Ticket" button
- **Conditional Display**: Only shows if monument has coordinates
- **Seamless Integration**: Opens dialog with navigation

## Technical Implementation

### Components Created
1. **`src/components/map/DirectionsMap.tsx`**
   - Main navigation map component
   - Handles route fetching and visualization
   - Manages travel mode switching

2. **`src/components/map/DirectionsDialog.tsx`**
   - Dialog wrapper for directions
   - Handles location fetching
   - Error handling and retry logic

### Utilities Used
- **`src/lib/distance.ts`**: `getUserLocation()` function
- **Mapbox Directions API**: Direct API calls (no SDK needed)

### API Integration
- **Endpoint**: `https://api.mapbox.com/directions/v5/mapbox/{profile}/{coordinates}`
- **Profiles**: `driving` or `walking`
- **Response Format**: GeoJSON geometry for route drawing

## User Experience

### Flow
1. User visits monument detail page
2. Clicks "Show Directions" button
3. Browser requests location permission
4. System fetches user location
5. Calculates route from user to monument
6. Displays route on map with time/distance
7. User can switch between driving/walking modes

### UI Features
- ✅ Google Maps-like navigation panel
- ✅ Clear time and distance display
- ✅ Easy mode switching
- ✅ Visual route on map
- ✅ Origin and destination markers
- ✅ Smooth map animations
- ✅ Loading indicators
- ✅ Error messages

## Usage

### For Tourists
1. Navigate to any monument detail page
2. Click "Show Directions" button
3. Allow location access when prompted
4. View route with estimated time and distance
5. Switch between driving/walking modes
6. Use the route to navigate to the monument

### Technical Details
- Uses Mapbox public token (via Supabase function)
- No additional packages required
- Works with existing Mapbox setup
- Fully responsive design

## Files Created/Modified

### New Files
- `src/components/map/DirectionsMap.tsx` - Navigation map component
- `src/components/map/DirectionsDialog.tsx` - Directions dialog wrapper

### Modified Files
- `src/pages/MonumentDetail.tsx` - Added "Show Directions" button

## Requirements Met

✅ Fetch tourist's current location using browser geolocation  
✅ "Show Directions" button on monument page  
✅ Route from tourist location to monument  
✅ Estimated travel time and distance  
✅ Mapbox Directions API integration  
✅ Driving and walking modes  
✅ Google Maps-like UI  

## Notes

- Location permission is required from browser
- Works best with HTTPS (required for geolocation)
- Route calculation may take 1-2 seconds
- Map automatically fits to show entire route
- Route updates when travel mode changes
