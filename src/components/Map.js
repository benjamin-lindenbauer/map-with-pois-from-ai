import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Button, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import MapIcon from '@mui/icons-material/Map';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 48.2082,
  lng: 16.3738
};

function Map({ markers, onMapLoad, onRemoveAll, onSaveList, onRemoveMarker, setMarkers }) {
  const [map, setMap] = useState(null);
  const [center, setCenter] = useState(defaultCenter);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.warn("Error getting location:", error);
        }
      );
    }
  }, []);

  useEffect(() => {
    if (selectedMarker && !markers.find(m => m.id === selectedMarker.id)) {
      setSelectedMarker(null);
    }
  }, [markers, selectedMarker]);

  useEffect(() => {
    if (map) {
      // Add click listener to map
      const clickListener = map.addListener('click', (e) => {
        // Prevent default InfoWindow from showing
        e.stop();
        
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        const infoWindow = new window.google.maps.InfoWindow();
        
        if (e.placeId) {
          // If clicked on a place, get detailed place information
          const placesService = new window.google.maps.places.PlacesService(map);
          placesService.getDetails({
            placeId: e.placeId,
            fields: ['name', 'formatted_address', 'geometry', 'rating', 'user_ratings_total', 'opening_hours', 'website', 'formatted_phone_number', 'types']
          }, (place, status) => {
            if (status === 'OK') {
              const content = document.createElement('div');
              content.innerHTML = `
                <div style="max-width: 300px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px;">${place.name}</h3>
                  ${place.formatted_address ? `
                    <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                      📍 ${place.formatted_address}
                    </p>
                  ` : ''}
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                    📌 ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </p>
                  ${place.rating ? `
                    <p style="margin: 0 0 8px 0; font-size: 14px;">
                      ⭐ ${place.rating} (${place.user_ratings_total} reviews)
                    </p>
                  ` : ''}
                  ${place.website ? `
                    <p style="margin: 0 0 8px 0; font-size: 14px;">
                      🌐 <a href="${place.website}" target="_blank" rel="noopener noreferrer">Website</a>
                    </p>
                  ` : ''}
                  ${place.types && place.types.length > 0 ? `
                    <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-bottom: 8px;">
                      ${place.types.map(type => `
                        <span style="
                          display: inline-block;
                          background: #f0f0f0;
                          padding: 2px 6px;
                          border-radius: 12px;
                          font-size: 12px;
                        ">${type.replace(/_/g, ' ')}</span>
                      `).join('')}
                    </div>
                  ` : ''}
                  <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button id="addToList" style="
                      background-color: #1976d2;
                      color: white;
                      border: none;
                      padding: 6px 16px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 13px;
                    ">Add to List</button>
                  </div>
                </div>
              `;

              // Add click handler to the button
              content.querySelector('#addToList').addEventListener('click', () => {
                const newMarker = {
                  lat,
                  lng,
                  name: place.name,
                  address: place.formatted_address,
                  id: `location_${Date.now()}`,
                  placeId: e.placeId,
                  rating: place.rating,
                  totalRatings: place.user_ratings_total,
                  isOpen: place.opening_hours?.isOpen?.(),
                  website: place.website,
                  phone: place.formatted_phone_number,
                  types: place.types
                };
                setMarkers(prev => [...prev, newMarker]);
                infoWindow.close();
              });

              infoWindow.setContent(content);
              infoWindow.setPosition({ lat, lng });
              infoWindow.open(map);
            }
          });
        } else {
          // If clicked on empty space, use geocoder
          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK') {
              const place = results[0];
              const content = document.createElement('div');
              content.innerHTML = `
                <div style="max-width: 300px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 16px;">${place.formatted_address}</h3>
                  <p style="margin: 0 0 8px 0; font-size: 14px; color: #666;">
                    📍 ${lat.toFixed(6)}, ${lng.toFixed(6)}
                  </p>
                  <div style="display: flex; justify-content: flex-end; margin-top: 8px;">
                    <button id="addToList" style="
                      background-color: #1976d2;
                      color: white;
                      border: none;
                      padding: 6px 16px;
                      border-radius: 4px;
                      cursor: pointer;
                      font-size: 13px;
                    ">Add to List</button>
                  </div>
                </div>
              `;

              // Add click handler to the button
              content.querySelector('#addToList').addEventListener('click', () => {
                const newMarker = {
                  lat,
                  lng,
                  name: place.formatted_address,
                  address: place.formatted_address,
                  id: `location_${Date.now()}`,
                  details: `${lat.toFixed(6)}, ${lng.toFixed(6)}`
                };
                setMarkers(prev => [...prev, newMarker]);
                infoWindow.close();
              });

              infoWindow.setContent(content);
              infoWindow.setPosition({ lat, lng });
              infoWindow.open(map);
            }
          });
        }
      });

      return () => {
        window.google.maps.event.removeListener(clickListener);
      };
    }
  }, [map, setMarkers]);

  const onLoad = useCallback((map) => {
    setMap(map);
    mapRef.current = map;
    if (onMapLoad) {
      onMapLoad(map);
    }
  }, [onMapLoad]);

  const onUnmount = useCallback(function callback(map) {
    setMap(null);
  }, []);

  const handleRemoveAll = () => {
    if (onRemoveAll) {
      onRemoveAll();
    }
    setSelectedMarker(null);
  };

  const handleShowAll = () => {
    if (markers.length === 0) return;
    
    const bounds = new window.google.maps.LatLngBounds();
    markers.forEach(marker => {
      bounds.extend({ lat: marker.lat, lng: marker.lng });
    });
    
    if (markers.length === 1) {
      mapRef.current?.setCenter({ lat: markers[0].lat, lng: markers[0].lng });
      mapRef.current?.setZoom(13);
    } else {
      mapRef.current?.fitBounds(bounds, { padding: 50 });
    }
  };

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={center}
        zoom={13}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {markers.map((marker) => (
          <MarkerF
            key={marker.id || marker.name}
            position={{ lat: marker.lat, lng: marker.lng }}
            title={marker.name}
            onClick={() => setSelectedMarker(marker)}
          />
        ))}
        {selectedMarker && (
          <InfoWindowF
            position={{ lat: selectedMarker.lat, lng: selectedMarker.lng }}
            onCloseClick={() => setSelectedMarker(null)}
          >
            <div style={{ maxWidth: '300px' }}>
              <h3 style={{ margin: '0 0 8px 0', fontSize: '16px' }}>{selectedMarker.name}</h3>
              {selectedMarker.address && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: '#666' }}>
                  📍 {selectedMarker.address}
                </p>
              )}
              {selectedMarker.rating && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  ⭐ {selectedMarker.rating} ({selectedMarker.totalRatings} reviews)
                </p>
              )}
              {selectedMarker.isOpen !== undefined && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px', color: selectedMarker.isOpen ? '#4CAF50' : '#f44336' }}>
                  {selectedMarker.isOpen ? '✓ Open now' : '× Closed'}
                </p>
              )}
              {selectedMarker.website && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  🌐 <a href={selectedMarker.website} target="_blank" rel="noopener noreferrer">Website</a>
                </p>
              )}
              {selectedMarker.types && selectedMarker.types.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                  {selectedMarker.types.map((type, index) => (
                    <span key={index} style={{
                      display: 'inline-block',
                      background: '#f0f0f0',
                      padding: '2px 6px',
                      borderRadius: '12px',
                      margin: '0 4px 4px 0',
                      fontSize: '12px'
                    }}>
                      {type.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ 
                margin: '8px 0 0 0',
                padding: '8px 0 0 0',
                borderTop: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                color: '#888',
                fontSize: '12px'
              }}>
                <span>📌 {selectedMarker.lat.toFixed(6)}, {selectedMarker.lng.toFixed(6)}</span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <Tooltip title="Copy coordinates">
                    <IconButton
                      size="small"
                      onClick={() => {
                        const coords = `${selectedMarker.lat.toFixed(6)}, ${selectedMarker.lng.toFixed(6)}`;
                        navigator.clipboard.writeText(coords);
                      }}
                      style={{ padding: 4 }}
                    >
                      <ContentCopyIcon style={{ fontSize: 16, color: '#888' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Open in Google Maps">
                    <IconButton
                      size="small"
                      component="a"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        `${selectedMarker.name} ${selectedMarker.address || ''}`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ padding: 4 }}
                    >
                      <MapIcon style={{ fontSize: 16, color: '#888' }} />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove this place">
                    <IconButton
                      size="small"
                      onClick={() => {
                        if (onRemoveMarker) {
                          onRemoveMarker(selectedMarker.id);
                          setSelectedMarker(null);
                        }
                      }}
                      style={{ padding: 4 }}
                    >
                      <DeleteOutlineIcon style={{ fontSize: 16, color: '#888' }} />
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            </div>
          </InfoWindowF>
        )}
      </GoogleMap>
      {markers.length > 0 && (
        <div style={{ position: 'absolute', top: '10px', right: '60px' }}>
          <Button
            variant="contained"
            onClick={handleShowAll}
            style={{
              marginRight: '10px',
              backgroundColor: '#4CAF50',
              color: 'white',
              '&:hover': {
                backgroundColor: '#45a049'
              }
            }}
          >
            Show All
          </Button>
          <Button
            variant="contained"
            onClick={handleRemoveAll}
            style={{
              marginRight: '10px',
              backgroundColor: '#f44336',
              color: 'white',
              '&:hover': {
                backgroundColor: '#da190b'
              }
            }}
          >
            Remove All
          </Button>
          <Button
            variant="contained"
            onClick={() => onSaveList()}
            disabled={markers.length === 0}
            sx={{
              backgroundColor: '#f5f5f5',
              color: '#616161',
              '&:hover': {
                backgroundColor: '#e0e0e0',
              },
            }}
          >
            Save List
          </Button>
        </div>
      )}
    </div>
  );
}

export default Map;
