import { aws_s3 as s3, aws_iam as iam, Stack } from 'aws-cdk-lib';
import { Construct } from 'constructs';

/**
 * S3バケットのアクセスポイントを作成するConstructのプロパティ.
 */
export interface AccessPointProps extends AccessPointBasicProps {
    /**
     * アクセスポイントに許可されるアクションリスト.
     */
    readonly actions: string[];
}

/**
 * S3バケットのアクセスポイントを作成するConstructのプロパティ.
 */
export interface AccessPointBasicProps {
    /**
     * アクセスポイントを作成するS3バケットの名前.
     */
    readonly bucketName: string;
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
    /**
     * S3バケットに対して、アクションを許可されるプリンシパル.
     * 複数指定する場合は、`iam.CompositePrincipal`で指定する.
     *
     * @default AnyPrincipal
     */
    readonly principal?: iam.IPrincipal;
    readonly customCondition?: any;
    /**
     * アクセスを許可するオブジェクトのプレフィックス.
     *
     * @default - アクセスポイントのルートに対するアクセスを許可する
     */
    readonly prefixes?: string[];
}

/**
 * アクセスポイントに対するIAMポリシーを作成するためのプロパティ.
 */
export interface CreateManagedPolicyProps {
    /**
     * アクセスを許可するオブジェクトのプレフィックス.
     *
     * @default - アクセスポイントのポリシーと同等
     */
    readonly prefixes?: string[];
}

/**
 * S3バケットのアクセスポイント.
 */
export interface IAccessPoint {
    /**
     * アクセスポイントの名前.
     */
    readonly name: string;
    /**
     * アクセスポイントのエイリアス.
     */
    readonly arn: string;
    /**
     * アクセスポイントのエイリアス.
     */
    readonly alias: string;
    /**
     * アクセスポイントのネットワークオリジン.
     */
    readonly networkOrigin: string;

    /**
     * このアクセスポイントに対するIAMポリシーを作成する.
     *
     * @param scope
     * @param id
     * @returns
     */
    createManagedPolicy(scope: Construct, id: string, props?: CreateManagedPolicyProps): iam.ManagedPolicy;
}

/**
 * S3バケットのアクセスポイントを作成するConstruct.
 */
export class AccessPoint extends Construct implements IAccessPoint {
    /**
     * オブジェクトの読み込み専用のアクセスポイントを作成する.
     *
     * @param scope
     * @param id
     * @param props
     * @returns
     */
    static readonly(scope: Construct, id: string, props: AccessPointBasicProps): AccessPoint {
        return new AccessPoint(scope, id, {
            accessPointName: props.accessPointName ?? `${props.bucketName}-readonly-ap`,
            actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:ListBucket',
                's3:ListBucketVersions',
                's3:GetObjectAcl',
                's3:GetObjectVersionAcl',
                's3:ListBucketMultipartUploads',
            ],
            ...props,
        });
    }

    /**
     * オブジェクトの読み書きが可能なアクセスポイントを作成する.
     *
     * @param scope
     * @param id
     * @param props/Users/0fr114001/workspace/github/cloud-infra/cdk/packages/pictlink-cdk/lib/construct/s3/bucket-allowed-access-point.ts
     * @returns
     */
    static readWrite(scope: Construct, id: string, props: AccessPointBasicProps): AccessPoint {
        return new AccessPoint(scope, id, {
            accessPointName: props.accessPointName ?? `${props.bucketName}-readwrite-ap`,
            actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:ListBucket',
                's3:ListBucketVersions',
                's3:GetObjectAcl',
                's3:GetObjectVersionAcl',
                's3:ListBucketMultipartUploads',
                's3:PutObject',
                's3:PutObjectAcl',
                's3:DeleteObject',
                's3:AbortMultipartUpload',
            ],
            ...props,
        });
    }

    get name(): string {
        return this.accessPoint.attrName;
    }

    get arn(): string {
        return this.accessPoint.attrArn;
    }

    get alias(): string {
        return this.accessPoint.attrAlias;
    }

    get networkOrigin(): string {
        return this.accessPoint.attrNetworkOrigin;
    }

    private accessPoint: s3.CfnAccessPoint;
    private props: AccessPointProps;
    private resourceArns: string[];

    constructor(scope: Construct, id: string, props: AccessPointProps) {
        super(scope, id);
        this.props = props;

        const stack = Stack.of(this);
        const accessPointArn = `arn:aws:s3:${stack.region}:${stack.account}:accesspoint/${props.accessPointName}`;
        this.resourceArns = (
            props.prefixes?.map((p) => `${accessPointArn}/object/${p}/*`) ?? [`${accessPointArn}/object/*`]
        ).concat(accessPointArn);

        const principal = props.principal ?? new iam.AnyPrincipal();
        this.accessPoint = new s3.CfnAccessPoint(this, 'AccessPoint', {
            bucket: props.bucketName,
            name: props.accessPointName,
            bucketAccountId: stack.account,
            publicAccessBlockConfiguration: {
                blockPublicAcls: true,
                blockPublicPolicy: true,
                ignorePublicAcls: true,
                restrictPublicBuckets: true,
            },
            vpcConfiguration: {
                vpcId: props.vpcId,
            },
            policy: {
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Action: props.actions,
                        Resource: this.resourceArns,
                        Principal: principal.policyFragment.principalJson,
                        Condition: props.customCondition || (
                            props.vpcEndpointId 
                                ? {
                                    StringEquals: {
                                        'aws:SourceVpce': props.vpcEndpointId,
                                    },
                                } 
                                : {
                                    StringEquals: {
                                        'aws:userid': stack.account,
                                    },
                                }
                        ),
                    },
                ],
            },
        });
    }

    createManagedPolicy(scope: Construct, id: string, props?: CreateManagedPolicyProps): iam.ManagedPolicy {
        const resources =
            props?.prefixes?.map((p) => `${this.arn}/object/${p}/*`).concat(this.arn) ?? this.resourceArns;
        return new iam.ManagedPolicy(scope, id, {
            description: `To access ${this.name}.`,
            statements: [
                new iam.PolicyStatement({
                    effect: iam.Effect.ALLOW,
                    actions: this.props.actions,
                    resources: resources,
                }),
            ],
        });
    }
}
