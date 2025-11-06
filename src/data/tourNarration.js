/**
 * 3D Campus Tour Narration Script - Simplified
 * Duration: ~60 seconds
 * Smooth camera orbit with continuous narration
 */

// Single continuous narration that flows naturally
export const TOUR_NARRATION = "Welcome to the University of Pretoria Campus Sustainability Dashboard. This interactive 3D model showcases our commitment to UN Sustainable Development Goal 11: Sustainable Cities and Communities. Our campus has 1,875 kilowatts of solar energy potential across building rooftops. Currently, we've installed 150 kilowatts, with plans to expand renewable energy infrastructure. 23,000 square meters of green space cover our campus, featuring 262 trees that offset 73 tons of carbon dioxide annually. That's equivalent to taking 15 cars off the road each year. Water conservation is a priority. Our buildings have the capacity to collect 7.5 million liters of rainwater annually, reducing strain on municipal water supplies and promoting sustainable resource management. Eight smart waste management bins are strategically placed across campus for recycling, composting, and general waste. Real-time monitoring ensures efficient collection and reduces environmental impact. Click on any building or bin to explore detailed sustainability metrics. Together, we're building a greener, more sustainable future for our campus community.";

// Smooth camera orbit path - single continuous motion
export const TOUR_CAMERA_PATH = {
  // Starting position - high overview
  startPosition: { x: -150, y: 120, z: 150 },
  startLookAt: { x: 0, y: 20, z: 0 },

  // Orbit parameters for smooth circular motion
  orbitRadius: 180,
  orbitHeight: 100,
  orbitCenter: { x: 0, y: 20, z: 0 },

  // Complete one full orbit during the tour
  orbitRotations: 1.0,

  // Duration in seconds
  duration: 60
};

// Total tour duration in seconds
export const TOUR_DURATION = 60;

// SDG 11 Information for Welcome Dialog
export const SDG_11_INFO = {
  title: 'SDG 11: Sustainable Cities and Communities',
  description: 'Make cities and human settlements inclusive, safe, resilient and sustainable',
  campusAlignment: [
    'Reducing environmental impact through solar energy',
    'Providing access to safe, inclusive green spaces',
    'Implementing sustainable waste management systems',
    'Conserving water resources through rainwater harvesting',
    'Monitoring and optimizing resource efficiency'
  ],
  icon: '🏙️',
  color: '#FD9D24' // Official SDG 11 orange color
};

// Welcome dialog content
export const WELCOME_DIALOG_CONTENT = {
  title: 'Welcome to the 3D Campus Tour',
  subtitle: 'Discover Our Sustainability Journey',
  features: [
    'Solar energy potential and installations',
    'Green spaces and carbon offset initiatives',
    'Rainwater harvesting systems',
    'Smart waste management infrastructure',
    'SDG 11 alignment and achievements'
  ],
  duration: '~ 1 minute',
  buttonText: 'Start Tour',
  skipText: 'Maybe Later',
  checkboxLabel: "Don't show this tour again"
};

// Audio narration settings
export const AUDIO_CONFIG = {
  // ElevenLabs settings
  elevenlabs: {
    voiceId: 'EXAVITQu4vr4xnSDxMaL', // Sarah - Professional female voice
    model: 'eleven_multilingual_v2',
    stability: 0.5,
    similarityBoost: 0.75,
    style: 0.0,
    useSpeakerBoost: true
  },
  // Web Speech API fallback settings
  webSpeech: {
    lang: 'en-US',
    rate: 0.9, // Slightly slower for clarity
    pitch: 1.0,
    volume: 1.0
  },
  // General audio settings
  fadeInDuration: 500, // ms
  fadeOutDuration: 500, // ms
  volume: 0.8
};

// Camera animation settings
export const CAMERA_ANIMATION = {
  duration: 2000, // ms per camera movement
  easing: 'easeInOutCubic',
  enableRotation: true,
  rotationSpeed: 0.0005,
  minDistance: 50,
  maxDistance: 300,
  smoothingFactor: 0.1
};

// Visual highlight settings
export const VISUAL_EFFECTS = {
  buildingFlash: {
    color: 0x4caf50, // Green
    duration: 1500,
    pulseCount: 2,
    intensity: 1.5
  },
  binGlow: {
    color: 0x2196f3, // Blue
    duration: 2000,
    pulseCount: 3,
    intensity: 2.0
  },
  infoMarker: {
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    textColor: '#ffffff',
    fontSize: '14px',
    padding: '8px 12px',
    borderRadius: '4px',
    displayDuration: 3000
  }
};

// LocalStorage key for tracking tour completion
export const TOUR_STORAGE_KEY = 'campusSustainability_3dTourCompleted';

export default {
  TOUR_NARRATION,
  TOUR_CAMERA_PATH,
  TOUR_DURATION,
  SDG_11_INFO,
  WELCOME_DIALOG_CONTENT,
  AUDIO_CONFIG,
  CAMERA_ANIMATION,
  VISUAL_EFFECTS,
  TOUR_STORAGE_KEY
};
