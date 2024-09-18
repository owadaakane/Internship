// import { StackProps, Duration, aws_cognito as cognito, aws_apigateway as apigateway, aws_iam as iam, aws_s3 as s3 } from 'aws-cdk-lib';
// import { Construct } from 'constructs';
// import {
//     PictlinkStackBase,
//     s3 as picts3,
//     lambda as pictlambda,
// } from 'pictlink-cdk/lib';

// export interface InternshipHostingBucketStackProps extends StackProps {
//     readonly bucketName: string;
// }

// export class InternshipHostingBucketStack extends PictlinkStackBase {
//     constructor(scope: Construct, id: string, props: InternshipHostingBucketStackProps) {
//         super(scope, id, props);

//         const bucket = new s3.Bucket(this, 'Bucket', {
//             bucketName: picts3.convertBucketNameByAccount(props.bucketName, this.pictlinkAccount),
//             removalPolicy: this.defaultRemovalPolicy,
//             websiteIndexDocument: 'index.html',
//             websiteErrorDocument: 'error.html',
//             accessControl: s3.BucketAccessControl.PRIVATE,
//             blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL
//         });

//         bucket.addToResourcePolicy(
//             new iam.PolicyStatement({
//                 actions: ['s3:*'],
//                 effect: iam.Effect.DENY,
//                 principals: [new iam.AnyPrincipal()],
//                 resources: [
//                     bucket.bucketArn,
//                     bucket.arnForObjects('*'),
//                 ],
//                 conditions: {
//                     Bool: {
//                         'aws:SecureTransport': false,
//                     },
//                 },
//             })
//         );

//         bucket.addToResourcePolicy(
//             new iam.PolicyStatement({
//                 actions: ['s3:GetObject'],
//                 effect: iam.Effect.ALLOW,
//                 principals: [new iam.AnyPrincipal()],
//                 resources: [
//                     bucket.arnForObjects('*'),
//                 ],
//                 conditions: {
//                     IpAddress: {
//                         'aws:SourceIp': [
//                             '61.200.40.14/32',
//                             '61.200.40.11/32',
//                             '118.103.16.72/29',
//                             '122.103.91.225/32',
//                             '126.113.229.122/32',
//                             '202.214.118.112/28',
//                             '202.215.25.58/32',
//                             '202.215.28.243/32',
//                             '210.130.226.156/32',
//                             '202.215.28.244/32',
//                             '202.241.173.224/28',
//                         ]
//                     }
//                 }
//             })
//         );
        
//     }
// }
