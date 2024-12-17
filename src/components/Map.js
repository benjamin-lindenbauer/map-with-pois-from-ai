import { useState, useCallback, useEffect, useRef } from 'react';
import { GoogleMap, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { Button, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

const containerStyle = {
  width: '100%',
  height: '100%'
};

const defaultCenter = {
  lat: 48.2082,
  lng: 16.3738
};

function Map({ markers, onMapLoad, onRemoveAll, onSaveList, onRemoveMarker }) {
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
          // Keep default center if geolocation fails
        }
      );
    }
  }, []);

  useEffect(() => {
    if (map && markers.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      
      markers.forEach(marker => {
        bounds.extend({ lat: marker.lat, lng: marker.lng });
      });
      
      map.fitBounds(bounds);
      
      if (markers.length === 1) {
        const listener = map.addListener('idle', () => {
          map.setZoom(13);
          window.google.maps.event.removeListener(listener);
        });
      }
    }
  }, [markers, map]);

  useEffect(() => {
    if (selectedMarker && !markers.find(m => m.id === selectedMarker.id)) {
      setSelectedMarker(null);
    }
  }, [markers, selectedMarker]);

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
              {selectedMarker.phone && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  📞 {selectedMarker.phone}
                </p>
              )}
              {selectedMarker.website && (
                <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                  🌐 <a href={selectedMarker.website} target="_blank" rel="noopener noreferrer">Website</a>
                </p>
              )}
              {selectedMarker.types && selectedMarker.types.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontWeight: 'bold' }}>Types:</p>
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
              <div style={{ marginTop: '8px' }}>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${selectedMarker.name} ${selectedMarker.address || ''}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#1976d2', textDecoration: 'none' }}
                >
                  Open in Google Maps
                </a>
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
