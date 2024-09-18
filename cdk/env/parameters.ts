import { Account } from 'pictlink-cdk/env';
import { batch } from 'pictlink-cdk/lib';

/**
 * voyager-batchでサポートされているAWSアカウント.
 */
export type DeploymentAccount = typeof Account.DEVELOPMENT | typeof Account.PRODUCTION;
