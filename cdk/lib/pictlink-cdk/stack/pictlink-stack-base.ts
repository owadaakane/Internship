import { RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as env from '../env';

// TODO: `pictlink-cdk`がnpm packageとして配布されれば置き換える.

/**
 * ピクトリンクに特化したStackのベースクラス.
 * `StackProps`で指定した`stackName`には、自動で各アカウントに応じたprefixが付与される.
 * また、明示的に`env`を指定しない場合は、自動で各アカウントに応じた`env`が設定される.
 */
export abstract class PictlinkStackBase extends Stack {
    /**
     * ピクトリンクのAWSアカウント.
     */
    get pictlinkAccount(): env.Account {
        return this._pictlinkAccount ?? (this._pictlinkAccount = env.findAccountById(this.account)!);
    }

    /**
     * Production環境向きかどうか.
     */
    get isProduction(): boolean {
        return this.pictlinkAccount === env.Account.PRODUCTION;
    }

    /**
     * デフォルトの削除ポリシー.
     * 本番環境の場合は`RETAIN`、それ以外は`DESTROY`.
     */
    get defaultRemovalPolicy(): RemovalPolicy {
        return this.isProduction ? RemovalPolicy.RETAIN : RemovalPolicy.DESTROY;
    }

    /**
     * スタック名のプレフィックス.
     */
    readonly stackNamePrefix: string;

    private _pictlinkAccount?: env.Account;

    constructor(scope: Construct, id: string, props?: StackProps) {
        const account = env.getContextAccount();
        const stackNamePrefix = env.stackNamePrefix[account];

        super(scope, id, {
            stackName: `${stackNamePrefix}${props?.stackName}`,
            env: props?.env ?? env.deploymentEnvByAccount[account],
        });

        this.stackNamePrefix = stackNamePrefix;
    }

    /**
     * exportValueのWrapper.
     * スタック名を`name`に付与し、exportする.
     *
     * @param exportedValue
     * @param name
     * @returns
     */
    export(exportedValue: any, name: string): string {
        return super.exportValue(exportedValue, {
            name: `${this.stackName}-${name}`,
        });
    }

    /**
     * exrpotStringListValueのWrapper.
     * スタック名を`name`に付与し、exportする.
     *
     * @param exportedValue
     * @param name
     * @returns
     */
    exportStringList(exportedValue: any, name: string): string[] {
        return super.exportStringListValue(exportedValue, {
            name: `${this.stackName}-${name}`,
        });
    }
}
