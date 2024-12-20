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
  const [placeInput, setPlaceInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [markers, setMarkers] = useState([]);
  const [placesService, setPlacesService] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [apiKeyExpanded, setApiKeyExpanded] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [listName, setListName] = useState('');
  const [savedLists, setSavedLists] = useState([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

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
      setListName(''); // Clear list name when searching
      const locations = query.split('\n').filter(location => location.trim());
      const notFoundLocations = [];

      for (const location of locations) {
        if (!location.trim()) continue;

        const searchRequest = {
          query: location.trim(),
          fields: ['place_id', 'geometry', 'name']
        };

        await new Promise((resolve) => {
          placesService.findPlaceFromQuery(searchRequest, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const place = results[0];
              
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
                    details: location.trim(),
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
                  setPlaceInput(''); // Clear place input after successful addition
                }
                resolve();
              });
            } else {
              notFoundLocations.push(location.trim());
              resolve();
            }
          });
        });
      }

      if (notFoundLocations.length > 0) {
        alert(`The following locations were not found:\n${notFoundLocations.join('\n')}\n\nPlease try different search terms for these locations.`);
      }
    } catch (error) {
      alert('Error searching for locations. Please try again.');
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
      setListName(''); // Clear list name when using prompt
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
      setListName(''); // Clear list name when extracting POIs
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

  const handleLoadList = (list) => {
    setIsLoadingList(true);
    setMarkers(list.markers);
    setListName(list.name);
  };

  const handleSaveList = () => {
    if (!listName.trim()) return;

    const newList = {
      name: listName,
      markers: markers,
      date: '2024-12-17T14:37:01+01:00'
    };

    let updatedLists;
    const existingListIndex = savedLists.findIndex(list => list.name === listName);
    
    if (existingListIndex !== -1) {
      // Update existing list
      updatedLists = savedLists.map((list, index) => 
        index === existingListIndex ? newList : list
      );
    } else {
      // Create new list
      updatedLists = [...savedLists, newList];
    }

    localStorage.setItem('savedPointLists', JSON.stringify(updatedLists));
    setSavedLists(updatedLists);
    setListName('');
    setSaveDialogOpen(false);
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
      height: '100vh'
    }}>
      <Head>
        <title>Points on a Map (generated with AI)</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
      </Head>

      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        height: '100vh'
      }}>
        {/* Top Row */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          minHeight: isMobile ? 'auto' : '260px'
        }}>
          {/* Top Left: Info Box and Text Fields */}
          <Box sx={{ 
            flex: isMobile ? 'none' : 1,
            p: 2,
            display: 'flex',
            flexDirection: 'column',
            gap: 2
          }}>
            <Box 
              sx={{ 
                backgroundColor: '#329AB1',
                color: 'white',
                borderRadius: 1,
                p: 1.5,
                fontSize: '0.875rem',
                '& b': { fontWeight: 600 }
              }}
            >
              <Typography variant="body2" sx={{ mb: 1 }}>
                Add places to your map using any of these methods:
              </Typography>
              <Typography variant="body2">
                <b>🎯 Click Map:</b> Simply click anywhere on the map to add a marker at that location.
              </Typography>
              <Typography variant="body2">
                <b>💡 Smart Search:</b> Use natural language like &quot;hip cafes in Berlin&quot; to discover places.
              </Typography>
              <Typography variant="body2">
                <b>📝 Text Extract:</b> Paste any text with locations to automatically mark them all.
              </Typography>
              <Typography variant="body2">
                <b>🔍 Direct Search:</b> Search specific places like &quot;Eiffel Tower Paris&quot; for precise results.
              </Typography>
            </Box>
            <SearchTextField
              value={placeInput}
              onChange={(e) => setPlaceInput(e.target.value)}
              onEnterPress={handleSearch}
              placeholder="Search for a specific place (e.g., Eiffel Tower Paris)"
            />
            <SearchTextField
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              onEnterPress={handlePrompt}
              placeholder="Ask about places, e.g., &quot;Best coffee shops in Vienna&quot;"
            />
            <SearchTextField
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              onEnterPress={extractAndSearchPOIs}
              placeholder="Paste text with locations..."
              multiline
              rows={3}
            />
          </Box>

          {/* Top Right: API Key and Saved Lists */}
          <Box sx={{ 
            width: isMobile ? '100%' : '400px',
            p: isMobile ? 0 : 2,
            pl: 0,
            pb: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            ...(isMobile ? {} : { maxHeight: '260px', overflowY: 'auto' })
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
                '& .MuiAccordionSummary-root': {
                  minHeight: '40px',
                  padding: '0 16px',
                },
                '& .MuiAccordionSummary-content': {
                  margin: '8px 0',
                },
              }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.1rem' }} />}
                sx={{
                  backgroundColor: 'white',
                  borderRadius: apiKeyExpanded ? '8px 8px 0 0' : '8px',
                }}
              >
                <Typography variant="body2">
                  OpenAI API Key
                </Typography>
              </AccordionSummary>
              <AccordionDetails
                sx={{
                  backgroundColor: 'white',
                  borderRadius: '0 0 8px 8px',
                  p: '0px 16px',
                }}
              >
                <SearchTextField
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  onEnterPress={handleApiKeyChange}
                  placeholder="Enter OpenAI API Key"
                  type="password"
                  submitIcon="save"
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

            <Box sx={{ 
              mt: 0,
              ...(isMobile ? {} : { 
                maxHeight: '260px', 
                overflowY: 'auto',
                '&::-webkit-scrollbar': {
                  width: '6px',
                },
                '&::-webkit-scrollbar-track': {
                  background: 'transparent',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#bbb',
                  borderRadius: '3px',
                  '&:hover': {
                    background: '#999',
                  },
                },
                // Firefox
                scrollbarWidth: 'thin',
                scrollbarColor: '#bbb transparent',
              })
            }}>
              <Accordion
                sx={{
                  backgroundColor: 'transparent',
                  boxShadow: 'none',
                  '&:before': {
                    display: 'none',
                  },
                  '& .MuiAccordionSummary-root': {
                    minHeight: '40px',
                    padding: '0 16px',
                  },
                  '& .MuiAccordionSummary-content': {
                    margin: '8px 0',
                  },
                }}
              >
                <AccordionSummary 
                  expandIcon={<ExpandMoreIcon sx={{ fontSize: '1.1rem' }} />}
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
                    p: 0,
                  }}
                >
                  <List dense>
                    {savedLists.map((list, index) => (
                      <ListItem
                        key={index}
                        dense
                        secondaryAction={
                          <IconButton edge="end" size="small" onClick={() => handleDeleteList(index)}>
                            <DeleteIcon sx={{ fontSize: '1.1rem' }} />
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
        </Box>

        {/* Bottom Row */}
        <Box sx={{ 
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          flex: 1
        }}>
          {/* Bottom Left: Map */}
          <Box sx={{ 
            position: 'relative',
            height: isMobile ? '400px' : '100%',
            flex: isMobile ? undefined : 1
          }}>
            <Map 
              markers={markers} 
              onMapLoad={handleMapLoad}
              onRemoveAll={() => setMarkers([])}
              onSaveList={() => setSaveDialogOpen(true)}
              onRemoveMarker={handleDelete}
              setMarkers={setMarkers}
              isLoadingList={isLoadingList}
              setIsLoadingList={setIsLoadingList}
            />
          </Box>

          {/* Bottom Right: Point Chips */}
          <Box sx={{
            width: isMobile ? '100%' : '400px',
            p: 2,
            bgcolor: 'background.paper',
            borderTop: isMobile ? 1 : 0,
            borderColor: 'divider'
          }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Selected Points ({markers.length})
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {markers.map((marker) => (
                <Chip
                  key={marker.id}
                  label={marker.name}
                  onDelete={() => handleDelete(marker.id)}
                  sx={{
                    height: 'auto',
                    padding: '4px 2px',
                    borderRadius: '6px',
                    backgroundColor: greyChipStyle.bg,
                    color: greyChipStyle.text,
                    transition: 'all 0.2s ease-in-out',
                    '& .MuiChip-label': {
                      display: 'block',
                      whiteSpace: 'normal',
                      textAlign: 'left',
                    },
                    '&:hover': {
                      backgroundColor: greyChipStyle.hover,
                    },
                  }}
                />
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Save Dialog */}
      <Dialog open={saveDialogOpen} onClose={() => {
        setSaveDialogOpen(false);
        setListName('');
      }}>
        <DialogTitle>
          {savedLists.some(list => list.name === listName)
            ? 'Update Points List' 
            : 'Save Current Points List'
          }
        </DialogTitle>
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
          <Button onClick={() => {
            setSaveDialogOpen(false);
            setListName('');
          }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSaveList} 
            disabled={!listName.trim()}
          >
            {savedLists.some(list => list.name === listName) ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
