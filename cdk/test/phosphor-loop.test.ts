import * as cdk from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { runInNewContext } from 'vm'
import { HostStack } from '../lib/host-stack'
import { PhosphorLoopStack } from '../lib/phosphor-loop-stack'

const app = new cdk.App()
const env = { account: '097029023067', region: 'us-east-1' }
const phosphorLoop = new PhosphorLoopStack(app, 'PhosphorLoopStack', { env })
const stack = new HostStack(app, 'HostStack', { domainName: 'wix.fyi', env, phosphorLoop })
const template = Template.fromStack(stack)
const appTemplate = Template.fromStack(phosphorLoop)

test('the app bucket is private, separate from Gatsby, and retained on stack removal', () => {
  appTemplate.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'wix-fyi-phosphor-loop-097029023067',
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true, BlockPublicPolicy: true,
      IgnorePublicAcls: true, RestrictPublicBuckets: true
    }
  })
  const buckets = appTemplate.findResources('AWS::S3::Bucket')
  const loopId = Object.keys(buckets).find(id => buckets[id].Properties.BucketName === 'wix-fyi-phosphor-loop-097029023067')!
  expect(buckets[loopId].DeletionPolicy).toBe('Retain')
  const deploy = Object.values(template.findResources('Custom::CDKBucketDeployment'))[0]
  expect(deploy.Properties.DestinationBucketName).not.toEqual({ Ref: loopId })
})

test('only /loop routes select the private app origin', () => {
  const distribution = Object.values(template.findResources('AWS::CloudFront::Distribution'))[0].Properties.DistributionConfig
  expect(distribution.CacheBehaviors.map((b: any) => b.PathPattern).sort()).toEqual(['/loop', '/loop/*'])
  for (const behavior of distribution.CacheBehaviors) {
    expect(behavior.TargetOriginId).not.toEqual(distribution.DefaultCacheBehavior.TargetOriginId)
    expect(behavior.FunctionAssociations[0].EventType).toBe('viewer-request')
  }
})

test('the edge handler redirects the public entrypoint and strips its prefix for bucket keys', () => {
  const resource = Object.values(template.findResources('AWS::CloudFront::Function'))[0]
  const context: any = {}
  runInNewContext(resource.Properties.FunctionCode, context)
  const redirect = context.handler({ request: { uri: '/loop' } })
  expect(redirect.statusCode).toBe(308)
  expect(redirect.headers.location.value).toBe('/loop/')
  for (const [uri, expected] of [['/loop/', '/index.html'], ['/loop/js/app.js', '/js/app.js'], ['/loop/sw.js', '/sw.js'], ['/about/', '/about/']]) {
    const request = { uri, headers: {}, querystring: { v: { value: 'abc' } } }
    expect(context.handler({ request }).uri).toBe(expected)
    expect(request.querystring.v.value).toBe('abc')
  }
})

test('GitHub can deploy only this dedicated bucket from the app main branch', () => {
  appTemplate.hasResourceProperties('AWS::IAM::Role', {
    RoleName: 'wix-fyi-phosphor-loop-deploy',
    AssumeRolePolicyDocument: {
      Statement: Match.arrayWith([Match.objectLike({
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: { StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': 'repo:wickz80@32722332/phosphor-loop-min@1424659759:ref:refs/heads/main'
        } }
      })])
    }
  })
  const resources = appTemplate.toJSON().Resources
  const roleId = Object.keys(resources).find(id => resources[id].Properties?.RoleName === 'wix-fyi-phosphor-loop-deploy')!
  const policy = Object.values(resources).find((r: any) => r.Type === 'AWS::IAM::Policy' && r.Properties.Roles?.some((role: any) => role.Ref === roleId)) as any
  const loopId = Object.keys(resources).find(id => resources[id].Properties?.BucketName === 'wix-fyi-phosphor-loop-097029023067')!
  const s3Statements = policy.Properties.PolicyDocument.Statement.filter((s: any) => (Array.isArray(s.Action) ? s.Action : [s.Action]).some((action: string) => action.startsWith('s3:')))
  expect(s3Statements.length).toBe(2)
  for (const statement of s3Statements) {
    expect(JSON.stringify(statement.Resource)).toContain(loopId)
    expect(JSON.stringify(statement.Resource)).not.toContain('Bucket83908E77')
  }
})

test('rewritten app paths have a separate cache key from the homepage', () => {
  const policy = Object.values(template.findResources('AWS::CloudFront::CachePolicy'))[0].Properties.CachePolicyConfig
  expect(policy.MinTTL).toBe(0)
  expect(policy.ParametersInCacheKeyAndForwardedToOrigin.HeadersConfig).toEqual({ HeaderBehavior: 'whitelist', Headers: ['x-phosphor-origin'] })
  const distribution = Object.values(template.findResources('AWS::CloudFront::Distribution'))[0].Properties.DistributionConfig
  for (const behavior of distribution.CacheBehaviors) {
    expect(behavior.CachePolicyId).not.toEqual(distribution.DefaultCacheBehavior.CachePolicyId)
  }
  const context: any = {}
  runInNewContext(Object.values(template.findResources('AWS::CloudFront::Function'))[0].Properties.FunctionCode, context)
  const request = context.handler({ request: { uri: '/loop/', headers: { 'x-phosphor-origin': { value: 'spoofed' } } } })
  expect(request.uri).toBe('/index.html')
  expect(request.headers['x-phosphor-origin'].value).toBe('loop')
})


test('the website depends on the app stack without a reverse dependency', () => {
  expect(stack.dependencies).toContain(phosphorLoop)
  expect(phosphorLoop.dependencies).toEqual([])
  expect(Object.values(appTemplate.toJSON().Resources).some((r: any) => r.Type === 'AWS::CloudFront::Distribution')).toBe(false)
  expect(Object.values(template.findResources('AWS::IAM::Policy')).some((r: any) => r.Properties.PolicyDocument.Statement.some((s: any) => s.Action.includes('cloudfront:CreateInvalidation')))).toBe(true)
  expect(JSON.stringify(appTemplate.toJSON())).not.toContain('Fn::ImportValue')
  expect(JSON.stringify(template.toJSON())).toContain('PhosphorLoopStack:ExportsOutput')
})
