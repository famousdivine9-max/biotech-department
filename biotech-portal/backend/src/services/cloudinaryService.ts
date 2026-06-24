import cloudinary from 'cloudinary';
import { Readable } from 'stream';

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const uploadToCloudinary = async (
  fileBuffer: Buffer,
  filename: string,
  folder: string = 'biotech-portal/materials',
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'raw'
): Promise<{ url: string; public_id: string }> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.v2.uploader.upload_stream(
      {
        folder,
        public_id: `${Date.now()}-${filename.replace(/\.[^/.]+$/, '')}`,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve({ url: result!.secure_url, public_id: result!.public_id });
      }
    );

    const readable = new Readable();
    readable.push(fileBuffer);
    readable.push(null);
    readable.pipe(uploadStream);
  });
};

export const deleteFromCloudinary = async (
  publicId: string,
  resourceType: 'auto' | 'image' | 'video' | 'raw' = 'raw'
): Promise<void> => {
  await cloudinary.v2.uploader.destroy(publicId, { resource_type: resourceType });
};

export const uploadImageToCloudinary = async (
  fileBuffer: Buffer,
  filename: string,
  folder: string = 'biotech-portal/images'
): Promise<{ url: string; public_id: string }> => {
  return uploadToCloudinary(fileBuffer, filename, folder, 'image');
};

export default cloudinary;
