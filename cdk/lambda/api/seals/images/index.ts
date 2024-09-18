import { APIGatewayProxyEvent, APIGatewayProxyHandler } from 'aws-lambda';
import 'source-map-support/register';
import { S3Client, ListObjectsV2Command, GetObjectCommand, NotFound, NoSuchKey, GetObjectAttributesCommand, ObjectAttributes, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { response } from '../../response';

type ImageResponse = {
    name: string;
    url: string;
    size: number;
    lastModified?: string;
};

const s3Client = new S3Client({});
const bucketName = process.env.BUCKET_NAME!;
const expiresSeconds = Number(process.env.EXPIRES_SECONDS ?? 3600);

export const findImagesHandler = withErrorHandler(async (sealId) => {
    const s3Objects = await s3Client.send(new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${sealId}/`
    }));

    const asyncImageResponses = (s3Objects.Contents || [])
        .filter(c => !c.Key?.endsWith('/'))
        .map<Promise<ImageResponse>>(async c => {
            const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
                Bucket: bucketName,
                Key: c.Key,
            }), { expiresIn: expiresSeconds });

            return {
                name: c.Key?.replace(sealId, '').replace('/', '') || 'unknown',
                url: signedUrl,
                size: c.Size || 0,
                lastModified: c.LastModified?.toISOString()
            };
        });

    return response({
        statusCode: 200,
        body: await Promise.all(asyncImageResponses),
    });
});

export const getImageHandler = withErrorHandler(async (sealId, imageKey) => {
    const objectKey = `${sealId}/${imageKey}`;
    const getObjectAttributesCommand = new GetObjectAttributesCommand({
        Bucket: bucketName,
        Key: objectKey,
        ObjectAttributes: [ ObjectAttributes.OBJECT_SIZE ]
    });
    const attributes = await s3Client.send(getObjectAttributesCommand);

    const signedUrl = await getSignedUrl(s3Client, new GetObjectCommand({
        Bucket: bucketName,
        Key: objectKey,
    }), { expiresIn: expiresSeconds });

    return response<ImageResponse>({
        statusCode: 200,
        body: {
            name: imageKey!,
            url: signedUrl,
            size: attributes.ObjectSize || 0,
            lastModified: attributes.LastModified?.toISOString()
        },
    });
});

export const putObjectHandler = withErrorHandler(async (sealId, imageKey, body) => {
    const objectKey = `${sealId}/${imageKey}`;
    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: objectKey,
        ContentType: 'image/jpeg',
        Body: Buffer.from(body!, 'base64'),
    });
    await s3Client.send(command);
    
    return response({
        statusCode: 200,
        body: { message: 'Uploaded successfully.' },
    });
});

const publishUrlExpiresSeconds = Number(process.env.EXPIRES_SECONDS ?? 600);
export const publishUploadUrlHandler = withErrorHandler(async (sealId, imageKey) => {
    const objectKey = `${sealId}/${imageKey}`;

    const command = new PutObjectCommand({
        Bucket: process.env.BUCKET_NAME,
        Key: objectKey,
        ContentType: 'binary/octet-stream'
    });
    const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: publishUrlExpiresSeconds,
    });
    
    return response({
        statusCode: 200,
        body: { url: signedUrl },
    });
});

function withErrorHandler(operation: (sealId: string, imageKey?: string, body?: string) => Promise<any>): APIGatewayProxyHandler {
    return async (event, _context) => {
        try {
            const { sealId, imageKey } = event.pathParameters!;
            return await operation(sealId!, imageKey, event.body || undefined);
        } catch (error) {
            if (error instanceof NotFound || error instanceof NoSuchKey) {
                return response({
                    statusCode: 404,
                    body: { message: 'Specified seal or image not found.' },
                });
            }

            console.error(error);
            return response({
                statusCode: 500,
                body: { message: 'Internal server error.' },
            });
        }
    }
}
