import { LoadScript } from '@react-google-maps/api';
import { getGoogleMapsApiKey } from './googleMapsConfig';

const libraries = ['places', 'marker'];

export function GoogleMapsProvider({ children }) {
  return (
    <LoadScript
      googleMapsApiKey={getGoogleMapsApiKey()}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}
