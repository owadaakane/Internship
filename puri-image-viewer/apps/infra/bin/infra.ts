#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PuriImageViewerStack } from '../lib/puri-image-viewer-stack';

const app = new cdk.App();

const group: Group | undefined = app.node.tryGetContext('group');
if (!group) {
    throw new Error('Group is not specified.');
}

new PuriImageViewerStack(app, `PuriImageViewerForInternshipGroup${group}`, {
  stackName: `puri-image-viewer-for-internship-group-${group.toLowerCase()}`,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

const Group = {
  A: 'A',
  B: 'B',
} as const;

type Group = typeof Group[keyof typeof Group];
