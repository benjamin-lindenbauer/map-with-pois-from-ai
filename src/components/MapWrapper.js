import { useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';

const libraries = ['places'];

const mapConfig = {
  id: 'google-map-script',
  googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  libraries
};

export default function MapWrapper({ children }) {
  const { isLoaded, loadError } = useJsApiLoader(mapConfig);
  const [placesService, setPlacesService] = useState(null);

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  return children({ isLoaded, placesService, setPlacesService });
}
