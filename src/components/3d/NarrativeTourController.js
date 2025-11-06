/**
 * Narrative Tour Controller Component - Simplified
 * Smooth camera orbit with continuous narration
 */

import React, { useEffect, useState, useRef, useCallback } from 'react';
import TourControlsOverlay from './TourControlsOverlay';
import audioNarrationService from '../../services/audioNarrationService';
import { TOUR_CAMERA_PATH, TOUR_DURATION } from '../../data/tourNarration';

export default function NarrativeTourController({
  isActive,
  cameraRef,
  controlsRef,
  onComplete,
  onError
}) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const animationFrameRef = useRef(null);
  const startTimeRef = useRef(null);

  /**
   * Smooth camera orbit animation
   */
  const animateCameraOrbit = useCallback(() => {
    if (!cameraRef.current || !controlsRef.current) return;

    const camera = cameraRef.current;
    const controls = controlsRef.current;
    const { orbitRadius, orbitHeight, orbitCenter, duration, orbitRotations } = TOUR_CAMERA_PATH;

    const animate = (timestamp) => {
      if (!startTimeRef.current) {
        startTimeRef.current = timestamp;
      }

      const elapsed = (timestamp - startTimeRef.current) / 1000; // Convert to seconds
      setCurrentTime(elapsed);

      if (elapsed >= duration) {
        // Tour complete
        setIsPlaying(false);
        if (onComplete) onComplete();
        return;
      }

      // Calculate camera position on circular orbit
      const progress = elapsed / duration;
      const angle = progress * Math.PI * 2 * orbitRotations; // Full rotation(s)

      // Circular orbit around center
      const x = orbitCenter.x + Math.cos(angle) * orbitRadius;
      const z = orbitCenter.z + Math.sin(angle) * orbitRadius;
      const y = orbitHeight;

      camera.position.set(x, y, z);
      controls.target.set(orbitCenter.x, orbitCenter.y, orbitCenter.z);
      controls.update();

      // Continue animation
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Start animation loop
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [cameraRef, controlsRef, onComplete]);

  /**
   * Handle audio time updates
   */
  const handleTimeUpdate = useCallback((time) => {
    // Just update the time display - camera animates independently
    setCurrentTime(time);
  }, []);

  /**
   * Handle tour completion
   */
  const handleTourComplete = useCallback(() => {
    console.log('✅ Tour completed');
    setIsPlaying(false);
    setCurrentTime(TOUR_DURATION);

    // Cancel camera animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  /**
   * Handle tour error
   */
  const handleTourError = useCallback((error) => {
    console.error('❌ Tour error:', error);
    setIsPlaying(false);

    // Cancel camera animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (onError) {
      onError(error);
    }
  }, [onError]);

  /**
   * Start the tour
   */
  const startTour = useCallback(async () => {
    console.log('🎬 Starting simplified narrative tour...');

    if (!cameraRef.current || !controlsRef.current) {
      console.error('❌ Camera or controls not available');
      return;
    }

    setIsPlaying(true);
    startTimeRef.current = null;

    try {
      // Start audio narration (continuous, no segments)
      console.log('🎵 Starting audio narration...');
      const success = await audioNarrationService.playTourNarration(
        handleTimeUpdate,
        handleTourComplete,
        handleTourError
      );

      if (!success) {
        throw new Error('Failed to start audio narration');
      }

      // Start smooth camera orbit animation
      console.log('📹 Starting smooth camera orbit...');
      animateCameraOrbit();

    } catch (error) {
      console.error('❌ Failed to start tour:', error);
      setIsPlaying(false);
      if (onError) {
        onError(error);
      }
    }
  }, [cameraRef, controlsRef, onError, handleTimeUpdate, handleTourComplete, handleTourError, animateCameraOrbit]);

  /**
   * Close/stop the tour
   */
  const handleClose = useCallback(() => {
    console.log('🛑 Closing tour...');
    audioNarrationService.stop();
    setIsPlaying(false);
    setCurrentTime(0);
    startTimeRef.current = null;

    // Cancel camera animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (onComplete) {
      onComplete();
    }
  }, [onComplete]);

  /**
   * Start tour when activated
   */
  useEffect(() => {
    if (isActive && !isPlaying) {
      startTour();
    }

    // Cleanup on unmount or deactivation
    return () => {
      if (isPlaying) {
        audioNarrationService.stop();
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      }
    };
  }, [isActive, isPlaying, startTour]);

  // Don't render anything if not active
  if (!isActive) {
    return null;
  }

  return (
    <TourControlsOverlay
      currentTime={currentTime}
      isPlaying={isPlaying}
      onClose={handleClose}
      autoHide={true}
    />
  );
}
