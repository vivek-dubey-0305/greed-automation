import { v2 as cloudinary } from 'cloudinary';
import { env } from '../../config/env';
import { AppError } from '../../errors/AppError';
import { logger } from '../../logger';
cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
});
export class CloudinaryService {
    /**
     * Uploads an image buffer to Cloudinary
     */
    static async uploadImage(buffer, filename, requestId) {
        logger.debug({ requestId, filename }, 'Uploading image to Cloudinary');
        return new Promise((resolve, reject) => {
            const uploadStream = cloudinary.uploader.upload_stream({
                folder: 'greed_social_media',
                resource_type: 'image',
            }, (error, result) => {
                if (error || !result) {
                    logger.error({ requestId, error }, 'Cloudinary upload failed');
                    return reject(new AppError({
                        message: 'Failed to upload media to Cloudinary',
                        code: 'CLOUDINARY_UPLOAD_FAILED',
                        category: 'ExternalServiceError',
                        retryable: true,
                        cause: error,
                    }));
                }
                logger.info({ requestId, publicId: result.public_id }, 'Cloudinary upload succeeded');
                resolve(result);
            });
            uploadStream.end(buffer);
        });
    }
    /**
     * Deletes an asset by its public ID
     */
    static async deleteAsset(publicId, requestId) {
        logger.debug({ requestId, publicId }, 'Deleting asset from Cloudinary');
        try {
            const result = await cloudinary.uploader.destroy(publicId);
            if (result.result !== 'ok' && result.result !== 'not found') {
                throw new Error(`Unexpected result: ${result.result}`);
            }
            logger.info({ requestId, publicId }, 'Cloudinary delete succeeded');
        }
        catch (error) {
            logger.error({ requestId, error, publicId }, 'Cloudinary delete failed');
            throw new AppError({
                message: 'Failed to delete media from Cloudinary',
                code: 'CLOUDINARY_DELETE_FAILED',
                category: 'ExternalServiceError',
                retryable: true,
                cause: error,
            });
        }
    }
}
