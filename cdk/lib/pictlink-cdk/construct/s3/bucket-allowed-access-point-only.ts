import { RemovalPolicy, aws_s3 as s3, aws_iam as iam, Stack, Duration } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AccessPoint, IAccessPoint } from './access-point';

/**
 * アクセスポイントのみでアクセス可能なS3バケットを作成するConstructのプロパティ.
 */
export interface BucketAllowedAccessPointOnlyProps {
    /**
     * S3バケット名.
     */
    readonly name: string;
    /**
     * S3バケットの削除ポリシー.
     *
     * @default RemovalPolicy.RETAIN
     */
    readonly removalPolicy?: RemovalPolicy;
    /**
     * オブジェクトの有効期限.
     *
     * @default 有効期限なし
     */
    readonly lifecycleRules?: SimpleLifecycleRule[];
    /**
     * S3バケットに対して、アクションを許可されるプリンシパル.
     * 複数指定する場合は、`iam.CompositePrincipal`で指定する.
     *
     * @default AnyPrincipal
     */
    readonly principal?: iam.IPrincipal;
}

/**
 * S3バケットのオブジェクトのライフサイクルを設定するためのプロパティ.
 */
export interface SimpleLifecycleRule {
    /**
     * ライフサイクルを設定するオブジェクトのプレフィックス.
     *
     * @default すべてのオブジェクト
     */
    readonly prefix?: string;
    /**
     * オブジェクトの有効期限.
     */
    readonly expiration: Duration;
    /**
     * `INFREQUENT_ACCESS`に移行するまでの期間.
     */
    readonly transitionAfter?: Duration;
}

/**
 * アクセスポイントを追加する際に指定するプロパティ.
 */
export interface AddAccessPointProps extends AddAccessPointBasicProps {
    /**
     * アクセスポイントに許可されるアクションリスト.
     */
    readonly actions: string[];
}

/**
 * アクセスポイントを追加する際に指定するプロパティ.
 */
export interface AddAccessPointBasicProps {
    /**
     * アクセスポイントの名前.
     */
    readonly accessPointName?: string;
    /**
     * アクセスポイントを作成するVPCのID.
     *
     * @default - 指定しない場合は、ネットワークオリジンがINTERNETになる.
     */
    readonly vpcId?: string;
    /**
     * 経由するVPCエンドポイントのID.
     *
     * @default - 明示的に指定されない
     */
    readonly vpcEndpointId?: string;
    readonly customCondition?: any;
    /**
     * S3バケットに対して、アクションを許可されるプリンシパル.
     * 複数指定する場合は、`iam.CompositePrincipal`で指定する.
     *
     * @default AnyPrincipal
     */
    readonly principal?: iam.IPrincipal;
    /**
     * アクセスを許可するオブジェクトのプレフィックス.
     *
     * @default - アクセスポイントのルートに対するアクセスを許可する
     */
    readonly prefixes?: string[];
}

/**
 * アクセスポイントを追加できるS3バケット.
 */
export interface IBucketAccessPointAddable extends s3.IBucket {
    /**
     * バケットにアクセスポイントを追加する.
     *
     * @param scope
     * @param id
     * @param props
     * @returns
     */
    addAccessPoint(scope: Construct, id: string, props: AddAccessPointProps): IAccessPoint;

    /**
     * バケットに読み取り専用アクセスポイントを追加する.
     * propsを指定しない場合は、networkOriginが`INTERNET`になる.
     *
     * @param scope
     * @param id
     * @param props
     */
    addReadonlyAccessPoint(scope: Construct, id: string, props?: AddAccessPointBasicProps): IAccessPoint;

    /**
     * バケットに読み書き可能なアクセスポイントを追加する.
     * propsを指定しない場合は、networkOriginが`INTERNET`になる.
     *
     * @param scope
     * @param id
     * @param props
     */
    addReadWriteAccessPoint(scope: Construct, id: string, props?: AddAccessPointBasicProps): IAccessPoint;
}

/**
 * アクセスポイントのみでアクセス可能なS3バケットを作成するConstruct.
 */
export class BucketAllowdAccessPointOnly extends s3.Bucket implements IBucketAccessPointAddable {
    constructor(scope: Construct, id: string, props: BucketAllowedAccessPointOnlyProps) {
        super(scope, id, {
            bucketName: props.name,
            removalPolicy: props.removalPolicy,
            accessControl: s3.BucketAccessControl.PRIVATE,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            encryption: s3.BucketEncryption.S3_MANAGED,
            lifecycleRules: props.lifecycleRules?.map((e, i) => {
                return {
                    id: `${props.name}-Lifecycle-Rule-${i + 1}`,
                    enabled: true,
                    expiration: e.expiration,
                    prefix: e.prefix,
                    transitions: e.transitionAfter && [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: e.transitionAfter,
                        }
                    ]
                };
            }),
        });

        const resources = [this.bucketArn, this.arnForObjects('*')];
        this.addToResourcePolicy(
            new iam.PolicyStatement({
                actions: ['s3:*'],
                effect: iam.Effect.ALLOW,
                principals: [props.principal ?? new iam.AnyPrincipal()],
                resources: resources,
                conditions: {
                    StringEquals: {
                        's3:DataAccessPointAccount': Stack.of(this).account,
                    },
                },
            })
        );
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
    }

    addAccessPoint(scope: Construct, id: string, props: AddAccessPointProps): AccessPoint {
        return new AccessPoint(scope, id, {
            bucketName: this.bucketName,
            ...props,
        });
    }

    addReadonlyAccessPoint(scope: Construct, id: string, props?: AddAccessPointBasicProps): AccessPoint {
        return AccessPoint.readonly(scope, id, {
            bucketName: this.bucketName,
            ...props,
        });
    }

    addReadWriteAccessPoint(scope: Construct, id: string, props?: AddAccessPointBasicProps): AccessPoint {
        return AccessPoint.readWrite(scope, id, {
            bucketName: this.bucketName,
            ...props,
        });
    }
}
