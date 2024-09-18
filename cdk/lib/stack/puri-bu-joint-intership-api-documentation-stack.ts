import * as cdk from 'aws-cdk-lib';
import { PictlinkStackBase, s3 } from '../pictlink-cdk';
import { Construct } from 'constructs';
import { CfnDocumentationPart, CfnDocumentationVersion } from 'aws-cdk-lib/aws-apigateway';

interface StackProps extends cdk.StackProps {
    /**
     * プロジェクト名.
     */
    readonly projectName: string;
    /**
     * 対象のAPI GatewayのRestAPI.
     */
    readonly restApiId: string;
    /**
     * ドキュメントのバージョン.
     */
    readonly documentationVersion: string;
    /**
     * ドキュメントのバージョンの説明.
     */
    readonly description: string;
}

/**
 * プリBUとピクトリンクの合同インターシップで使用するAPIのドキュメントを作成するStack.
 */
export class PuriBuJointIntershipApiDocumentationStack extends PictlinkStackBase {
    constructor(scope: Construct, id: string, props: StackProps) {
        super(scope, id, props);
    
        const documentationVersion = new CfnDocumentationVersion(this, 'DocumentationVersion', {
            restApiId: props.restApiId,
            documentationVersion: props.documentationVersion,
            description: props.description,
        });
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'APIDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'API',
                },
                properties: JSON.stringify({
                    description: 'プリBUとピクトリンクの合同インターシップで使用するAPI群.',
                    summary: 'インターンシップ用API',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'AuthDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/auth',
                    method: 'POST',
                },
                properties: JSON.stringify({
                    description: 'Cognitoによるパスワード認証を実行し、各種APIを呼び出すために利用するIDTokenを返却するAPI.',
                    summary: '認証API',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'AuthRefreshDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/auth/refresh',
                    method: 'POST',
                },
                properties: JSON.stringify({
                    description: '/authエンドポイントで発行したIDTokenを更新するAPI.',
                    summary: 'IDToken更新API',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'AuthorizerDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'AUTHORIZER',
                    name: `${props.projectName}-cognito-authorizer`,
                },
                properties: JSON.stringify({
                    description: 'Authorizetion: {IDToken} の形式で、authエンドポイントで発行したIDTokenをヘッダーに設定する.',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'ImagesDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/seals/{sealId}/images',
                    method: 'GET',
                },
                properties: JSON.stringify({
                    description: '指定されたシールIDに関連する画像一覧を取得するAPI.',
                    summary: '画像一覧取得API',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'ImageDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/seals/{sealId}/images/{imageKey}',
                    method: 'GET',
                },
                properties: JSON.stringify({
                    description: '指定されたシールIDとキーと一致する画像を取得するAPI. 画像のURLは有効期限付きのURLを返却する.',
                    summary: '画像取得API',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'PutImageDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/seals/{sealId}/images/{imageKey}',
                    method: 'PUT',
                },
                properties: JSON.stringify({
                    description: '指定されたSealIdとImageKeyに紐づく画像をアップロードするAPI. 画像はJPEG形式でアップロードする.',
                    summary: '画像アップロードAPI',
                }),
            })
        );
        documentationVersion.addDependency(
            new CfnDocumentationPart(this, 'UploadUrlDocumentation', {
                restApiId: props.restApiId,
                location: {
                    type: 'METHOD',
                    path: '/seals/{sealId}/images/{imageKey}/upload-url',
                    method: 'POST',
                },
                properties: JSON.stringify({
                    description: '指定したSealIdとImageKeyに紐づく画像アップロード用の有効期限付きのURLを発行するAPI.',
                    summary: '画像アップロードURL発行API',
                }),
            })
        );

        // TODO: エクスポートして、自動デプロイするCustomResourceを作成する.
        new s3.InhouseBucket(this, 'ApiDocsBucket', {
            bucketName: `${props.projectName}-api-docs`,
            removalPolicy: this.defaultRemovalPolicy,
        });
    }
}
