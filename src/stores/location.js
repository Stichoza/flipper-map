import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useLocationStore = defineStore('location', () => {
  
  const userLocation = ref(null);
  const locationError = ref(null);
  const isLoading = ref(false);
  
  const geolocationSupported = () => !!navigator.geolocation
  
  const getUserLocation = async () => {
    if (!navigator.geolocation) {
      locationError.value = 'Geolocation is not supported by your browser';
      return;
    }
    
    isLoading.value = true;
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        });
      });
      
      userLocation.value = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      locationError.value = `Error getting location: ${error.message}`;
    } finally {
      isLoading.value = false;
    }
  };
  
  // Calculate distance between two points using Haversine formula
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  };
  
  const deg2rad = (deg) => {
    return deg * (Math.PI/180);
  };
  
  return {
    userLocation,
    locationError,
    isLoading,
    geolocationSupported,
    getUserLocation,
    calculateDistance
  };
});