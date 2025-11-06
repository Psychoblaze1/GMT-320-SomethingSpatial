/**
 * useNarrativeTour Custom Hook
 * Manages state and logic for the 3D campus narrative tour
 * Handles localStorage, welcome dialog, and tour activation
 */

import { useState, useEffect, useCallback } from 'react';
import { TOUR_STORAGE_KEY } from '../data/tourNarration';

export default function useNarrativeTour(autoShowOnFirstVisit = true, delay = 500) {
  const [showWelcomeDialog, setShowWelcomeDialog] = useState(false);
  const [tourActive, setTourActive] = useState(false);
  const [tourSeen, setTourSeen] = useState(false);
  const [tourError, setTourError] = useState(null);

  /**
   * Check if tour has been seen before
   */
  useEffect(() => {
    const hasSeenTour = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
    setTourSeen(hasSeenTour);

    // Show welcome dialog automatically on first visit
    if (autoShowOnFirstVisit && !hasSeenTour) {
      const timer = setTimeout(() => {
        setShowWelcomeDialog(true);
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [autoShowOnFirstVisit, delay]);

  /**
   * Start the tour
   * @param {boolean} dontShowAgain - Save preference to not show welcome dialog again
   */
  const startTour = useCallback((dontShowAgain = false) => {
    setShowWelcomeDialog(false);
    setTourActive(true);
    setTourError(null);

    // Save preference if requested
    if (dontShowAgain) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setTourSeen(true);
    }
  }, []);

  /**
   * Skip/decline the tour
   * @param {boolean} dontShowAgain - Save preference to not show welcome dialog again
   */
  const skipTour = useCallback((dontShowAgain = false) => {
    setShowWelcomeDialog(false);

    // Save preference if requested
    if (dontShowAgain) {
      localStorage.setItem(TOUR_STORAGE_KEY, 'true');
      setTourSeen(true);
    }
  }, []);

  /**
   * Replay the tour (without showing welcome dialog)
   */
  const replayTour = useCallback(() => {
    setTourActive(true);
    setTourError(null);
  }, []);

  /**
   * Handle tour completion
   */
  const handleTourComplete = useCallback(() => {
    setTourActive(false);

    // Mark tour as seen
    localStorage.setItem(TOUR_STORAGE_KEY, 'true');
    setTourSeen(true);

    console.log('✅ Tour completed and marked as seen');
  }, []);

  /**
   * Handle tour error
   */
  const handleTourError = useCallback((error) => {
    setTourActive(false);
    setTourError(error);

    console.error('❌ Tour error:', error);
  }, []);

  /**
   * Reset tour (for testing purposes)
   */
  const resetTour = useCallback(() => {
    localStorage.removeItem(TOUR_STORAGE_KEY);
    setTourSeen(false);
    setTourActive(false);
    setShowWelcomeDialog(false);
    setTourError(null);

    console.log('🔄 Tour reset');
  }, []);

  /**
   * Manually show welcome dialog
   */
  const showWelcome = useCallback(() => {
    setShowWelcomeDialog(true);
  }, []);

  return {
    // State
    showWelcomeDialog,
    tourActive,
    tourSeen,
    tourError,

    // Actions
    startTour,
    skipTour,
    replayTour,
    handleTourComplete,
    handleTourError,
    resetTour,
    showWelcome
  };
}
