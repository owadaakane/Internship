import { Environment } from 'aws-cdk-lib';

// TODO: `pictlink-cdk`がnpm packageとして配布されれば置き換える.

/**
 * ピクトリンクのAWSアカウント
 */
export const Account = {
    ENTRANCE: 'furyu-entrance',
    SANDBOX: 'pictlink-sandbox',
    DEVELOPMENT: 'pictlink-development',
    PRODUCTION: 'pictlink-production',
} as const;
/**
 * ピクトリンクのAWSアカウントを表す.
 */
export type Account = (typeof Account)[keyof typeof Account];

/**
 * ピクトリンクのAWSアカウントのスタック名のプレフィックス.
 */
export const stackNamePrefix = {
    [Account.ENTRANCE]: '',
    [Account.SANDBOX]: 'sandbox-',
    [Account.DEVELOPMENT]: 'dev-',
    [Account.PRODUCTION]: 'prod-',
};

/**
 * AWSリソースを構築するデフォルトのリージョン
 */
export const DEFAULT_REGION = 'ap-northeast-1';

/**
 * 各AWSアカウントごとの`Environment`
 */
export const deploymentEnvByAccount: Readonly<Record<Account, Environment>> = {
    [Account.ENTRANCE]: {
        account: '957107525316',
        region: DEFAULT_REGION,
    },
    [Account.SANDBOX]: {
        account: '457433307823',
        region: DEFAULT_REGION,
    },
    [Account.DEVELOPMENT]: {
        account: '312174145435',
        region: DEFAULT_REGION,
    },
    [Account.PRODUCTION]: {
        account: '438822470009',
        region: DEFAULT_REGION,
    },
};

/**
 * profileで指定したcredentialから、`Account`を取得する.
 *
 * @returns
 */
export function getContextAccount(): Account {
    return findAccountById(process.env.CDK_DEFAULT_ACCOUNT) ?? Account.DEVELOPMENT;
}

/**
 * AWSアカウントIDから`Account`を取得する.
 *
 * @param id
 * @returns
 */
export function findAccountById(id?: string): Account | undefined {
    return Object.entries(deploymentEnvByAccount).find(([, e]) => e.account === id)?.[0] as Account;
}

/**
 * 全AWSアカウントの`Environment`を取得する.
 *
 * @returns - 全AWSアカウントの`Environment`
 */
export function deployEnvironments(): Environment[] {
    return Object.values(deploymentEnvByAccount);
}
