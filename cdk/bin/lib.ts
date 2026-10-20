#!/usr/bin/env node
import 'source-map-support/register'
import * as cdk from 'aws-cdk-lib'
import { HostStack } from '../lib/host-stack'
import { PhosphorLoopStack } from '../lib/phosphor-loop-stack'

const app = new cdk.App()
const env = { account: process.env.CDK_DEFAULT_ACCOUNT, region: 'us-east-1' }
const phosphorLoop = new PhosphorLoopStack(app, 'PhosphorLoopStack', { env })
new HostStack(app, 'HostStack', {
  domainName: 'wix.fyi',
  phosphorLoop,
  env
})
