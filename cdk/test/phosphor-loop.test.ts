import * as cdk from 'aws-cdk-lib'
import { Template, Match } from 'aws-cdk-lib/assertions'
import { runInNewContext } from 'vm'
import { HostStack } from '../lib/host-stack'

const stack = new HostStack(new cdk.App(), 'HostStack', {
  domainName: 'wix.fyi', env: { account: '097029023067', region: 'us-east-1' }
})
const template = Template.fromStack(stack)

test('the app bucket is private, separate from Gatsby, and retained on stack removal', () => {
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'wix-fyi-phosphor-loop-097029023067',
    PublicAccessBlockConfiguration: {
      BlockPublicAcls: true, BlockPublicPolicy: true,
      IgnorePublicAcls: true, RestrictPublicBuckets: true
    }
  })
  const buckets = template.findResources('AWS::S3::Bucket')
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
    const request = { uri, querystring: { v: { value: 'abc' } } }
    expect(context.handler({ request }).uri).toBe(expected)
    expect(request.querystring.v.value).toBe('abc')
  }
})

test('GitHub can deploy only this dedicated bucket from the app main branch', () => {
  template.hasResourceProperties('AWS::IAM::Role', {
    RoleName: 'wix-fyi-phosphor-loop-deploy',
    AssumeRolePolicyDocument: {
      Statement: Match.arrayWith([Match.objectLike({
        Action: 'sts:AssumeRoleWithWebIdentity',
        Condition: { StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          'token.actions.githubusercontent.com:sub': 'repo:wickz80/phosphor-loop-min:ref:refs/heads/main'
        } }
      })])
    }
  })
  const resources = template.toJSON().Resources
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
