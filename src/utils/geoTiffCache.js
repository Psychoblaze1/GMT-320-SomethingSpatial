/**
 * IndexedDB caching utility for Solar API GeoTIFF data
 * Caches both dataLayers responses and downloaded GeoTIFF binary data
 */

const DB_NAME = 'SolarGeoTiffCache';
const DB_VERSION = 1;
const DATA_LAYERS_STORE = 'dataLayers';
const GEOTIFF_STORE = 'geoTiffData';

// Cache TTL: 30 days (solar imagery doesn't change frequently)
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

class GeoTiffCache {
  constructor() {
    this.db = null;
    this.initPromise = this.initDB();
  }

  /**
   * Initialize IndexedDB database
   */
  async initDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Store for dataLayers API responses
        if (!db.objectStoreNames.contains(DATA_LAYERS_STORE)) {
          const dataLayersStore = db.createObjectStore(DATA_LAYERS_STORE, { keyPath: 'key' });
          dataLayersStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Store for downloaded GeoTIFF binary data
        if (!db.objectStoreNames.contains(GEOTIFF_STORE)) {
          const geoTiffStore = db.createObjectStore(GEOTIFF_STORE, { keyPath: 'url' });
          geoTiffStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  /**
   * Generate a cache key from latitude and longitude
   */
  generateLocationKey(lat, lng, radiusMeters = 50) {
    // Round to 6 decimal places (~0.1m precision) to enable cache hits for nearby locations
    const roundedLat = Math.round(lat * 1000000) / 1000000;
    const roundedLng = Math.round(lng * 1000000) / 1000000;
    return `${roundedLat},${roundedLng},${radiusMeters}`;
  }

  /**
   * Get cached dataLayers response
   */
  async getDataLayers(lat, lng, radiusMeters = 50) {
    try {
      await this.initPromise;
      if (!this.db) return null;

      const key = this.generateLocationKey(lat, lng, radiusMeters);

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([DATA_LAYERS_STORE], 'readonly');
        const store = transaction.objectStore(DATA_LAYERS_STORE);
        const request = store.get(key);

        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            resolve(null);
            return;
          }

          // Check if cache has expired
          const age = Date.now() - result.timestamp;
          if (age > CACHE_TTL_MS) {
            console.log('DataLayers cache expired for', key);
            // Clean up expired entry
            this.deleteDataLayers(lat, lng, radiusMeters);
            resolve(null);
            return;
          }

          console.log('DataLayers cache hit for', key, `(age: ${Math.round(age / (24 * 60 * 60 * 1000))} days)`);
          resolve(result.data);
        };

        request.onerror = () => {
          console.error('Error reading from cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error accessing dataLayers cache:', error);
      return null;
    }
  }

  /**
   * Cache dataLayers response
   */
  async setDataLayers(lat, lng, radiusMeters, data) {
    try {
      await this.initPromise;
      if (!this.db) return false;

      const key = this.generateLocationKey(lat, lng, radiusMeters);

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([DATA_LAYERS_STORE], 'readwrite');
        const store = transaction.objectStore(DATA_LAYERS_STORE);

        const cacheEntry = {
          key,
          data,
          timestamp: Date.now()
        };

        const request = store.put(cacheEntry);

        request.onsuccess = () => {
          console.log('Cached dataLayers for', key);
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error caching dataLayers:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error setting dataLayers cache:', error);
      return false;
    }
  }

  /**
   * Delete cached dataLayers entry
   */
  async deleteDataLayers(lat, lng, radiusMeters = 50) {
    try {
      await this.initPromise;
      if (!this.db) return;

      const key = this.generateLocationKey(lat, lng, radiusMeters);

      return new Promise((resolve) => {
        const transaction = this.db.transaction([DATA_LAYERS_STORE], 'readwrite');
        const store = transaction.objectStore(DATA_LAYERS_STORE);
        const request = store.delete(key);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error deleting dataLayers cache:', error);
      return false;
    }
  }

  /**
   * Get cached GeoTIFF binary data
   */
  async getGeoTiff(url) {
    try {
      await this.initPromise;
      if (!this.db) return null;

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([GEOTIFF_STORE], 'readonly');
        const store = transaction.objectStore(GEOTIFF_STORE);
        const request = store.get(url);

        request.onsuccess = () => {
          const result = request.result;

          if (!result) {
            resolve(null);
            return;
          }

          // Check if cache has expired
          const age = Date.now() - result.timestamp;
          if (age > CACHE_TTL_MS) {
            console.log('GeoTIFF cache expired for', url.substring(0, 80) + '...');
            // Clean up expired entry
            this.deleteGeoTiff(url);
            resolve(null);
            return;
          }

          console.log('GeoTIFF cache hit for', url.substring(0, 80) + '...');
          resolve(result.data);
        };

        request.onerror = () => {
          console.error('Error reading GeoTIFF from cache:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error accessing GeoTIFF cache:', error);
      return null;
    }
  }

  /**
   * Cache GeoTIFF binary data
   */
  async setGeoTiff(url, arrayBuffer) {
    try {
      await this.initPromise;
      if (!this.db) return false;

      return new Promise((resolve, reject) => {
        const transaction = this.db.transaction([GEOTIFF_STORE], 'readwrite');
        const store = transaction.objectStore(GEOTIFF_STORE);

        const cacheEntry = {
          url,
          data: arrayBuffer,
          timestamp: Date.now()
        };

        const request = store.put(cacheEntry);

        request.onsuccess = () => {
          console.log('Cached GeoTIFF data for', url.substring(0, 80) + '...');
          resolve(true);
        };

        request.onerror = () => {
          console.error('Error caching GeoTIFF:', request.error);
          reject(request.error);
        };
      });
    } catch (error) {
      console.error('Error setting GeoTIFF cache:', error);
      return false;
    }
  }

  /**
   * Delete cached GeoTIFF entry
   */
  async deleteGeoTiff(url) {
    try {
      await this.initPromise;
      if (!this.db) return;

      return new Promise((resolve) => {
        const transaction = this.db.transaction([GEOTIFF_STORE], 'readwrite');
        const store = transaction.objectStore(GEOTIFF_STORE);
        const request = store.delete(url);

        request.onsuccess = () => resolve(true);
        request.onerror = () => resolve(false);
      });
    } catch (error) {
      console.error('Error deleting GeoTIFF cache:', error);
      return false;
    }
  }

  /**
   * Clear all expired cache entries
   */
  async clearExpiredEntries() {
    try {
      await this.initPromise;
      if (!this.db) return;

      const now = Date.now();
      const stores = [DATA_LAYERS_STORE, GEOTIFF_STORE];

      for (const storeName of stores) {
        await new Promise((resolve) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const index = store.index('timestamp');
          const request = index.openCursor();

          let deletedCount = 0;

          request.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
              const age = now - cursor.value.timestamp;
              if (age > CACHE_TTL_MS) {
                cursor.delete();
                deletedCount++;
              }
              cursor.continue();
            } else {
              if (deletedCount > 0) {
                console.log(`Cleared ${deletedCount} expired entries from ${storeName}`);
              }
              resolve();
            }
          };

          request.onerror = () => resolve();
        });
      }
    } catch (error) {
      console.error('Error clearing expired entries:', error);
    }
  }

  /**
   * Clear all cache data
   */
  async clearAll() {
    try {
      await this.initPromise;
      if (!this.db) return;

      const stores = [DATA_LAYERS_STORE, GEOTIFF_STORE];

      for (const storeName of stores) {
        await new Promise((resolve) => {
          const transaction = this.db.transaction([storeName], 'readwrite');
          const store = transaction.objectStore(storeName);
          const request = store.clear();

          request.onsuccess = () => {
            console.log(`Cleared all entries from ${storeName}`);
            resolve();
          };

          request.onerror = () => resolve();
        });
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      await this.initPromise;
      if (!this.db) return null;

      const stats = {
        dataLayers: { count: 0, totalSize: 0 },
        geoTiff: { count: 0, totalSize: 0 }
      };

      // Count dataLayers entries
      await new Promise((resolve) => {
        const transaction = this.db.transaction([DATA_LAYERS_STORE], 'readonly');
        const store = transaction.objectStore(DATA_LAYERS_STORE);
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            stats.dataLayers.count++;
            stats.dataLayers.totalSize += JSON.stringify(cursor.value.data).length;
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      });

      // Count GeoTIFF entries
      await new Promise((resolve) => {
        const transaction = this.db.transaction([GEOTIFF_STORE], 'readonly');
        const store = transaction.objectStore(GEOTIFF_STORE);
        const request = store.openCursor();

        request.onsuccess = (event) => {
          const cursor = event.target.result;
          if (cursor) {
            stats.geoTiff.count++;
            stats.geoTiff.totalSize += cursor.value.data.byteLength;
            cursor.continue();
          } else {
            resolve();
          }
        };

        request.onerror = () => resolve();
      });

      return stats;
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return null;
    }
  }
}

// Export singleton instance
export const geoTiffCache = new GeoTiffCache();

// Periodically clean up expired entries (every hour)
if (typeof window !== 'undefined') {
  setInterval(() => {
    geoTiffCache.clearExpiredEntries();
  }, 60 * 60 * 1000);
}

export default geoTiffCache;
