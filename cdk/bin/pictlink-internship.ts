#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Account, getContextAccount } from '../lib/pictlink-cdk/env';
import { PuriBuJointInternshipStack } from '../lib/stack/puri-bu-joint-internship-stack';
import assert = require('assert');
import { PuriBuJointIntershipApiDocumentationStack } from '../lib/stack/puri-bu-joint-intership-api-documentation-stack';

const projectName = 'puri-bu-joint-internship';

const app = new cdk.App();
assert(Account.SANDBOX === getContextAccount(), 'Internship stack can be deployed only to sandbox account.');


const puriBuJointInternshipStack = new PuriBuJointInternshipStack(app, 'PuriBuJointInternshipStack', {
    stackName: projectName,
    projectName: projectName,
});

new PuriBuJointIntershipApiDocumentationStack(app, 'PuriBuJointIntershipApiDocumentationStack', {
    stackName: `${projectName}-api-documentation`,
    projectName: projectName,
    restApiId: puriBuJointInternshipStack.restApi.restApiId,
    documentationVersion: 'v1.0.0',
    description: '初版',
});
