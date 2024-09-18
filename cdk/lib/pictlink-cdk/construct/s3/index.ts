export * from './bucket-allowed-access-point-only';
export * from './access-point';
export * from './inhouse-bucket';

import * as env from '../../env';

/**
 * ピクトリンクの各AWSアカウントのバケット名のサフィックス.
 */
export const bucketNameSuffixByAccount = {
    [env.Account.ENTRANCE]: '-entrance',
    [env.Account.SANDBOX]: '-sandbox',
    [env.Account.DEVELOPMENT]: '-dev',
    [env.Account.PRODUCTION]: '',
};

/**
 * ピクトリンクの各AWSアカウントに応じて、バケット名を変換する.
 *
 * @param name
 * @param account
 * @returns
 */
export function convertBucketNameByAccount(name: string, account: env.Account): string {
    return `${name}${bucketNameSuffixByAccount[account]}`;
}
