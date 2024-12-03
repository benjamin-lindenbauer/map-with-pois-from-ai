import { useState, useEffect, useCallback } from 'react';
import { Box, Container, Chip, Stack, Button } from '@mui/material';
import Map from '@/components/Map';
import SearchTextField from '@/components/SearchTextField';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [textInput, setTextInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [markers, setMarkers] = useState([]);
  const [placesService, setPlacesService] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  useEffect(() => {
    if (mapInstance && !placesService) {
      const service = new window.google.maps.places.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [mapInstance, placesService]);

  const handleSearch = async (query) => {
    if (!query || !placesService) return;

    try {
      // First, find the place with basic fields
      const searchRequest = {
        query,
        fields: ['name', 'geometry', 'place_id']
      };

      placesService.findPlaceFromQuery(searchRequest, (results, status) => {
        if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
          const place = results[0];
          
          // Then, get details for the found place
          const detailsRequest = {
            placeId: place.place_id,
            fields: [
              'name',
              'geometry',
              'formatted_address',
              'rating',
              'user_ratings_total',
              'opening_hours',
              'photos',
              'website',
              'formatted_phone_number',
              'types'
            ]
          };

          placesService.getDetails(detailsRequest, (placeDetails, detailsStatus) => {
            if (detailsStatus === window.google.maps.places.PlacesServiceStatus.OK) {
              const newMarker = {
                lat: placeDetails.geometry.location.lat(),
                lng: placeDetails.geometry.location.lng(),
                name: placeDetails.name,
                id: `${placeDetails.name}_${placeDetails.geometry.location.lat()}_${placeDetails.geometry.location.lng()}_${Date.now()}`,
                placeId: placeDetails.place_id,
                details: query,
                address: placeDetails.formatted_address,
                rating: placeDetails.rating,
                totalRatings: placeDetails.user_ratings_total,
                isOpen: placeDetails.opening_hours?.isOpen?.(),
                website: placeDetails.website,
                phone: placeDetails.formatted_phone_number,
                types: placeDetails.types,
                photoUrl: placeDetails.photos?.[0]?.getUrl()
              };
              
              setMarkers(prevMarkers => [...prevMarkers, newMarker]);
              setSearchQuery('');
            }
          });
        } else {
          alert('Location not found. Please try a different search term.');
        }
      });
    } catch (error) {
      alert('Error searching for location. Please try again.');
    }
  };

  const extractAndSearchPOIs = async (text) => {
    try {
      const response = await fetch('/api/extract-pois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract POIs');
      }

      const { pois } = await response.json();
      
      // Search for each POI sequentially
      for (const poi of pois) {
        await new Promise((resolve) => {
          if (!placesService) return resolve();

          const request = {
            query: poi,
            fields: ['name', 'geometry']
          };

          placesService.findPlaceFromQuery(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const newMarker = {
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
                name: results[0].name,
                id: Date.now()
              };
              
              setMarkers(prevMarkers => [...prevMarkers, newMarker]);
            }
            resolve();
          });
        });
      }

      setTextInput('');
    } catch (error) {
      alert('Error processing text. Please try again.');
    }
  };

  const handlePrompt = async (prompt) => {
    if (!prompt || !placesService) return;

    try {
      const response = await fetch('/api/answer-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to process prompt');
      }

      const { locations } = await response.json();
      
      // Process each location sequentially
      for (const location of locations) {
        await handleSearch(location);
      }
      
      setPromptInput('');
    } catch (error) {
      alert('Error processing prompt. Please try again.');
    }
  };

  const handleDelete = (markerId) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
  };

  const handleRemoveAll = () => {
    setMarkers([]);
  };

  const handleMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Box sx={{ 
        p: 2, 
        backgroundColor: 'background.paper'
      }}>
        <Stack spacing={2}>
          <SearchTextField
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onEnterPress={handlePrompt}
            placeholder="Ask a question (e.g., 'Top 10 places to visit in Berlin') and press Enter"
          />
          <SearchTextField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onEnterPress={handleSearch}
            placeholder="Search for a point of interest and press Enter"
          />
          <SearchTextField
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onEnterPress={extractAndSearchPOIs}
            placeholder="Enter text to extract and map points of interest and press Ctrl+Enter"
            multiline
            rows={3}
            requireCtrl
          />
        </Stack>
      </Box>
      <Box sx={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden'
      }}>
        <Box sx={{ 
          flex: 1,
          height: '100%',
          position: 'relative'
        }}>
          <Map 
            markers={markers} 
            onMapLoad={handleMapLoad}
            onRemoveAll={() => setMarkers([])}
          />
        </Box>
        <Box sx={{
          width: 250,
          paddingX: 2,
          overflowY: 'auto',
          bgcolor: 'background.paper'
        }}>
          <Stack spacing={1}>
            {markers.map((marker) => (
              <Chip
                key={marker.id}
                label={marker.name}
                onDelete={() => handleDelete(marker.id)}
                sx={{
                  borderRadius: '6px',
                  transition: 'all 0.2s ease-in-out',
                  '& .MuiChip-label': {
                    fontSize: '0.875rem',
                    color: 'text.primary'
                  },
                  '& .MuiChip-deleteIcon': {
                    color: 'text.secondary',
                    '&:hover': {
                      color: 'error.main'
                    }
                  },
                  '&:hover': {
                    bgcolor: 'action.hover'
                  }
                }}
              />
            ))}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
