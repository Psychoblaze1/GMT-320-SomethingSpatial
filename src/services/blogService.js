// Blog Service - Firestore operations and image uploads for blog functionality
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
  Timestamp
} from 'firebase/firestore';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { db, storage } from './firebase';
import { logAdminAction } from './adminService';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Check if a slug already exists
 */
export async function checkSlugExists(slug, excludePostId = null) {
  try {
    const blogsRef = collection(db, 'blogs');
    const q = query(blogsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    // If we're editing a post, exclude it from the check
    if (excludePostId) {
      return snapshot.docs.some(doc => doc.id !== excludePostId);
    }

    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking slug:', error);
    throw error;
  }
}

/**
 * Generate a unique slug by appending a number if necessary
 */
export async function generateUniqueSlug(title, excludePostId = null) {
  let slug = generateSlug(title);
  let counter = 1;

  while (await checkSlugExists(slug, excludePostId)) {
    slug = `${generateSlug(title)}-${counter}`;
    counter++;
  }

  return slug;
}

// ============================================================================
// IMAGE UPLOAD
// ============================================================================

/**
 * Upload an image to Firebase Storage
 * @param {File} file - The image file to upload
 * @param {string} path - The storage path (e.g., 'blog/featured' or 'blog/content')
 * @returns {Promise<string>} - The download URL of the uploaded image
 */
export async function uploadImage(file, path = 'blog/images') {
  try {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${extension}`;

    // Create a storage reference
    const storageRef = ref(storage, `${path}/${fileName}`);

    // Upload the file
    const snapshot = await uploadBytes(storageRef, file);

    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);

    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Delete an image from Firebase Storage
 * @param {string} imageUrl - The full URL of the image to delete
 */
export async function deleteImage(imageUrl) {
  try {
    // Extract the path from the URL
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - image deletion failures shouldn't break the main operation
    return false;
  }
}

// ============================================================================
// BLOG POST MANAGEMENT
// ============================================================================

/**
 * Get all blog posts from Firestore
 * @param {Object} filters - Optional filters (status, category, tag, search)
 * @returns {Promise<Array>} - Array of blog posts
 */
export async function getBlogPosts(filters = {}) {
  try {
    const blogsRef = collection(db, 'blogs');
    // Simple query - just order by publishedAt descending (no composite index needed)
    const q = query(blogsRef, orderBy('publishedAt', 'desc'));

    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamps to Date objects
      publishedAt: doc.data().publishedAt?.toDate(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate()
    }));

    // Client-side filtering for status if needed
    if (filters.status) {
      posts = posts.filter(post => post.status === filters.status);
    }

    // Client-side filtering for category and search
    if (filters.category) {
      posts = posts.filter(post =>
        post.categories?.includes(filters.category)
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      posts = posts.filter(post =>
        post.title?.toLowerCase().includes(searchLower) ||
        post.excerpt?.toLowerCase().includes(searchLower) ||
        post.content?.toLowerCase().includes(searchLower)
      );
    }

    return posts;
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    throw error;
  }
}

/**
 * Get a single blog post by ID
 * @param {string} postId - The blog post ID
 * @returns {Promise<Object|null>} - The blog post or null if not found
 */
export async function getBlogPost(postId) {
  try {
    const postRef = doc(db, 'blogs', postId);
    const postDoc = await getDoc(postRef);

    if (postDoc.exists()) {
      const data = postDoc.data();
      return {
        id: postDoc.id,
        ...data,
        publishedAt: data.publishedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching blog post:', error);
    throw error;
  }
}

/**
 * Get a single blog post by slug
 * @param {string} slug - The blog post slug
 * @returns {Promise<Object|null>} - The blog post or null if not found
 */
export async function getBlogPostBySlug(slug) {
  try {
    const blogsRef = collection(db, 'blogs');
    const q = query(blogsRef, where('slug', '==', slug));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const postDoc = snapshot.docs[0];
      const data = postDoc.data();
      return {
        id: postDoc.id,
        ...data,
        publishedAt: data.publishedAt?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate()
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching blog post by slug:', error);
    throw error;
  }
}

/**
 * Create a new blog post
 * @param {Object} postData - The blog post data
 * @param {string} userId - The ID of the user creating the post
 * @returns {Promise<Object>} - The created blog post with ID
 */
export async function createBlogPost(postData, userId) {
  try {
    const blogsRef = collection(db, 'blogs');

    // Generate a unique slug if not provided
    const slug = postData.slug || await generateUniqueSlug(postData.title);

    const newPost = {
      title: postData.title,
      slug: slug,
      content: postData.content || '',
      excerpt: postData.excerpt || '',
      featuredImage: postData.featuredImage || null,
      categories: postData.categories || [],
      author: postData.author || 'Admin',
      authorId: userId,
      status: 'published', // Always published immediately as per requirements
      views: 0,
      publishedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      createdBy: userId,
      updatedBy: userId
    };

    const docRef = await addDoc(blogsRef, newPost);

    // Log the action
    await logAdminAction('create', 'blog-post', docRef.id, userId, { title: postData.title });

    return { id: docRef.id, ...newPost };
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

/**
 * Update an existing blog post
 * @param {string} postId - The blog post ID
 * @param {Object} updates - The fields to update
 * @param {string} userId - The ID of the user updating the post
 * @returns {Promise<Object>} - The updated blog post
 */
export async function updateBlogPost(postId, updates, userId) {
  try {
    const postRef = doc(db, 'blogs', postId);

    // If title is being updated, regenerate slug (unless slug is explicitly provided)
    if (updates.title && !updates.slug) {
      updates.slug = await generateUniqueSlug(updates.title, postId);
    } else if (updates.slug) {
      // Validate new slug is unique
      const slugExists = await checkSlugExists(updates.slug, postId);
      if (slugExists) {
        throw new Error('This slug is already in use by another post');
      }
    }

    const updateData = {
      ...updates,
      updatedAt: serverTimestamp(),
      updatedBy: userId
    };

    await updateDoc(postRef, updateData);

    // Log the action
    await logAdminAction('update', 'blog-post', postId, userId, updates);

    return { id: postId, ...updateData };
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

/**
 * Delete a blog post
 * @param {string} postId - The blog post ID
 * @param {string} userId - The ID of the user deleting the post
 * @returns {Promise<boolean>} - True if successful
 */
export async function deleteBlogPost(postId, userId) {
  try {
    // Get the post to retrieve the featured image URL
    const post = await getBlogPost(postId);

    // Delete the featured image if it exists
    if (post?.featuredImage) {
      await deleteImage(post.featuredImage);
    }

    // Delete the post document
    const postRef = doc(db, 'blogs', postId);
    await deleteDoc(postRef);

    // Log the action
    await logAdminAction('delete', 'blog-post', postId, userId, { title: post?.title });

    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    throw error;
  }
}

/**
 * Increment view count for a blog post
 * @param {string} postId - The blog post ID
 */
export async function incrementViews(postId) {
  try {
    const post = await getBlogPost(postId);
    if (post) {
      const postRef = doc(db, 'blogs', postId);
      await updateDoc(postRef, {
        views: (post.views || 0) + 1
      });
    }
  } catch (error) {
    console.error('Error incrementing views:', error);
    // Don't throw - view count failures shouldn't break page loading
  }
}

// ============================================================================
// CATEGORIES
// ============================================================================

/**
 * Get all unique categories from blog posts
 * @returns {Promise<Array>} - Array of category strings
 */
export async function getCategories() {
  try {
    const posts = await getBlogPosts();
    const categoriesSet = new Set();

    posts.forEach(post => {
      post.categories?.forEach(category => categoriesSet.add(category));
    });

    return Array.from(categoriesSet).sort();
  } catch (error) {
    console.error('Error fetching categories:', error);
    throw error;
  }
}

// Export all functions
const blogService = {
  // Blog posts
  getBlogPosts,
  getBlogPost,
  getBlogPostBySlug,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  incrementViews,

  // Images
  uploadImage,
  deleteImage,

  // Categories
  getCategories,

  // Utilities
  generateSlug,
  generateUniqueSlug,
  checkSlugExists
};

export default blogService;
