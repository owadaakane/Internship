import * as cdk from 'aws-cdk-lib';
import {
    aws_iam as iam,
    aws_lambda as lambda,
    aws_lambda_nodejs as lambdaN,
    aws_ec2 as ec2,
    aws_logs as logs,
} from 'aws-cdk-lib';
import { Construct, IConstruct } from 'constructs';
import { Permission } from 'aws-cdk-lib/aws-lambda';

/**
 * Properties for LambdaNodeJsFunction construct.
 */
export interface NodeJsFunctionProps {
    /**
     * The runtime environment to use.
     *
     * Default: lambda.Runtime.NODEJS_18_X
     */
    readonly runtime?: lambda.Runtime;
    /**
     * The name of the Lambda function.
     */
    readonly functionName: string;
    /**
     * The path to the entry file (JavaScript or TypeScript).
     * Path should be relative to the root directory of the CDK app.
     * e.g. 'lambda/index.ts'
     */
    readonly entry: string;
    /**
     * The name of the exported handler in the entry file.
     *
     * @default - 'handler'
     */
    readonly handler?: string;
    /**
     * The external modules to be included in the Lambda function.
     * include the 'aws-sdk' and 'aws-lambda' by default.
     *
     * @default - ['aws-sdk', 'aws-lambda']
     */
    readonly externalModules?: string[];
    /**
     * The amount of memory, in MB, that is allocated to Lambda function.
     *
     * @default - 256 MB
     */
    readonly memorySize?: number;
    /**
     * The environment variables that are accessible from function code during execution.
     *
     * @default - No environment variables.
     */
    readonly environment?: { [key: string]: string };
    /**
     * The function execution time (in minutes) after which Lambda terminates the function.
     *
     * @default - 5 minutes
     */
    readonly timeoutMinutes?: number;
    /**
     * The number of days log events are kept in CloudWatch Logs(/aws/lambda/{functionName}).
     *
     * @default - RetentionDays.ONE_WEEK
     */
    readonly logRetensionDays?: logs.RetentionDays;
    /**
     * Specify this if the Lambda function needs to access resources in a VPC.
     *
     * @default - No vpc id
     */
    readonly vpc?: ec2.IVpc;
    /**
     * Only used if 'vpc' is supplied.
     *
     * @default - No vpc subnet ids
     */
    readonly subnetSelection?: ec2.SubnetSelection;
    /**
     * An ingress rule for the SecurityGroup of Lambda function.
     *
     * @default - No rule
     */
    readonly securityGroupIngressRule?: SecurityGroupRule;
    /**
     * An egress rule for the SecurityGroup of Lambda function.
     *
     * @default - No rule
     */
    readonly securityGroupEgressRule?: SecurityGroupRule;
}

/**
 * Properties for SecurityGroup ingress and engress rule.
 */
export interface SecurityGroupRule {
    /**
     * The IP protocol name (TCP, UDP etc) or SecurityGroup id.
     *
     * see: @type {Peer}
     */
    readonly peer: ec2.IPeer;
    /**
     * The port range.
     */
    readonly connection: ec2.Port;
}

/**
 * Construct that generates a Lambda function with Node.js runtime.
 */
export class NodeJsFunction extends Construct {
    // Use the 'aws-sdk' and 'aws-lambda' available in the Lambda runtime.
    static readonly DEFAULT_EXTERNAL_MODULES = [
        '@aws-sdk/*',
        'aws-lambda',
    ];
    static readonly DEFAULT_TIMEOUT_MINUTES = 5;
    static readonly DEFAULT_MEMORY_SIZE = 256;
    static readonly DEFAULT_LOG_RETENTION_DAYS = logs.RetentionDays.ONE_WEEK;

    readonly func: lambda.IFunction;

