/**
 * Audio Narration Service - Simplified
 * Single continuous narration playback
 * Uses ElevenLabs API with Web Speech API fallback
 */

import { Howl } from 'howler';
import { AUDIO_CONFIG, TOUR_NARRATION } from '../data/tourNarration';

class AudioNarrationService {
  constructor() {
    this.howlInstance = null;
    this.isPlaying = false;
    this.audioCache = null; // Cache single audio file
    this.timeUpdateCallbacks = [];
    this.endCallbacks = [];
    this.errorCallbacks = [];
    this.apiKey = process.env.REACT_APP_ELEVENLABS_API_KEY;
  }

  /**
   * Initialize and play the complete tour narration
   * @param {Function} onTimeUpdate - Callback fired with current time
   * @param {Function} onEnd - Callback fired when audio completes
   * @param {Function} onError - Callback fired if audio fails
   * @returns {Promise<boolean>} Success status
   */
  async playTourNarration(onTimeUpdate, onEnd, onError) {
    try {
      // Register callbacks
      if (onTimeUpdate) this.timeUpdateCallbacks.push(onTimeUpdate);
      if (onEnd) this.endCallbacks.push(onEnd);
      if (onError) this.errorCallbacks.push(onError);

      // Try ElevenLabs first
      if (this.apiKey) {
        console.log('🎙️ Attempting to use ElevenLabs TTS...');
        const success = await this.playWithElevenLabs();
        if (success) return true;
      }

      // Fallback to Web Speech API
      console.log('🔊 Falling back to Web Speech API...');
      return await this.playWithWebSpeech();

    } catch (error) {
      console.error('❌ Audio narration failed:', error);
      this.triggerErrorCallbacks(error);
      return false;
    }
  }

