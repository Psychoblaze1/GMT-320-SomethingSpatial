# Campus Sustainability Dashboard

A spatial web application for monitoring and analyzing campus sustainability metrics including solar potential, green spaces, waste management, and water conservation.

## Quick Start

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

The app will open at [http://localhost:3000](http://localhost:3000)

### Demo Login

**Email:** `Demo@somethingspatial.com`
**Password:** `Demopassword`

## Features

- **3D Campus Viewer** - Interactive 3D model with day/night modes
- **2D Map Analysis** - Solar potential and green space analysis using Google Solar API
- **Dashboard** - Real-time sustainability metrics and charts
- **Data Management** - Admin tools for editing campus data

## Tech Stack

- React + Material-UI
- Three.js / React Three Fiber
- Deck.gl for 2D mapping
- Firebase (Authentication & Database)
- Google Solar API
```

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── 3d/             # Three.js 3D viewer components
│   ├── admin/          # Admin management tools
│   ├── auth/           # Authentication components
│   ├── layout/         # Layout components
│   └── map/            # Map analysis panels
├── contexts/           # React contexts (Auth)entication)
├── pages/              # Main application pages
│   ├── Dashboard.js    # Sustainability metrics dashboard
│   ├── MapViewer.js    # 3D campus viewer
│   ├── Map2D.js        # 2D map with analysis tools
│   ├── Admin.js        # Admin panel
│   └── admin/          # Admin sub-pages
├── services/           # API services and data
└── theme.js            # Material-UI theme
```

## Available Scripts

- `npm start` - Run development server
- `npm build` - Build for production
- `npm test` - Run tests
- `npm eject` - Eject from Create React App (one-way operation)

