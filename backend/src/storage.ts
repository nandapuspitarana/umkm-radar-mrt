import { Client } from 'minio';
import * as dotenv from 'dotenv';

dotenv.config();

// MinIO Client Configuration
export const minioClient = new Client({
    endPoint: process.env.MINIO_ENDPOINT || 'localhost',
    port: parseInt(process.env.MINIO_PORT || '9000'),
    useSSL: process.env.MINIO_USE_SSL === 'true',
    accessKey: process.env.MINIO_ACCESS_KEY || 'umkmradar',
    secretKey: process.env.MINIO_SECRET_KEY || 'umkmradar123',
});

export const BUCKET_NAME = process.env.MINIO_BUCKET || 'assets';
export const PUBLIC_ASSET_URL = process.env.PUBLIC_ASSET_URL || 'http://localhost:9000/assets';

/**
 * Initialize MinIO bucket with proper CORS configuration
 */
export async function initializeStorage() {
    try {
        // Check if bucket exists
        const bucketExists = await minioClient.bucketExists(BUCKET_NAME);

        if (!bucketExists) {
            console.log(`Creating bucket: ${BUCKET_NAME}`);
            await minioClient.makeBucket(BUCKET_NAME, 'us-east-1');
        }

        // Set bucket policy to allow public read access
        const policy = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: { AWS: ['*'] },
                    Action: ['s3:GetObject'],
                    Resource: [`arn:aws:s3:::${BUCKET_NAME}/*`],
                },
            ],
        };

        await minioClient.setBucketPolicy(BUCKET_NAME, JSON.stringify(policy));

        // Set CORS configuration for localhost and *.pengaruh.my.id
        const corsConfig = {
            CORSRules: [
                {
                    AllowedOrigins: [
                        'http://localhost:*',
                        'http://127.0.0.1:*',
                        'https://*.pengaruh.my.id',
                        'http://*.pengaruh.my.id',
                    ],
                    AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                    AllowedHeaders: ['*'],
                    ExposeHeaders: ['ETag'],
                    MaxAgeSeconds: 3600,
                },
            ],
        };

        // Note: MinIO CORS is set via mc command or web console
        // We'll document this in the setup instructions

        console.log('✅ MinIO storage initialized successfully');
        console.log(`   Bucket: ${BUCKET_NAME}`);
        console.log(`   Public URL: ${PUBLIC_ASSET_URL}`);
    } catch (error) {
        console.error('❌ Failed to initialize MinIO storage:', error);
        throw error;
    }
}

/**
 * Upload file to MinIO
 * @param {Buffer} fileBuffer - File buffer
 * @param {string} fileName - File name with extension
 * @param {string} folder - Folder path (e.g., 'banners', 'products', 'logos')
 * @param {string} contentType - MIME type
 * @returns {Promise<string>} - Public URL of uploaded file
 */
export async function uploadToMinIO(fileBuffer, fileName, folder = 'general', contentType = 'application/octet-stream') {
    try {
        const objectName = folder ? `${folder}/${fileName}` : fileName;

        const metadata = {
            'Content-Type': contentType,
            'Cache-Control': 'public, max-age=31536000',
        };

        await minioClient.putObject(
            BUCKET_NAME,
            objectName,
            fileBuffer,
            fileBuffer.length,
            metadata
        );

        // Return public URL
        const publicUrl = `${PUBLIC_ASSET_URL}/${objectName}`;
        return publicUrl;
    } catch (error) {
        console.error('MinIO upload error:', error);
        throw error;
    }
}

/**
 * Delete file from MinIO
 * @param {string} objectName - Object name (path) in bucket
 */
export async function deleteFromMinIO(objectName) {
    try {
        await minioClient.removeObject(BUCKET_NAME, objectName);
        console.log(`Deleted: ${objectName}`);
    } catch (error) {
        console.error('MinIO delete error:', error);
        throw error;
    }
}

/**
 * Get presigned URL for temporary access (optional, for private files)
 * @param {string} objectName - Object name in bucket
 * @param {number} expirySeconds - URL expiry time in seconds (default: 1 hour)
 */
export async function getPresignedUrl(objectName, expirySeconds = 3600) {
    try {
        const url = await minioClient.presignedGetObject(BUCKET_NAME, objectName, expirySeconds);
        return url;
    } catch (error) {
        console.error('MinIO presigned URL error:', error);
        throw error;
    }
}
