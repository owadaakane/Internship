import { Duration, aws_cognito as cognito, aws_iam as iam } from 'aws-cdk-lib';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { PictlinkStackBase, s3, lambda } from '../pictlink-cdk';
import { AuthorizationType, CfnDocumentationPart, CfnDocumentationVersion, CognitoUserPoolsAuthorizer, Cors, IRestApi, JsonSchema, JsonSchemaType, LambdaIntegration, RestApi } from 'aws-cdk-lib/aws-apigateway';

const ContentType = {
    APPLICATION_JSON: 'application/json',
    IMAGE_JPEG: 'image/jpeg',
};

interface StackProps extends cdk.StackProps {
    /**
     * プロジェクト名.
     */
    readonly projectName: string;
}

/**
 * プリBUとの合同インターンシップに必要なリソースをまとめて全て作成するStack.
 */
export class PuriBuJointInternshipStack extends PictlinkStackBase {

    readonly restApi: IRestApi;

    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);

        // S3 Bucket Related Resources ------------------------------------------

        const imageBucket = new s3.BucketAllowdAccessPointOnly(this, 'ImageBucket', {
            name: s3.convertBucketNameByAccount(props.projectName, this.pictlinkAccount),
            removalPolicy: this.defaultRemovalPolicy,
            lifecycleRules: [{ expiration: Duration.days(7) }]
        });
        const imageBucketReadWriteAp = imageBucket.addReadWriteAccessPoint(this, 'ImageBucketReadWriteAccessPoint');
        const imageBucketReadWritePolicy = imageBucketReadWriteAp.createManagedPolicy(this, 'ImageBucketReadWritePolicy');
        const imageBucketReadonlyAp = imageBucket.addReadonlyAccessPoint(this, 'ImageBucketReadonlyAccessPoint');
        const imageBucketReadonlyPolicy = imageBucketReadonlyAp.createManagedPolicy(this, 'ImageBucketReadonlyPolicy');

        // Cognito Related Resources -------------------------------------------

        const userPoolName = `${props.projectName}-user-pool`;
        const userPool = new cognito.UserPool(this, 'UserPool', {
            userPoolName: userPoolName,
            selfSignUpEnabled: false,
            enableSmsRole: false,
            signInAliases: {
                username: true,
            },
            standardAttributes: {
                preferredUsername: { mutable: true },
            },
            customAttributes: {
                'groupNo': new cognito.StringAttribute({ mutable: true }),
            },
            mfa: cognito.Mfa.OFF,
            passwordPolicy: {
                minLength: 12,
                requireLowercase: true,
                requireUppercase: true,
                requireDigits: true,
                requireSymbols: false
            },
            signInCaseSensitive: true,
            accountRecovery: cognito.AccountRecovery.NONE,
            removalPolicy: this.defaultRemovalPolicy,
            deletionProtection: false,
            advancedSecurityMode: cognito.AdvancedSecurityMode.OFF,
        });

        const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
            userPool,
            userPoolClientName: `${userPoolName}-client`,
            generateSecret: false,
            authFlows: {
                adminUserPassword: true,
                userPassword: true,
            },
            disableOAuth: false,
            oAuth: {
                flows: {
                    authorizationCodeGrant: true,
                    implicitCodeGrant: true,
                    clientCredentials: false,
                }
            },
            authSessionValidity: Duration.minutes(5),
            preventUserExistenceErrors: false,
            supportedIdentityProviders: [
                cognito.UserPoolClientIdentityProvider.COGNITO,
            ],
            idTokenValidity: Duration.days(1),
            refreshTokenValidity: Duration.days(30),
            accessTokenValidity: Duration.minutes(30),
            readAttributes: new cognito.ClientAttributes().withStandardAttributes({
                preferredUsername: true,
            }).withCustomAttributes('groupNo'),
            writeAttributes: new cognito.ClientAttributes(),
            enableTokenRevocation: true,
        });

        // API Gateway Associated Lambda Functions --------------------------------

        const authFunction = new lambda.NodeJsFunction(this, 'AuthLambdaFunction', {
            functionName: `${props.projectName}-auth`,
            entry: 'lambda/api/auth/index.ts',
            environment: {
                COGNITO_USER_POOL_ID: userPool.userPoolId,
                COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        });
        authFunction.func.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cognito-idp:AdminInitiateAuth'],
            resources: [userPool.userPoolArn],
        }));

        const authRefreshFunction = new lambda.NodeJsFunction(this, 'AuthRefreshLambdaFunction', {
            functionName: `${props.projectName}-auth-refresh`,
            entry: 'lambda/api/auth/index.ts',
            handler: 'refreshHandler',
            environment: {
                COGNITO_USER_POOL_ID: userPool.userPoolId,
                COGNITO_CLIENT_ID: userPoolClient.userPoolClientId,
            },
        });
        authRefreshFunction.func.addToRolePolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cognito-idp:AdminInitiateAuth'],
            resources: [userPool.userPoolArn],
        }));

        const publishUploadUrlFunction = new lambda.NodeJsFunction(this, 'SealsPublishUploadUrlLambdaFunction', {
            functionName: `${props.projectName}-api-seals-publish-upload-url`,
            entry: 'lambda/api/seals/images/index.ts',
            handler: 'publishUploadUrlHandler',
            environment: {
                BUCKET_NAME: imageBucketReadWriteAp.alias,
            }
        });
        publishUploadUrlFunction.addToManagedPolicy(imageBucketReadWritePolicy);

        const putObjectFunction = new lambda.NodeJsFunction(this, 'SealsPutImageLambdaFunction', {
            functionName: `${props.projectName}-api-seals-put-image`,
            entry: 'lambda/api/seals/images/index.ts',
            handler: 'putObjectHandler',
            environment: {
                BUCKET_NAME: imageBucketReadWriteAp.alias,
            }
        });
        putObjectFunction.addToManagedPolicy(imageBucketReadWritePolicy);

        const findImagesFunction = new lambda.NodeJsFunction(this, 'SealsFindImagesLambdaFunction', {
            functionName: `${props.projectName}-api-seals-find-images`,
            entry: 'lambda/api/seals/images/index.ts',
            handler: 'findImagesHandler',
            environment: {
                BUCKET_NAME: imageBucketReadonlyAp.alias,
            }
        });
        findImagesFunction.addToManagedPolicy(imageBucketReadonlyPolicy);

        const getImageFunction = new lambda.NodeJsFunction(this, 'SealsGetImageLambdaFunction', {
            functionName: `${props.projectName}-api-seals-get-image`,
            entry: 'lambda/api/seals/images/index.ts',
            handler: 'getImageHandler',
            environment: {
                BUCKET_NAME: imageBucketReadonlyAp.alias,
            }
        });
        getImageFunction.addToManagedPolicy(imageBucketReadonlyPolicy);

        // API Gateway Rest API Routing -------------------------------------

        const restApi = new RestApi(this, 'RestApi', {
            restApiName: `${props.projectName}-api`,
            description: 'This service is for internship program.',
            disableExecuteApiEndpoint: false,
            deploy: true,
            deployOptions: {
                stageName: 'v1', // 固定
            },
            retainDeployments: false,
            cloudWatchRole: true,
            defaultCorsPreflightOptions: {
                allowOrigins: Cors.ALL_ORIGINS, //TODO
                allowMethods: Cors.ALL_METHODS,
                allowHeaders: Cors.DEFAULT_HEADERS,
                allowCredentials: true,
            },
            binaryMediaTypes: [ContentType.IMAGE_JPEG],
        });
        this.restApi = restApi;

        const cognitoAuthorizer = new CognitoUserPoolsAuthorizer(this, 'CognitoUserPoolsAuthorizer', {
            authorizerName: `${props.projectName}-cognito-authorizer`,
            cognitoUserPools: [userPool],
            resultsCacheTtl: Duration.minutes(5),
        });

         // API Gateway Rest API Model and Validator -------------------------------------

        const authRequestModel = restApi.addModel('AuthRequestModel', {
            modelName: 'AuthRequestModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    username: { type: JsonSchemaType.STRING },
                    password: { type: JsonSchemaType.STRING },
                },
                required: ['username', 'password'],
            },
        });
        const authRefreshRequestModel = restApi.addModel('AuthRefreshRequestModel', {
            modelName: 'AuthRefreshRequestModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    refreshToken: { type: JsonSchemaType.STRING },
                },
                required: ['refreshToken'],
            },
        });

        const authResponseModel = restApi.addModel('AuthResponseModel', {
            modelName: 'AuthResponseModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    idToken: { type: JsonSchemaType.STRING },
                    refreshToken: { type: JsonSchemaType.STRING },
                    expiresIn: { type: JsonSchemaType.NUMBER },
                },
                required: ['idToken', 'refreshToken', 'expiresIn'],
            },
        });

        const imageSchema: JsonSchema = {
            type: JsonSchemaType.OBJECT,
            properties: {
                name: { type: JsonSchemaType.STRING },
                url: { 
                    type: JsonSchemaType.STRING,
                    format: 'uri',
                },
                size: { type: JsonSchemaType.NUMBER },
                lastModified: { 
                    type: JsonSchemaType.STRING,
                    format: 'date-time',
                },
            },
            required: ['name', 'url', 'size'],
        }
        const imageResponseModel = restApi.addModel('ImageResponseModel', {
            modelName: 'ImageResponseModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: imageSchema,
        });
        const imagesResponseModel = restApi.addModel('ImagesResponseModel', {
            modelName: 'ImagesResponseModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.ARRAY,
                items: imageSchema,
            },
        });

        const putImageRequestModel = restApi.addModel('PutImageRequestModel', {
            modelName: 'PutImageRequestModel',
            contentType: ContentType.IMAGE_JPEG,
            schema: {
                type: JsonSchemaType.STRING,
                format: 'binary',
            },
        });

        const sealUploadUrlResponseModel = restApi.addModel('SealUploadUrlResponseModel', {
            modelName: 'SealUploadUrlResponseModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    url: { 
                        type: JsonSchemaType.STRING,
                        format: 'uri',
                    },
                },
                required: ['url'],
            },
        });

        const errorResponseModel = restApi.addModel('ErrorResponseModel', {
            modelName: 'ErrorResponseModel',
            contentType: ContentType.APPLICATION_JSON,
            schema: {
                type: JsonSchemaType.OBJECT,
                properties: {
                    // message自体はそんなに重要でないので、enumで定義しない.
                    message: { type: JsonSchemaType.STRING },
                },
                required: ['message'],
            },
        });

        const methodErrorResponse = (statusCode: string) => ({
            statusCode: statusCode,
            responseModels: {
                [ContentType.APPLICATION_JSON]: errorResponseModel
            },
        });
        const methodErrorResponses = {
            400: methodErrorResponse('400'),
            401: methodErrorResponse('401'),
            404: methodErrorResponse('404'),
            429: methodErrorResponse('429'),
            500: methodErrorResponse('500'),
        };

        const authMethodResponses = [
            {
                statusCode: '200',
                responseModels: {
                    [ContentType.APPLICATION_JSON]: authResponseModel,
                },
            },
            methodErrorResponses[400],
            methodErrorResponses[401],
            methodErrorResponses[429],
            methodErrorResponses[500],
        ];

         // API Gateway Rest API Routing -------------------------------------

        const auth =restApi.root.addResource('auth')
        const images = restApi.root
            .addResource('seals')
            .addResource('{sealId}')
            .addResource('images');
        const image = images.addResource('{imageKey}')

        auth.addMethod('POST', new LambdaIntegration(authFunction.func), {
            requestModels: {
                [ContentType.APPLICATION_JSON]: authRequestModel,
            },
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: false,
            },
            methodResponses: authMethodResponses,
        });
        auth.addResource('refresh').addMethod('POST', new LambdaIntegration(authRefreshFunction.func), {
            requestModels: {
                [ContentType.APPLICATION_JSON]: authRefreshRequestModel,
            },
            requestValidatorOptions: {
                validateRequestBody: true,
                validateRequestParameters: false,
            },
            methodResponses: authMethodResponses,
        });

        image.addMethod('PUT', new LambdaIntegration(putObjectFunction.func), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: cognitoAuthorizer,
            requestModels: {
                [ContentType.IMAGE_JPEG]: putImageRequestModel,
            },
            methodResponses: [
                {
                    statusCode: '200',
                },
                methodErrorResponses[400],
                methodErrorResponses[401],
                methodErrorResponses[500],
            ],
        });
        image.addMethod('GET', new LambdaIntegration(getImageFunction.func), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: cognitoAuthorizer,
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        [ContentType.APPLICATION_JSON]: imageResponseModel,
                    },
                },
                methodErrorResponses[400],
                methodErrorResponses[401],
                methodErrorResponses[404],
                methodErrorResponses[500],
            ],
        });
        images.addMethod('GET', new LambdaIntegration(findImagesFunction.func), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: cognitoAuthorizer,
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        [ContentType.APPLICATION_JSON]: imagesResponseModel,
                    },
                },
                methodErrorResponses[400],
                methodErrorResponses[401],
                methodErrorResponses[404],
                methodErrorResponses[500],
            ],
        });

        image.addResource('upload-url').addMethod('POST', new LambdaIntegration(publishUploadUrlFunction.func), {
            authorizationType: AuthorizationType.COGNITO,
            authorizer: cognitoAuthorizer,
            methodResponses: [
                {
                    statusCode: '200',
                    responseModels: {
                        [ContentType.APPLICATION_JSON]: sealUploadUrlResponseModel,
                    },
                },
                methodErrorResponses[400],
                methodErrorResponses[401],
                methodErrorResponses[500],
            ],
        });
    }
}
