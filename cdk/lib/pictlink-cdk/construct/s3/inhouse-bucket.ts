import { RemovalPolicy, aws_s3 as s3, aws_iam as iam, Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface InhouseBucketProps {
    /**
     * S3バケット名.
     */
    readonly bucketName: string;
    /**
     * S3バケットの削除ポリシー.
     *
     * @default RemovalPolicy.DESTROY
     */
    readonly removalPolicy?: RemovalPolicy;
}

/**
 * 社内IPからのみアクセス可能なS3バケット.
 */
export class InhouseBucket extends s3.Bucket {
    constructor(scope: Construct, id: string, props: InhouseBucketProps) {
        super(scope, id, {
            bucketName: props.bucketName,
            accessControl: s3.BucketAccessControl.PRIVATE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: props.removalPolicy ?? RemovalPolicy.DESTROY,
        });

        const resources = [this.bucketArn, this.arnForObjects('*')];
        this.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:*'],
                effect: iam.Effect.DENY,
                principals: [new iam.AnyPrincipal()],
                resources: resources,
                conditions: {
                    Bool: {
                        'aws:SecureTransport': false,
                    },
                },
            })
        );
        this.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:GetObject'],
                effect: iam.Effect.ALLOW,
                principals: [new iam.AnyPrincipal()],
                resources: resources,
                conditions: {
                    IpAddress: {
                        'aws:SourceIp': [
                            '61.200.40.14/32',
                            '61.200.40.11/32',
                            '118.103.16.72/29',
                            '122.103.91.225/32',
                            '126.113.229.122/32',
                            '202.214.118.112/28',
                            '202.215.25.58/32',
                            '202.215.28.243/32',
                            '210.130.226.156/32',
                            '202.215.28.244/32',
                            '202.241.173.224/28',
                        ]
                    }
                },
            })
        )
    }
}
