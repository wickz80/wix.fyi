import * as cdk from 'aws-cdk-lib'
import { type Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'

/** App resources, including future session storage and APIs, belong here.
 * The website consumes this stack; this stack never depends on the website.
 */
export class PhosphorLoopStack extends cdk.Stack {
  readonly bucket: s3.Bucket
  readonly originAccessIdentity: cloudfront.OriginAccessIdentity
  readonly deployRole: iam.Role

  constructor (scope: Construct, id: string, props: cdk.StackProps) {
    super(scope, id, props)
    this.bucket = new s3.Bucket(this, 'PhosphorLoopBucket', {
      bucketName: `wix-fyi-phosphor-loop-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN
    })
    this.originAccessIdentity = new cloudfront.OriginAccessIdentity(this, 'PhosphorLoopOriginAccessIdentity', {
      comment: 'Private access to Phosphor Loop assets'
    })
    this.bucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [this.bucket.arnForObjects('*')],
      principals: [new iam.CanonicalUserPrincipal(this.originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId)]
    }))

    const loopDeployRole = this.deployRole = new iam.Role(this, 'PhosphorLoopDeployRole', {
      roleName: 'wix-fyi-phosphor-loop-deploy',
      assumedBy: new iam.FederatedPrincipal(
        `arn:${cdk.Aws.PARTITION}:iam::${this.account}:oidc-provider/token.actions.githubusercontent.com`,
        { StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
          // New GitHub repositories use immutable owner/repository IDs in sub.
          'token.actions.githubusercontent.com:sub': 'repo:wickz80@32722332/phosphor-loop-min@1424659759:ref:refs/heads/main'
        } },
        'sts:AssumeRoleWithWebIdentity'
      )
    })
    loopDeployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetBucketLocation', 's3:ListBucket'],
      resources: [this.bucket.bucketArn]
    }))
    loopDeployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:AbortMultipartUpload'],
      resources: [this.bucket.arnForObjects('*')]
    }))

    new cdk.CfnOutput(this, 'PhosphorLoopDeployRoleArn', { value: this.deployRole.roleArn })
    new cdk.CfnOutput(this, 'PhosphorLoopBucketName', { value: this.bucket.bucketName })
  }
}
