# Map with Points of Interest App

This is a Next.js application that displays an interactive map where users can search for and display points of interest. The app provides a modern, user-friendly interface for exploring locations and their surrounding points of interest.

## Features
- 🗺️ Interactive Google Maps integration
- 🔍 Multiple ways to find places:
  - Natural language queries powered by OpenAI (e.g., "Best coffee shops in Vienna")
  - Direct place search (e.g., "Eiffel Tower Paris")
  - Text extraction to find locations in pasted content
- 📍 Display multiple POIs on the map simultaneously
- 💾 Save and load lists of points for later use
- 💫 Smooth animations and transitions
- 📱 Fully responsive design for mobile and desktop
- 🎨 Modern and clean UI with Material-UI components

## How to Use

### Finding Places
1. **Natural Language Search**: Enter queries like "Best coffee shops in Vienna" to find multiple related places
2. **Direct Place Search**: Search for specific places by name, e.g., "Eiffel Tower Paris"
3. **Text Extraction**: Paste any text containing location names, and the app will automatically find and mark them on the map

### Managing Places
- Save your current set of places as a named list
- Load previously saved lists
- Remove individual places or clear all places from the map
- View detailed information about each place including ratings, opening hours, and contact information

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (version 18.17 or higher)
- npm (comes with Node.js)
- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Geocoding API
- An OpenAI API key for natural language processing

## Setup

1. Clone the repository:
```bash
git clone <your-repo-url>
cd map-with-pois
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root directory and add your Google Maps API key:
```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
map-with-pois/
├── src/
│   ├── components/    # React components
│   │   ├── Map.js            # Main map component
│   │   ├── MapWrapper.js     # Map container wrapper
│   │   └── SearchTextField.js # Search input component
│   ├── pages/        # Next.js pages
│   │   ├── api/      # API routes
│   │   └── index.js  # Main page
│   ├── styles/       # CSS styles
│   └── utils/        # Utility functions
├── public/           # Static files
└── package.json      # Project dependencies
```

## Technologies Used
- **Next.js 14** - Modern React framework for production
- **React 18** - UI library
- **Google Maps JavaScript API** - Maps and location services
- **OpenAI API v4** - Natural language processing for POI queries
- **Material-UI v5** - UI component library

## Available Scripts

- `npm run dev` - Runs the app in development mode
- `npm run build` - Builds the app for production
- `npm start` - Runs the built app in production mode
- `npm run lint` - Runs ESLint for code quality

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details
