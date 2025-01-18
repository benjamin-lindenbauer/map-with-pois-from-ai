import { useJsApiLoader } from '@react-google-maps/api';
import { useState } from 'react';
import { getGoogleMapsApiKey } from '../utils/googleMapsConfig';

const libraries = ['places'];

const MapWrapper = ({ children }) => {
  const config = {
    id: 'google-map-script',
    googleMapsApiKey: getGoogleMapsApiKey(),
    libraries
  };

  const { isLoaded, loadError } = useJsApiLoader(config);
  const [placesService, setPlacesService] = useState(null);

  if (loadError) {
    return <div>Error loading Google Maps</div>;
  }

  return children({ isLoaded, placesService, setPlacesService });
}

export default MapWrapper;
