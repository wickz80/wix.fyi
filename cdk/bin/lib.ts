#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { HostStack } from '../lib/host-stack'

const app = new cdk.App()
new HostStack(app, 'HostStack', {
  domainName: 'wix.fyi',
  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' },
})
