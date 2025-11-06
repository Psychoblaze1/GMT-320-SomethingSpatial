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

/**
 * Batch save multiple sustainability items (for bulk import from GLTF)
 */
export async function saveSustainabilityData(dataType, items, userId) {
  try {
    const collectionRef = collection(db, 'sustainability-data', dataType, 'items');
    const batch = writeBatch(db);
    const timestamp = serverTimestamp();

    // Firestore allows max 500 operations per batch
    const maxBatchSize = 500;
    const batches = [];

    for (let i = 0; i < items.length; i += maxBatchSize) {
      const batchItems = items.slice(i, i + maxBatchSize);
      const currentBatch = writeBatch(db);

      batchItems.forEach((item) => {
        const docRef = doc(collectionRef, String(item.id || Date.now() + Math.random()));
        currentBatch.set(docRef, {
          ...item,
          createdAt: timestamp,
          updatedAt: timestamp,
          createdBy: userId,
          updatedBy: userId
        });
      });

      batches.push(currentBatch);
    }

    // Commit all batches
    for (const batch of batches) {
      await batch.commit();
    }

    // Log the bulk action
    await logAdminAction(
      'bulk-create',
      'sustainability-data',
      dataType,
      userId,
      { itemCount: items.length, source: 'GLTF extraction' }
    );

    console.log(`Successfully saved ${items.length} ${dataType} items in ${batches.length} batch(es)`);
    return { success: true, count: items.length, batches: batches.length };
  } catch (error) {
    console.error('Error batch saving sustainability data:', error);
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
 * Determine the severity level of an admin action
 */
function getActionSeverity(action, resourceType) {
  // Critical actions that affect system security or data integrity
  const criticalActions = ['delete', 'bulk-delete', 'update-role', 'bulk-update'];
  const criticalResources = ['user', 'audit-log', 'admin-settings'];

  if (criticalActions.includes(action) || criticalResources.includes(resourceType)) {
    return 'critical';
  }

  // Major actions that affect significant data
  const majorActions = ['create', 'update', 'bulk-create', 'upload'];
  if (majorActions.includes(action)) {
    return 'major';
  }

  // Minor actions like reads or queries
  return 'minor';
}

/**
 * Get user information for audit log
 */
async function getUserInfo(userId) {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const userData = userDoc.data();
      return {
        displayName: userData.displayName || userData.email || 'Unknown User',
        email: userData.email,
        role: userData.role
      };
    }
  } catch (error) {
    console.error('Error fetching user info for audit:', error);
  }

  return {
    displayName: 'Unknown User',
    email: null,
    role: null
  };
}

/**
 * Log an admin action with enhanced metadata
 */
export async function logAdminAction(action, resourceType, resourceId, userId, changes, metadata = {}) {
  try {
    // Get user information
    const userInfo = await getUserInfo(userId);

    // Determine action severity
    const severity = getActionSeverity(action, resourceType);

    const logsRef = collection(db, 'audit-log');
    await addDoc(logsRef, {
      action,
      resourceType,
      resourceId,
      userId,
      userName: userInfo.displayName,
      userEmail: userInfo.email,
      userRole: userInfo.role,
      changes,
      severity,
      metadata,
      ipAddress: metadata.ipAddress || null,
      userAgent: metadata.userAgent || null,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
    // Don't throw - logging failures shouldn't break the main operation
  }
}
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
