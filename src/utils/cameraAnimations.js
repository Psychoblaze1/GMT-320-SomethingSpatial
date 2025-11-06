/**
 * Camera Animation Utilities for 3D Campus Tour
 * Provides smooth camera movements and transitions
 */

import * as THREE from 'three';
import { CAMERA_ANIMATION } from '../data/tourNarration';

/**
 * Easing functions for smooth animations
 */
export const Easing = {
  // Cubic ease in-out (default)
  easeInOutCubic: (t) => {
    return t < 0.5
      ? 4 * t * t * t
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
  },

  // Quadratic ease in-out
  easeInOutQuad: (t) => {
    return t < 0.5
      ? 2 * t * t
      : 1 - Math.pow(-2 * t + 2, 2) / 2;
  },

  // Smooth start and end
  smoothstep: (t) => {
    return t * t * (3 - 2 * t);
  },

  // Linear (no easing)
  linear: (t) => t
};

/**
 * Animate camera to a specific position and look-at target
 * @param {THREE.Camera} camera - Three.js camera instance
 * @param {Object} controls - OrbitControls instance
 * @param {Object} targetPosition - {x, y, z} target camera position
 * @param {Object} targetLookAt - {x, y, z} target look-at point
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} onUpdate - Optional callback fired each frame
 * @param {Function} onComplete - Optional callback fired when complete
 * @returns {Function} Cancel function to stop animation
 */
export function animateCameraTo(
  camera,
  controls,
  targetPosition,
  targetLookAt,
  duration = CAMERA_ANIMATION.duration,
  onUpdate = null,
  onComplete = null
) {
  // Store initial values
  const initialPosition = camera.position.clone();
  const initialTarget = controls.target.clone();

  // Create target vectors
  const finalPosition = new THREE.Vector3(
    targetPosition.x,
    targetPosition.y,
    targetPosition.z
  );
  const finalLookAt = new THREE.Vector3(
    targetLookAt.x,
    targetLookAt.y,
    targetLookAt.z
  );

  const startTime = Date.now();
  let cancelled = false;
  let animationFrameId = null;

  const animate = () => {
    if (cancelled) return;

    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);

    // Apply easing
    const easedProgress = Easing[CAMERA_ANIMATION.easing]
      ? Easing[CAMERA_ANIMATION.easing](progress)
      : Easing.easeInOutCubic(progress);

    // Interpolate camera position and target
    camera.position.lerpVectors(initialPosition, finalPosition, easedProgress);
    controls.target.lerpVectors(initialTarget, finalLookAt, easedProgress);
    controls.update();

    // Fire update callback
    if (onUpdate) {
      onUpdate(progress, easedProgress);
    }

    // Continue animation or complete
    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  // Start animation
  animate();

  // Return cancel function
  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Fly camera to focus on a specific building
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {THREE.Mesh} buildingMesh
 * @param {number} duration
 * @param {Function} onComplete
 * @returns {Function} Cancel function
 */
export function flyToBuilding(
  camera,
  controls,
  buildingMesh,
  duration = CAMERA_ANIMATION.duration,
  onComplete = null
) {
  // Calculate bounding box and center
  const box = new THREE.Box3().setFromObject(buildingMesh);
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Calculate optimal camera distance
  const fov = camera.fov * (Math.PI / 180);
  const cameraDistance = Math.abs(maxDim / Math.sin(fov / 2)) * 2.5;

  // Position camera at an angle
  const targetPosition = {
    x: center.x + cameraDistance * 0.6,
    y: center.y + cameraDistance * 0.8,
    z: center.z + cameraDistance * 0.6
  };

  const targetLookAt = {
    x: center.x,
    y: center.y,
    z: center.z
  };

  return animateCameraTo(
    camera,
    controls,
    targetPosition,
    targetLookAt,
    duration,
    null,
    onComplete
  );
}

/**
 * Orbit camera around a specific point
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {Object} centerPoint - {x, y, z}
 * @param {number} radius - Orbit radius
 * @param {number} duration - Full orbit duration in milliseconds
 * @param {number} height - Camera height above center point
 * @param {Function} onUpdate
 * @returns {Function} Cancel function
 */
export function orbitAroundPoint(
  camera,
  controls,
  centerPoint,
  radius,
  duration,
  height = 50,
  onUpdate = null
) {
  const center = new THREE.Vector3(centerPoint.x, centerPoint.y, centerPoint.z);
  const startTime = Date.now();
  let cancelled = false;
  let animationFrameId = null;

  const animate = () => {
    if (cancelled) return;

    const elapsedTime = Date.now() - startTime;
    const progress = (elapsedTime % duration) / duration; // Loop forever
    const angle = progress * Math.PI * 2;

    // Calculate orbital position
    const x = center.x + Math.cos(angle) * radius;
    const z = center.z + Math.sin(angle) * radius;
    const y = center.y + height;

    camera.position.set(x, y, z);
    controls.target.copy(center);
    controls.update();

    if (onUpdate) {
      onUpdate(progress);
    }

    animationFrameId = requestAnimationFrame(animate);
  };

  animate();

  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Zoom camera to a specific distance from target
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {number} targetDistance
 * @param {number} duration
 * @param {Function} onComplete
 * @returns {Function} Cancel function
 */
export function zoomToDistance(
  camera,
  controls,
  targetDistance,
  duration = CAMERA_ANIMATION.duration,
  onComplete = null
) {
  const initialPosition = camera.position.clone();
  const target = controls.target.clone();

  // Calculate direction vector
  const direction = initialPosition.clone().sub(target).normalize();
  const finalPosition = target.clone().add(direction.multiplyScalar(targetDistance));

  return animateCameraTo(
    camera,
    controls,
    {
      x: finalPosition.x,
      y: finalPosition.y,
      z: finalPosition.z
    },
    {
      x: target.x,
      y: target.y,
      z: target.z
    },
    duration,
    null,
    onComplete
  );
}

/**
 * Smooth pan camera to new look-at position (keep camera position same)
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {Object} newLookAt - {x, y, z}
 * @param {number} duration
 * @param {Function} onComplete
 * @returns {Function} Cancel function
 */
export function panCameraTo(
  camera,
  controls,
  newLookAt,
  duration = CAMERA_ANIMATION.duration,
  onComplete = null
) {
  const initialTarget = controls.target.clone();
  const finalTarget = new THREE.Vector3(newLookAt.x, newLookAt.y, newLookAt.z);

  const startTime = Date.now();
  let cancelled = false;
  let animationFrameId = null;

  const animate = () => {
    if (cancelled) return;

    const elapsedTime = Date.now() - startTime;
    const progress = Math.min(elapsedTime / duration, 1);
    const easedProgress = Easing.easeInOutCubic(progress);

    controls.target.lerpVectors(initialTarget, finalTarget, easedProgress);
    controls.update();

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(animate);
    } else {
      if (onComplete) {
        onComplete();
      }
    }
  };

  animate();

  return () => {
    cancelled = true;
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
    }
  };
}

