import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Box, Chip, Stack, useMediaQuery, useTheme, Typography, Accordion, AccordionSummary, AccordionDetails } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Map from '@/components/Map';
import SearchTextField from '@/components/SearchTextField';

export default function Home() {
  const [textInput, setTextInput] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [markers, setMarkers] = useState([]);
  const [placesService, setPlacesService] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
      setApiKeyExpanded(false);
    } else {
      setApiKeyExpanded(true);
    }
  }, []);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('openai_api_key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  useEffect(() => {
    if (mapInstance && !placesService) {
      const service = new window.google.maps.places.PlacesService(mapInstance);
      setPlacesService(service);
    }
  }, [mapInstance, placesService]);

  const handleApiKeyChange = (key) => {
    setApiKey(key);
    localStorage.setItem('openai_api_key', key);
    setApiKeyExpanded(false);
  };

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

  const handlePrompt = async (prompt) => {
    if (!prompt || !placesService || !apiKey) {
      if (!apiKey) {
        alert('Please enter your OpenAI API key first');
      }
      return;
    }

    try {
      const response = await fetch('/api/answer-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, apiKey }),
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

  const extractAndSearchPOIs = async (text) => {
    if (!text || !placesService || !apiKey) {
      if (!apiKey) {
        alert('Please enter your OpenAI API key first');
      }
      return;
    }

    try {
      const response = await fetch('/api/extract-pois', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, apiKey }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract POIs');
      }

      const { pois } = await response.json();
      
      // Search for each POI sequentially
      for (const poi of pois) {
        await handleSearch(poi);
      }

      setTextInput('');
    } catch (error) {
      alert('Error processing text. Please try again.');
    }
  };

  const handleDelete = (markerId) => {
    setMarkers(prevMarkers => prevMarkers.filter(marker => marker.id !== markerId));
  };

  const handleMapLoad = useCallback((map) => {
    setMapInstance(map);
  }, []);

  const placeColors = {
    // Nature & Outdoors
    beach: { bg: '#e3f2fd', text: '#1565c0', hover: '#bbdefb' },
    park: { bg: '#e8f5e9', text: '#2e7d32', hover: '#c8e6c9' },
    natural_feature: { bg: '#e8f5e9', text: '#2e7d32', hover: '#c8e6c9' },
    
    // Food & Drink
    restaurant: { bg: '#ffebee', text: '#c62828', hover: '#ffcdd2' },
    cafe: { bg: '#fff3e0', text: '#e65100', hover: '#ffe0b2' },
    bar: { bg: '#fff3e0', text: '#e65100', hover: '#ffe0b2' },
    
    // Culture & Entertainment
    museum: { bg: '#f3e5f5', text: '#6a1b9a', hover: '#e1bee7' },
    art_gallery: { bg: '#f3e5f5', text: '#6a1b9a', hover: '#e1bee7' },
    tourist_attraction: { bg: '#f3e5f5', text: '#6a1b9a', hover: '#e1bee7' },
    
    // Buildings & Structures
    premise: { bg: '#eeeeee', text: '#424242', hover: '#e0e0e0' },
    point_of_interest: { bg: '#eeeeee', text: '#424242', hover: '#e0e0e0' },
    establishment: { bg: '#eeeeee', text: '#424242', hover: '#e0e0e0' },
    
    // Shopping
    store: { bg: '#e1f5fe', text: '#0277bd', hover: '#b3e5fc' },
    shopping_mall: { bg: '#e1f5fe', text: '#0277bd', hover: '#b3e5fc' },
    
    // Default
    default: { bg: '#f5f5f5', text: '#616161', hover: '#e0e0e0' },
  };

  const getPlaceColor = (types) => {
    if (!types || types.length === 0) return placeColors.default;
    
    // Check types in order of priority
    const typeChecks = [
      'beach',
      'park',
      'natural_feature',
      'restaurant',
      'cafe',
      'bar',
      'museum',
      'art_gallery',
      'tourist_attraction',
      'store',
      'shopping_mall',
    ];

    for (const type of typeChecks) {
      if (types.includes(type)) {
        return placeColors[type];
      }
    }

    // Check for buildings last as they're more generic
    if (types.some(type => ['premise', 'point_of_interest', 'establishment'].includes(type))) {
      return placeColors.premise;
    }

    return placeColors.default;
  };

  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      overflow: 'hidden'
    }}>
      <Head>
        <title>Points on a Map (generated with AI)</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>
      
      <Box sx={{ 
        p: isMobile ? 1 : 2, 
        backgroundColor: 'background.paper',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        gap: isMobile ? 1 : 2
      }}>
        <Stack spacing={isMobile ? 1 : 2} sx={{ flex: 1 }}>
          <Box 
            sx={{ 
              backgroundColor: 'info.main',
              color: 'white',
              borderRadius: 1,
              p: 1.5,
              fontSize: '0.875rem',
              '& b': {
                fontWeight: 600,
              }
            }}
          >
            <Typography variant="body2">
              <b>💡 Quick Guide:</b> Enter a natural language prompt to find places. Try something like 
              &quot;The best coffee shops in Vienna&quot;.
            </Typography>
          </Box>
          <SearchTextField
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onEnterPress={handlePrompt}
            placeholder="Ask about places..."
          />
          <Box 
            sx={{ 
              backgroundColor: 'info.main',
              color: 'white',
              borderRadius: 1,
              p: 1.5,
              fontSize: '0.875rem',
              '& b': {
                fontWeight: 600,
              }
            }}
          >
            <Typography variant="body2">
              <b>✨ Text Extraction:</b> Paste any text containing locations and we&apos;ll automatically find and mark them on the map.
            </Typography>
          </Box>
          <SearchTextField
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            onEnterPress={extractAndSearchPOIs}
            placeholder="Paste text with locations..."
            multiline
            rows={3}
          />
        </Stack>
        
        <Box sx={{
          width: isMobile ? '100%' : 400,
          bgcolor: 'background.paper',
          borderRadius: 1,
          border: 1,
          borderColor: 'divider',
          p: 1
        }}>
          <Accordion 
            expanded={apiKeyExpanded} 
            onChange={() => setApiKeyExpanded(!apiKeyExpanded)}
            sx={{
              backgroundColor: 'transparent',
              boxShadow: 'none',
              '&:before': {
                display: 'none',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.2rem' }} />}
              sx={{
                backgroundColor: 'white',
                borderRadius: apiKeyExpanded ? '8px 8px 0 0' : '8px',
              }}
            >
              <Typography variant="body2">
                {apiKey ? 'OpenAI API Key (saved)' : 'Enter OpenAI API Key'}
              </Typography>
            </AccordionSummary>
            <AccordionDetails
              sx={{
                backgroundColor: 'white',
                borderRadius: '0 0 8px 8px',
              }}
            >
              <SearchTextField
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                onEnterPress={handleApiKeyChange}
                placeholder="Enter OpenAI API Key"
                type="password"
                submitIcon="key"
              />
              {!apiKey && (
                <Box sx={{ 
                  fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                  fontSize: '0.75rem', 
                  color: 'warning.main', 
                  mt: 1 
                }}>
                  Please enter your OpenAI API key to use the AI features
                </Box>
              )}
              <Box sx={{ 
                fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                fontSize: '0.75rem', 
                color: 'info.main', 
                mt: 1 
              }}>
                Note: Your API key will be stored in your browser's local storage.
              </Box>
            </AccordionDetails>
          </Accordion>
        </Box>
      </Box>

      <Box sx={{ 
        display: 'flex',
        flex: 1,
        overflow: 'hidden',
        flexDirection: isMobile ? 'column' : 'row'
      }}>
        <Box sx={{ 
          flex: 1,
          height: isMobile ? 'calc(100vh - 300px)' : '100%',
          position: 'relative'
        }}>
          <Map 
            markers={markers} 
            onMapLoad={handleMapLoad}
            onRemoveAll={() => setMarkers([])}
          />
        </Box>
        <Box sx={{
          width: isMobile ? '100%' : 280,
          height: isMobile ? '200px' : 'auto',
          paddingX: isMobile ? 1 : 2,
          paddingY: isMobile ? 1 : 0,
          overflowY: 'auto',
          bgcolor: 'background.paper'
        }}>
          <Stack spacing={1.5}>
            {markers.map((marker, index) => {
              const color = getPlaceColor(marker.types);
              return (
                <Chip
                  key={marker.id}
                  label={marker.name}
                  onDelete={() => handleDelete(marker.id)}
                  sx={{
                    width: '100%',
                    height: 'auto',
                    padding: '4px 2px',
                    borderRadius: '6px',
                    backgroundColor: color.bg,
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                      fontSize: '0.815rem',
                      fontWeight: 500,
                      color: color.text,
                      padding: '2px 6px',
                      textAlign: 'left'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: color.text,
                      opacity: 0.7,
                      margin: '2px 6px',
                      fontSize: '18px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        opacity: 1
                      }
                    },
                    '&:hover': {
                      backgroundColor: color.hover,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}
