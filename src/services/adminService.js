// Admin Service - Firestore operations for admin functionality
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// MAP LAYERS MANAGEMENT
// ============================================================================

/**
 * Get all map layers from Firestore
 */
export async function getMapLayers() {
  try {
    const layersRef = collection(db, 'map-layers');
    const q = query(layersRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching map layers:', error);
    throw error;
  }
}

/**
 * Get a single map layer by ID
 */
export async function getMapLayer(layerId) {
  try {
    const layerRef = doc(db, 'map-layers', layerId);
    const layerDoc = await getDoc(layerRef);

    if (layerDoc.exists()) {
      return { id: layerDoc.id, ...layerDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching map layer:', error);
    throw error;
  }
}

/**
 * Create a new map layer configuration
 */
export async function createMapLayer(layerData, userId) {
  try {
    const layersRef = collection(db, 'map-layers');
    const newLayer = {
      ...layerData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId
    };

    const docRef = await addDoc(layersRef, newLayer);

    // Log the action
    await logAdminAction('create', 'map-layer', docRef.id, userId, newLayer);

    return { id: docRef.id, ...newLayer };
  } catch (error) {
    console.error('Error creating map layer:', error);
    throw error;
  }
}

/**
 * Update an existing map layer
 */
export async function updateMapLayer(layerId, updates, userId) {
  try {
    const layerRef = doc(db, 'map-layers', layerId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await updateDoc(layerRef, updateData);

    // Log the action
    await logAdminAction('update', 'map-layer', layerId, userId, updates);

    return { id: layerId, ...updateData };
  } catch (error) {
    console.error('Error updating map layer:', error);
    throw error;
  }
}

/**
 * Delete a map layer
 */
export async function deleteMapLayer(layerId, userId) {
  try {
    const layerRef = doc(db, 'map-layers', layerId);
    await deleteDoc(layerRef);

    // Log the action
    await logAdminAction('delete', 'map-layer', layerId, userId, null);

    return true;
  } catch (error) {
    console.error('Error deleting map layer:', error);
    throw error;
  }
}

// ============================================================================
// GEOPACKAGE MANAGEMENT
// ============================================================================

/**
 * Save GeoPackage/GeoJSON metadata and layers to Firestore
 * Converts GeoJSON to JSON strings to avoid nested array issues
 */
export async function saveGeoPackage(geoPackageData, userId) {
  try {
    const gpkgRef = collection(db, 'geopackages');

    // Convert layers' GeoJSON to JSON strings to avoid Firestore nested array limitation
    const layersForFirestore = geoPackageData.layers.map(layer => ({
      ...layer,
      geoJSON: JSON.stringify(layer.geoJSON), // Convert to string
      stats: layer.stats ? {
        ...layer.stats,
        propertyKeys: JSON.stringify(layer.stats.propertyKeys || [])
      } : null
    }));

    const newGpkg = {
      name: geoPackageData.name,
      fileName: geoPackageData.fileName,
      fileSize: geoPackageData.fileSize,
      layerCount: geoPackageData.layerCount,
      bounds: geoPackageData.bounds,
      parsedAt: geoPackageData.parsedAt,
      layers: layersForFirestore,
      uploadedAt: serverTimestamp(),
      uploadedBy: userId
    };

    const docRef = await addDoc(gpkgRef, newGpkg);

    // Log the action
    await logAdminAction('upload', 'geopackage', docRef.id, userId, { name: geoPackageData.name });

    return { id: docRef.id, ...newGpkg };
  } catch (error) {
    console.error('Error saving GeoPackage:', error);
    throw error;
  }
}

/**
 * Get all GeoPackages
 * Converts JSON strings back to GeoJSON objects
 */
export async function getGeoPackages() {
  try {
    const gpkgRef = collection(db, 'geopackages');
    const q = query(gpkgRef, orderBy('uploadedAt', 'desc'));
    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => {
      const data = doc.data();

      // Parse GeoJSON strings back to objects
      const layers = data.layers?.map(layer => ({
        ...layer,
        geoJSON: typeof layer.geoJSON === 'string' ? JSON.parse(layer.geoJSON) : layer.geoJSON,
        stats: layer.stats ? {
          ...layer.stats,
          propertyKeys: typeof layer.stats.propertyKeys === 'string'
            ? JSON.parse(layer.stats.propertyKeys)
            : layer.stats.propertyKeys
        } : null
      })) || [];

      return {
        id: doc.id,
        ...data,
        layers
      };
    });
  } catch (error) {
    console.error('Error fetching GeoPackages:', error);
    throw error;
  }
}

/**
 * Delete a GeoPackage
 */
export async function deleteGeoPackage(gpkgId, userId) {
  try {
    const gpkgRef = doc(db, 'geopackages', gpkgId);
    await deleteDoc(gpkgRef);

    // Log the action
    await logAdminAction('delete', 'geopackage', gpkgId, userId, null);

    return true;
  } catch (error) {
    console.error('Error deleting GeoPackage:', error);
    throw error;
  }
}

// ============================================================================
// SUSTAINABILITY DATA MANAGEMENT
// ============================================================================

/**
 * Save sustainability data items to Firestore (bins, roofs, etc.)
 */
export async function saveSustainabilityData(dataType, items, userId) {
  try {
    const batch = writeBatch(db);
    const collectionRef = collection(db, 'sustainability-data', dataType, 'items');

    items.forEach(item => {
      const docRef = doc(collectionRef);
      batch.set(docRef, {
        ...item,
        updatedAt: serverTimestamp(),
        updatedBy: userId
      });
    });

    await batch.commit();

    // Log the action
    await logAdminAction('bulk-update', 'sustainability-data', dataType, userId, { count: items.length });

    return true;
  } catch (error) {
    console.error('Error saving sustainability data:', error);
    throw error;
  }
}

/**
 * Get sustainability data by type
 */
export async function getSustainabilityData(dataType) {
  try {
    const collectionRef = collection(db, 'sustainability-data', dataType, 'items');
    const snapshot = await getDocs(collectionRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching sustainability data:', error);
    throw error;
  }
}

/**
 * Update a single sustainability data item
 */
export async function updateSustainabilityItem(dataType, itemId, updates, userId) {
  try {
    const itemRef = doc(db, 'sustainability-data', dataType, 'items', itemId);
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await updateDoc(itemRef, updateData);

    // Log the action
    await logAdminAction('update', 'sustainability-item', `${dataType}/${itemId}`, userId, updates);

    return true;
  } catch (error) {
    console.error('Error updating sustainability item:', error);
    throw error;
  }
}

/**
 * Delete a sustainability data item
 */
export async function deleteSustainabilityItem(dataType, itemId, userId) {
  try {
    const itemRef = doc(db, 'sustainability-data', dataType, 'items', itemId);
    await deleteDoc(itemRef);

    // Log the action
    await logAdminAction('delete', 'sustainability-item', `${dataType}/${itemId}`, userId, null);

    return true;
  } catch (error) {
    console.error('Error deleting sustainability item:', error);
    throw error;
  }
}

/**
 * Add a new sustainability data item
 */
export async function addSustainabilityItem(dataType, itemData, userId) {
  try {
    const collectionRef = collection(db, 'sustainability-data', dataType, 'items');
    const newItem = {
      ...itemData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId
    };

    const docRef = await addDoc(collectionRef, newItem);

    // Log the action
    await logAdminAction('create', 'sustainability-item', `${dataType}/${docRef.id}`, userId, itemData);

    return { id: docRef.id, ...newItem };
  } catch (error) {
    console.error('Error adding sustainability item:', error);
    throw error;
  }
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

/**
 * Get all users from Firestore
 */
export async function getAllUsers() {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw error;
  }
}

/**
 * Update a user's role
 */
export async function updateUserRole(userId, newRole, adminUserId) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      role: newRole
    });

    // Log the action
    await logAdminAction('update-role', 'user', userId, adminUserId, { newRole });

    return { id: userId, role: newRole };
  } catch (error) {
    console.error('Error updating user role:', error);
    throw error;
  }
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

/**
 * Log admin actions for audit trail
 */
export async function logAdminAction(action, resourceType, resourceId, userId, changes) {
  try {
    const logsRef = collection(db, 'audit-log');
    await addDoc(logsRef, {
      action,
      resourceType,
      resourceId,
      userId,
      changes,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}

/**
 * Get audit logs with optional filtering
 */
export async function getAuditLogs(filters = {}) {
  try {
    const logsRef = collection(db, 'audit-log');
    let q = query(logsRef, orderBy('timestamp', 'desc'));

    // Apply filters
    if (filters.userId) {
      q = query(q, where('userId', '==', filters.userId));
    }
    if (filters.resourceType) {
      q = query(q, where('resourceType', '==', filters.resourceType));
    }
    if (filters.action) {
      q = query(q, where('action', '==', filters.action));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    throw error;
  }
}

// ============================================================================
// ANALYTICS
// ============================================================================

/**
 * Get analytics data for admin dashboard
 */
export async function getAnalytics() {
  try {
    // Get counts of various resources
    const [layers, geoPackages, logs] = await Promise.all([
      getDocs(collection(db, 'map-layers')),
      getDocs(collection(db, 'geopackages')),
      getDocs(collection(db, 'audit-log'))
    ]);

    return {
      totalLayers: layers.size,
      totalGeoPackages: geoPackages.size,
      totalActions: logs.size,
      recentActivity: logs.docs.slice(0, 10).map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
    };
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
}

// Export all functions
const adminService = {
  // Map layers
  getMapLayers,
  getMapLayer,
  createMapLayer,
  updateMapLayer,
  deleteMapLayer,

  // GeoPackages
  saveGeoPackage,
  getGeoPackages,
  deleteGeoPackage,

  // Sustainability data
  getSustainabilityData,
  saveSustainabilityData,
  updateSustainabilityItem,
  deleteSustainabilityItem,
  addSustainabilityItem,

  // User management
  getAllUsers,
  updateUserRole,

  // Audit logs
  logAdminAction,
  getAuditLogs,

  // Analytics
  getAnalytics
};

export default adminService;