  /**
   * Play narration using ElevenLabs API (single continuous audio)
   * @returns {Promise<boolean>}
   */
  async playWithElevenLabs() {
    try {
      console.log('🎙️ Generating ElevenLabs audio...');

      let audioBlob;
      if (this.audioCache) {
        console.log('✅ Using cached audio');
        audioBlob = this.audioCache;
      } else {
        console.log('🎙️ Generating audio from ElevenLabs...');

        // Call ElevenLabs API for complete narration
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${AUDIO_CONFIG.elevenlabs.voiceId}`,
          {
            method: 'POST',
            headers: {
              'Accept': 'audio/mpeg',
              'Content-Type': 'application/json',
              'xi-api-key': this.apiKey
            },
            body: JSON.stringify({
              text: TOUR_NARRATION,
              model_id: AUDIO_CONFIG.elevenlabs.model,
              voice_settings: {
                stability: AUDIO_CONFIG.elevenlabs.stability,
                similarity_boost: AUDIO_CONFIG.elevenlabs.similarityBoost,
                style: AUDIO_CONFIG.elevenlabs.style,
                use_speaker_boost: AUDIO_CONFIG.elevenlabs.useSpeakerBoost
              }
            })
          }
        );

        if (!response.ok) {
          throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        audioBlob = await response.blob();
        this.audioCache = audioBlob;
        console.log('✅ Audio generated');
      }

      return this.playAudioFile(audioBlob);

    } catch (error) {
      console.error('❌ ElevenLabs TTS failed:', error);
      return false;
    }
  }

  /**
   * Play single audio file
   * @param {Blob} audioBlob
   * @returns {Promise<boolean>}
   */
  async playAudioFile(audioBlob) {
    return new Promise((resolve, reject) => {
      const audioUrl = URL.createObjectURL(audioBlob);

      console.log('🎵 Playing audio...');

      // Create Howl instance
      const howl = new Howl({
        src: [audioUrl],
        format: ['mp3'],
        volume: AUDIO_CONFIG.volume,
        onload: () => {
          console.log(`✅ Audio loaded. Duration: ${howl.duration()}s`);
        },
        onplay: () => {
          this.isPlaying = true;
          this.howlInstance = howl;
          this.startTimeTracking();
          console.log('🎤 Audio started');
        },
        onend: () => {
          console.log('✅ Audio complete');
          this.stopTimeTracking();
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
          this.triggerEndCallbacks();
          resolve(true);
        },
        onstop: () => {
          console.log('⏸️ Audio stopped');
          this.stopTimeTracking();
          URL.revokeObjectURL(audioUrl);
          this.isPlaying = false;
        },
        onerror: (id, error) => {
          console.error('❌ Howler playback error:', error);
          URL.revokeObjectURL(audioUrl);
          this.triggerErrorCallbacks(error);
          reject(error);
        }
      });

      howl.play();
    });
  }

  /**
   * Play narration using Web Speech API fallback
   * @returns {Promise<boolean>}
   */
  async playWithWebSpeech() {
    return new Promise((resolve, reject) => {
      // Check if Web Speech API is available
      if (!('speechSynthesis' in window)) {
        console.error('❌ Web Speech API not available');
        reject(new Error('Web Speech API not supported'));
        return;
      }

      try {
        this.isPlaying = true;
        const startTime = Date.now();

        // Start manual time tracking for Web Speech API
        this.timeTrackingInterval = setInterval(() => {
          if (this.isPlaying) {
            const elapsed = (Date.now() - startTime) / 1000;
            this.triggerTimeUpdateCallbacks(elapsed);
          }
        }, 100);

        // Create single utterance for full narration
        const utterance = new SpeechSynthesisUtterance(TOUR_NARRATION);
        utterance.lang = AUDIO_CONFIG.webSpeech.lang;
        utterance.rate = AUDIO_CONFIG.webSpeech.rate;
        utterance.pitch = AUDIO_CONFIG.webSpeech.pitch;
        utterance.volume = AUDIO_CONFIG.webSpeech.volume;

        utterance.onstart = () => {
          this.isPlaying = true;
          console.log('🎤 Speaking narration...');
        };

        utterance.onend = () => {
          console.log('✅ Narration complete');
          this.isPlaying = false;
          this.stopTimeTracking();
          this.triggerEndCallbacks();
          resolve(true);
        };

        utterance.onerror = (event) => {
          console.error('❌ Speech synthesis error:', event);
          this.isPlaying = false;
          this.stopTimeTracking();
          this.triggerErrorCallbacks(event.error);
          reject(event.error);
        };

        // Speak the narration
        window.speechSynthesis.speak(utterance);
        console.log('✅ Web Speech API narration started');

      } catch (error) {
        console.error('❌ Web Speech API failed:', error);
        this.stopTimeTracking();
        reject(error);
      }
    });
  }

  /**
   * Start tracking audio time for segment synchronization
   */
  startTimeTracking() {
    this.timeTrackingInterval = setInterval(() => {
      if (this.howlInstance && this.isPlaying) {
        const currentTime = this.howlInstance.seek();
        this.triggerTimeUpdateCallbacks(currentTime);
      }
    }, 100); // Update every 100ms
  }

  /**
   * Stop time tracking
   */
  stopTimeTracking() {
    if (this.timeTrackingInterval) {
      clearInterval(this.timeTrackingInterval);
      this.timeTrackingInterval = null;
    }
  }

  /**
   * Pause narration playback
   */
  pause() {
    if (this.howlInstance && this.isPlaying) {
      this.howlInstance.pause();
      this.isPlaying = false;
      this.stopTimeTracking();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Resume narration playback
   */
  resume() {
    if (this.howlInstance) {
      this.howlInstance.play();
      this.isPlaying = true;
      this.startTimeTracking();
    } else if (window.speechSynthesis) {
      window.speechSynthesis.resume();
      this.isPlaying = true;
    }
  }

  /**
   * Stop narration playback
   */
  stop() {
    console.log('🛑 Stopping audio playback...');

    if (this.howlInstance) {
      this.howlInstance.stop();
      this.howlInstance.unload();
      this.howlInstance = null;
    } else if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    this.isPlaying = false;
    this.stopTimeTracking();
  }


  /**
   * Set playback volume (0-1)
   * @param {number} volume
   */
  setVolume(volume) {
    if (this.howlInstance) {
      this.howlInstance.volume(volume);
    }
    // Web Speech API doesn't support runtime volume changes
  }

  /**
   * Get current playback time
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    if (this.howlInstance && this.isPlaying) {
      return this.howlInstance.seek();
    }
    return 0;
  }

  /**
   * Check if currently playing
   * @returns {boolean}
   */
  getIsPlaying() {
    return this.isPlaying;
  }

  /**
   * Trigger time update callbacks
   * @param {number} currentTime
   */
  triggerTimeUpdateCallbacks(currentTime) {
    this.timeUpdateCallbacks.forEach(callback => {
      try {
        callback(currentTime);
      } catch (error) {
        console.error('Time update callback error:', error);
      }
    });
  }

  /**
   * Trigger end callbacks
   */
  triggerEndCallbacks() {
    this.endCallbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.error('End callback error:', error);
      }
    });
  }

  /**
   * Trigger error callbacks
   * @param {Error} error
   */
  triggerErrorCallbacks(error) {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (err) {
        console.error('Error callback error:', err);
      }
    });
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks() {
    this.timeUpdateCallbacks = [];
    this.endCallbacks = [];
    this.errorCallbacks = [];
  }

  /**
   * Clean up resources
   */
  cleanup() {
    this.stop();
    this.clearCallbacks();
    this.audioCache = null;
  }
}

// Export singleton instance
const audioNarrationService = new AudioNarrationService();
export default audioNarrationService;
