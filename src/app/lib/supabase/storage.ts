import { createClient } from './client';

const BUCKET_NAME = 'images';

/**
 * Extract the file path from a Supabase storage URL
 * URL format: https://[project].supabase.co/storage/v1/object/public/images/[path]
 */
function extractFilePath(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const match = url.pathname.match(/\/storage\/v1\/object\/public\/images\/(.+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Upload an image file to Supabase storage
 * @param file The image file to upload
 * @param folder The folder path (e.g., 'products', 'inventory')
 * @param itemId The item ID to use in the filename
 * @returns Public URL of the uploaded image
 */
export async function uploadImage(
  file: File,
  folder: 'products' | 'inventory',
  itemId: string
): Promise<string> {
  const supabase = createClient();
  
  // Create unique filename with timestamp
  const extension = file.name.split('.').pop();
  const filename = `${itemId}-${Date.now()}.${extension}`;
  const filePath = `${folder}/${filename}`;
  
  // Upload file to Supabase storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      upsert: false,
      contentType: file.type,
    });
  
  if (error) {
    throw new Error(`Failed to upload image: ${error.message}`);
  }
  
  // Get public URL
  const { data: publicUrl } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(data.path);
  
  return publicUrl.publicUrl;
}

/**
 * Delete an image from Supabase storage
 * @param imageUrl The full URL of the image
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  const filePath = extractFilePath(imageUrl);
  if (!filePath) {
    console.warn('Could not extract file path from URL:', imageUrl);
    return;
  }
  
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);
  
  if (error) {
    console.error(`Failed to delete image: ${error.message}`);
    throw error;
  }
}

/**
 * Replace an image with a new one
 * Deletes the old image and uploads the new one
 * @param oldImageUrl The URL of the image to delete (or null if no old image)
 * @param newFile The new image file
 * @param folder The folder path (e.g., 'products', 'inventory')
 * @param itemId The item ID to use in the filename
 * @returns Public URL of the new image
 */
export async function replaceImage(
  oldImageUrl: string | null,
  newFile: File,
  folder: 'products' | 'inventory',
  itemId: string
): Promise<string> {
  // Delete old image if it exists
  if (oldImageUrl) {
    try {
      await deleteImage(oldImageUrl);
    } catch (error) {
      console.error('Error deleting old image:', error);
      // Continue with upload even if deletion fails
    }
  }
  
  // Upload new image
  return uploadImage(newFile, folder, itemId);
}