/**
 * Create a smooth camera path through multiple waypoints
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {Array} waypoints - Array of {position: {x,y,z}, lookAt: {x,y,z}, duration: number}
 * @param {Function} onWaypointReached
 * @param {Function} onComplete
 * @returns {Function} Cancel function
 */
export function followCameraPath(
  camera,
  controls,
  waypoints,
  onWaypointReached = null,
  onComplete = null
) {
  let currentWaypointIndex = 0;
  let currentAnimation = null;
  let cancelled = false;

  const animateToNextWaypoint = () => {
    if (cancelled || currentWaypointIndex >= waypoints.length) {
      if (onComplete && !cancelled) {
        onComplete();
      }
      return;
    }

    const waypoint = waypoints[currentWaypointIndex];

    currentAnimation = animateCameraTo(
      camera,
      controls,
      waypoint.position,
      waypoint.lookAt,
      waypoint.duration || CAMERA_ANIMATION.duration,
      null,
      () => {
        // Waypoint reached
        if (onWaypointReached) {
          onWaypointReached(currentWaypointIndex, waypoint);
        }

        currentWaypointIndex++;
        // Move to next waypoint
        animateToNextWaypoint();
      }
    );
  };

  // Start the path
  animateToNextWaypoint();

  // Return cancel function
  return () => {
    cancelled = true;
    if (currentAnimation) {
      currentAnimation(); // Cancel current animation
    }
  };
}

/**
 * Reset camera to default overview position
 * @param {THREE.Camera} camera
 * @param {Object} controls
 * @param {Object} defaultPosition - {x, y, z}
 * @param {Object} defaultLookAt - {x, y, z}
 * @param {number} duration
 * @param {Function} onComplete
 * @returns {Function} Cancel function
 */
export function resetCamera(
  camera,
  controls,
  defaultPosition = { x: -150, y: 120, z: 150 },
  defaultLookAt = { x: 0, y: 0, z: 0 },
  duration = CAMERA_ANIMATION.duration,
  onComplete = null
) {
  return animateCameraTo(
    camera,
    controls,
    defaultPosition,
    defaultLookAt,
    duration,
    null,
    onComplete
  );
}

export default {
  animateCameraTo,
  flyToBuilding,
  orbitAroundPoint,
  zoomToDistance,
  panCameraTo,
  followCameraPath,
  resetCamera,
  Easing
};
