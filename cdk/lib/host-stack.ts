import * as cdk from 'aws-cdk-lib'
import { type Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
import * as iam from 'aws-cdk-lib/aws-iam'
import * as route53 from 'aws-cdk-lib/aws-route53'
import * as targets from 'aws-cdk-lib/aws-route53-targets'
import * as acm from 'aws-cdk-lib/aws-certificatemanager'
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront'
import * as cloudfront_origins from 'aws-cdk-lib/aws-cloudfront-origins'

interface HostStackProps extends cdk.StackProps {
  domainName: string
}

export class HostStack extends cdk.Stack {
  constructor (scope: Construct, id: string, props: HostStackProps) {
    super(scope, id, props)

    const { domainName } = props
    const siteDomain = `www.${props?.domainName}`

    const hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
      zoneName: domainName
    })

    // MX, TXT and other DNS records must be added manually to this zone
    // NS records must be copied from this zone to the domain name provider
    const zone = route53.HostedZone.fromHostedZoneAttributes(this, 'Zone', {
      hostedZoneId: hostedZone.hostedZoneId,
      zoneName: hostedZone.zoneName
    })

    const certificate = new acm.Certificate(this, 'SiteCertificate', {
      domainName,
      subjectAlternativeNames: ['*.' + domainName],
      certificateName: domainName,
      validation: acm.CertificateValidation.fromDns(zone)
    })
    certificate.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY)

    const bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: siteDomain,
      websiteIndexDocument: 'index.html',
      websiteErrorDocument: '404.html',
      publicReadAccess: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS
    })

    // The visualizer owns its assets independently; Gatsby never deploys to this bucket.
    const loopBucket = new s3.Bucket(this, 'PhosphorLoopBucket', {
      bucketName: `wix-fyi-phosphor-loop-${this.account}`,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      enforceSSL: true
    })
    const loopOrigin = new cloudfront_origins.S3Origin(loopBucket)
    const loopIndex = new cloudfront.Function(this, 'PhosphorLoopIndex', {
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.uri === '/loop') {
    return { statusCode: 308, statusDescription: 'Permanent Redirect',
      headers: { location: { value: '/loop/' } } };
  }
  if (request.uri.indexOf('/loop/') === 0) {
    request.uri = request.uri.slice(5);
    if (request.uri === '/') request.uri = '/index.html';
  }
  return request;
}`)
    })
    const loopBehavior: cloudfront.BehaviorOptions = {
      origin: loopOrigin,
      compress: true,
      allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
      viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      functionAssociations: [{
        function: loopIndex,
        eventType: cloudfront.FunctionEventType.VIEWER_REQUEST
      }]
    }

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      certificate,
      defaultRootObject: 'index.html',
      domainNames: [siteDomain, domainName],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      additionalBehaviors: { '/loop': loopBehavior, '/loop/*': loopBehavior },
      defaultBehavior: {
        origin: new cloudfront_origins.HttpOrigin(bucket.bucketWebsiteDomainName, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY
        }),
        compress: true,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS
      }
    })

    new route53.ARecord(this, 'WWWSiteAliasRecord', {
      zone,
      recordName: siteDomain,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    })

    new route53.ARecord(this, 'SiteAliasRecord', {
      zone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution))
    })

    const loopDeployRole = new iam.Role(this, 'PhosphorLoopDeployRole', {
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
      resources: [loopBucket.bucketArn]
    }))
    loopDeployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject', 's3:AbortMultipartUpload'],
      resources: [loopBucket.arnForObjects('*')]
    }))
    loopDeployRole.addToPolicy(new iam.PolicyStatement({
      actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
      resources: [`arn:${cdk.Aws.PARTITION}:cloudfront::${this.account}:distribution/${distribution.distributionId}`]
    }))
    new cdk.CfnOutput(this, 'PhosphorLoopDeployRoleArn', { value: loopDeployRole.roleArn })

    new cdk.CfnOutput(this, 'PhosphorLoopBucketName', { value: loopBucket.bucketName })
    new cdk.CfnOutput(this, 'PhosphorLoopDistributionId', { value: distribution.distributionId })

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../public')],
      destinationBucket: bucket,
      // Phosphor Loop deploys independently from its own repository.
      // Reserve its URL namespace here; its actual assets live in loopBucket.
      exclude: ['loop', 'loop/*'],
      distribution,
      distributionPaths: ['/*']
    })
  }
}
