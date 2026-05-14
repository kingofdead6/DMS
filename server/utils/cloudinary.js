import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});


export const uploadToCloudinary = async (file, resourceType = 'auto') => {
  try {
    if (!file) return null;

    const detectedType = resourceType !== 'auto'
      ? resourceType
      : file.mimetype.startsWith('video/')
        ? 'video'
        : file.mimetype.startsWith('image/')
          ? 'image'
          : 'raw';

    const ext = path.extname(file.originalname).toLowerCase();
    

    const uploadResult = await new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream(
    {
      folder: 'DMS',
      resource_type: detectedType,
      use_filename: true,        
      unique_filename: true,  
      filename_override: file.originalname,
      allowed_formats:
        detectedType === 'video'
          ? ['mp4']
          : detectedType === 'raw'
          ? ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx']
          : ['jpg', 'png', 'jpeg', 'gif', 'svg', 'webp'],
    },
    (error, result) => {
      if (error) {
        console.error('Cloudinary upload_stream error:', error);
        return reject(error);
      }
      resolve(result);
    }
  );
  stream.end(file.buffer);
});

    return uploadResult.secure_url;
  } catch (error) {
    console.error(`Cloudinary upload error:`, error);
    throw new Error(`Failed to upload to Cloudinary: ${error.message}`);
  }
};

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    return result;
  } catch (error) {
    console.error(`Cloudinary ${resourceType} delete error:`, error);
    throw new Error(`Failed to delete ${resourceType} from Cloudinary: ${error.message}`);
  }
};