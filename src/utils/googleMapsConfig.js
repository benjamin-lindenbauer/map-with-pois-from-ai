export const libraries = ['places'];

export const getGoogleMapsApiKey = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('google_maps_api_key') || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  }
};

export const mapConfig = {
  id: 'google-map-script',
  googleMapsApiKey: getGoogleMapsApiKey(),
  libraries
};
