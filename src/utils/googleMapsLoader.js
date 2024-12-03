import { LoadScript } from '@react-google-maps/api';

const libraries = ['places', 'marker'];

export function GoogleMapsProvider({ children }) {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
}