    constructor(scope: Construct, id: string, props: NodeJsFunctionProps) {
        super(scope, id);

        const managedPolicyName = props.vpc
            ? 'service-role/AWSLambdaVPCAccessExecutionRole'
            : 'service-role/AWSLambdaBasicExecutionRole';
        
        const role = new iam.Role(this, 'Role', {
            roleName: `${props.functionName}-role`,
            description: `To exec ${props.functionName}`,
            path: '/service-role/',
            assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
            managedPolicies: [iam.ManagedPolicy.fromAwsManagedPolicyName(managedPolicyName)],
        });

        const defaultSecurityGroup = (vpc: ec2.IVpc) => {
            const ingressRule = props.securityGroupIngressRule;
            const engressRule = props.securityGroupEgressRule;
            const sg = new ec2.SecurityGroup(this, 'SecurityGroup', {
                securityGroupName: `${props.functionName}-sg`,
                description: `${props.functionName}-sg`,
                vpc: vpc,
                allowAllOutbound: !engressRule,
            });

            if (ingressRule) {
                sg.addIngressRule(ingressRule.peer, ingressRule.connection);
            }
            if (engressRule) {
                sg.addEgressRule(engressRule.peer, engressRule.connection);
            }
            return sg;
        };
    
        this.func = new lambdaN.NodejsFunction(this, 'NodeJsFunction', {
            functionName: props.functionName,
            entry: props.entry,
            handler: props.handler,
            runtime: props.runtime ?? lambda.Runtime.NODEJS_20_X,
            memorySize: props.memorySize ?? NodeJsFunction.DEFAULT_MEMORY_SIZE,
            timeout: cdk.Duration.minutes(props.timeoutMinutes ?? NodeJsFunction.DEFAULT_TIMEOUT_MINUTES),
            awsSdkConnectionReuse: true,
            environment: props.environment,
            vpc: props.vpc,
            vpcSubnets: props.subnetSelection,
            architecture: lambda.Architecture.ARM_64,
            // Automatically generate log group(`/aws/lambda/{functionName}`).
            logRetention: props.logRetensionDays ?? NodeJsFunction.DEFAULT_LOG_RETENTION_DAYS,
            tracing: lambda.Tracing.PASS_THROUGH,
            // insightsVersion: lambda.LambdaInsightsVersion.VERSION_1_0_143_0,
            securityGroups: props.vpc && [defaultSecurityGroup(props.vpc!)],
            // Automatically generate, but generate own to match naming with other project.
            role: role,
            currentVersionOptions: {
                removalPolicy: cdk.RemovalPolicy.RETAIN,
            },
            bundling: {
                forceDockerBundling: false,
                externalModules: NodeJsFunction.DEFAULT_EXTERNAL_MODULES.concat(props.externalModules ?? []),
                minify: true,
                keepNames: true,
                metafile: false,
                sourceMap: true,
                sourceMapMode: lambdaN.SourceMapMode.INLINE,
                logLevel: lambdaN.LogLevel.WARNING,
                charset: lambdaN.Charset.UTF8,
            },
        });
    }

    /**
     * Adds a permission to the Lambda resource policy for API Gateway.
     * Allow action`lambda:InvokeFunction` from the API Gateway of the specified apiId.
     *
     * FIXME: use `lambdaFunction.grantInvokeUrl` instead of `lambdaFunction.addPermission`.
     *
     * @param apiId
     */
    addPermissionForApiGateway(apiId: string) {
        const permission = NodeJsFunction.permissionForApiGateway(this, apiId);
        this.func.addPermission('LambdaPermissionForApiGateway', permission);
    }

    /**
     * The version of the Lambda function.
     * A new version will be created every time the function's　configuration changes.
     */
    publishCurrentVersionIfChanged(): lambda.IVersion {
        return (this.func as lambda.Function).currentVersion;
    }

    /**
     * Adds a managed policy to the Lambda execution role.
     *
     * @param policy
     */
    addToManagedPolicy(policy: iam.IManagedPolicy) {
        this.func.role?.addManagedPolicy(policy);
    }
}

export namespace NodeJsFunction {
    /**
     * Permission to invoke Lambda function from API Gateway.
     *
     * @param scope
     * @param apiId
     * @returns
     */
    export const permissionForApiGateway = (scope: IConstruct, apiId: string): Permission => {
        return {
            action: 'lambda:InvokeFunction',
            principal: new iam.ServicePrincipal('apigateway.amazonaws.com'),
            sourceArn: cdk.Stack.of(scope).formatArn({
                service: 'execute-api',
                resource: `${apiId}/*`,
            }),
        };
    };
}
