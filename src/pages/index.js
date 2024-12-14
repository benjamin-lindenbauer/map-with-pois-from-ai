import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { Box, Chip, Stack, useMediaQuery, useTheme, Typography, Accordion, AccordionSummary, AccordionDetails, 
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, List, ListItem, ListItemText, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DeleteIcon from '@mui/icons-material/Delete';
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
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [savedLists, setSavedLists] = useState([]);

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

  useEffect(() => {
    // Load saved lists from local storage
    const lists = JSON.parse(localStorage.getItem('savedPointLists') || '[]');
    setSavedLists(lists);
  }, []);

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

  const handleSaveList = () => {
    if (!listName.trim()) return;

    const newList = {
      name: listName,
      markers: markers,
      date: new Date().toISOString()
    };

    const updatedLists = [...savedLists, newList];
    localStorage.setItem('savedPointLists', JSON.stringify(updatedLists));
    setSavedLists(updatedLists);
    setListName('');
    setSaveDialogOpen(false);
  };

  const handleLoadList = (list) => {
    setMarkers(list.markers);
  };

  const handleDeleteList = (indexToDelete) => {
    const updatedLists = savedLists.filter((_, index) => index !== indexToDelete);
    localStorage.setItem('savedPointLists', JSON.stringify(updatedLists));
    setSavedLists(updatedLists);
  };

  const greyChipStyle = {
    bg: '#f5f5f5',
    text: '#616161',
    hover: '#e0e0e0'
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
            <Typography variant="body2" sx={{ mb: 1 }}>
              <b>💡 Quick Guide:</b> Enter a natural language prompt to find places. Try something like 
              &quot;The best coffee shops in Vienna&quot;.
            </Typography>
            <Typography variant="body2">
              <b>✨ Text Extraction:</b> Paste any text containing locations and we&apos;ll automatically find and mark them on the map.
            </Typography>
          </Box>
          <SearchTextField
            value={promptInput}
            onChange={(e) => setPromptInput(e.target.value)}
            onEnterPress={handlePrompt}
            placeholder="Ask about places..."
          />
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
          height: isMobile ? 'auto' : 400,
          paddingX: 1,
          paddingY: isMobile ? 1 : 0,
          overflowY: 'auto',
          bgcolor: 'background.paper'
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

        {/* Saved Lists Panel */}
        <Accordion
          sx={{
            backgroundColor: 'transparent',
            boxShadow: 'none',
            '&:before': {
              display: 'none',
            },
            mt: 1
          }}
        >
          <AccordionSummary 
            expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.2rem' }} />}
            sx={{
              backgroundColor: 'white',
              borderRadius: '8px 8px 0 0',
              '&.Mui-expanded': {
                borderRadius: '8px 8px 0 0'
              },
              '&.Mui-disabled': {
                borderRadius: '8px'
              }
            }}
          >
            <Typography variant="body2">Saved Lists ({savedLists.length})</Typography>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              backgroundColor: 'white',
              borderRadius: '0 0 8px 8px',
              p: 0
            }}
          >
            <List>
              {savedLists.map((list, index) => (
                <ListItem
                  key={index}
                  secondaryAction={
                    <IconButton edge="end" onClick={() => handleDeleteList(index)}>
                      <DeleteIcon />
                    </IconButton>
                  }
                >
                  <ListItemText
                    primary={list.name}
                    secondary={`${list.markers.length} points • ${new Date(list.date).toLocaleDateString()}`}
                    sx={{ cursor: 'pointer' }}
                    onClick={() => handleLoadList(list)}
                  />
                </ListItem>
              ))}
            </List>
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
            onSaveList={() => setSaveDialogOpen(true)}
          />
        </Box>
        <Box sx={{
          width: isMobile ? '100%' : 300,
          height: isMobile ? '200px' : 'auto',
          paddingX: 1,
          paddingY: isMobile ? 1 : 0,
          overflowY: 'auto',
          bgcolor: 'background.paper'
        }}>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {markers.map((marker, index) => {
              return (
                <Chip
                  key={marker.id}
                  label={marker.name}
                  onDelete={() => handleDelete(marker.id)}
                  sx={{
                    height: 'auto',
                    padding: '4px 2px',
                    borderRadius: '6px',
                    backgroundColor: greyChipStyle.bg,
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      fontFamily: '"Roboto","Helvetica","Arial",sans-serif',
                      fontSize: '0.815rem',
                      fontWeight: 500,
                      color: greyChipStyle.text,
                      padding: '2px 6px',
                      textAlign: 'left'
                    },
                    '& .MuiChip-deleteIcon': {
                      color: greyChipStyle.text,
                      opacity: 0.7,
                      margin: '2px 2px',
                      fontSize: '16px',
                      transition: 'all 0.2s ease-in-out',
                      '&:hover': {
                        opacity: 1
                      }
                    },
                    '&:hover': {
                      backgroundColor: greyChipStyle.hover,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                    }
                  }}
                />
              );
            })}
          </Stack>
        </Box>
      </Box>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => setSaveDialogOpen(false)}>
        <DialogTitle>Save Current Points List</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="List Name"
            fullWidth
            value={listName}
            onChange={(e) => setListName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveList} disabled={!listName.trim()}>Save</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
