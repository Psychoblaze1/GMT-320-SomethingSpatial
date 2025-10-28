// This file is kept for backwards compatibility but is no longer actively used
// The main 3D viewer has been moved to ModelExperience.js and SimpleModelViewer.js

import React from 'react';
import SimpleModelViewer from './SimpleModelViewer';

// Re-export SimpleModelViewer as CampusModelViewer for compatibility
export default function CampusModelViewer(props) {
  return <SimpleModelViewer {...props} />;
}
