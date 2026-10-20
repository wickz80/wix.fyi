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
import { type PhosphorLoopStack } from './phosphor-loop-stack'

interface HostStackProps extends cdk.StackProps {
  domainName: string
  phosphorLoop: PhosphorLoopStack
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

    const loopOrigin = new cloudfront_origins.S3Origin(props.phosphorLoop.bucket, {
      originAccessIdentity: props.phosphorLoop.originAccessIdentity
    })
    const loopIndex = new cloudfront.Function(this, 'PhosphorLoopIndex', {
      code: cloudfront.FunctionCode.fromInline(`function handler(event) {
  var request = event.request;
  if (request.uri === '/loop') {
    return { statusCode: 308, statusDescription: 'Permanent Redirect',
      headers: { location: { value: '/loop/' } } };
  }
  if (request.uri.indexOf('/loop/') === 0) {
    // Keep rewritten bucket keys separate from the website's cache entries.
    request.headers['x-phosphor-origin'] = { value: 'loop' };
    request.uri = request.uri.slice(5);
    if (request.uri === '/') request.uri = '/index.html';
  }
  return request;
}`)
    })
    const loopBehavior: cloudfront.BehaviorOptions = {
      origin: loopOrigin,
      cachePolicy: new cloudfront.CachePolicy(this, 'PhosphorLoopCache', {
        headerBehavior: cloudfront.CacheHeaderBehavior.allowList('x-phosphor-origin'),
        queryStringBehavior: cloudfront.CacheQueryStringBehavior.allowList('v'),
        minTtl: cdk.Duration.seconds(0),
        defaultTtl: cdk.Duration.days(1),
        maxTtl: cdk.Duration.days(365),
        enableAcceptEncodingGzip: true,
        enableAcceptEncodingBrotli: true
      }),
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

    // The shared distribution grants only its own invalidation permission.
    // Keeping this attachment here avoids a dependency back from the app stack.
    new iam.Policy(this, 'PhosphorLoopInvalidationPolicy', {
      roles: [props.phosphorLoop.deployRole],
      statements: [new iam.PolicyStatement({
        actions: ['cloudfront:CreateInvalidation', 'cloudfront:GetInvalidation'],
        resources: [`arn:${cdk.Aws.PARTITION}:cloudfront::${this.account}:distribution/${distribution.distributionId}`]
      })]
    })
    new cdk.CfnOutput(this, 'PhosphorLoopDistributionId', { value: distribution.distributionId })

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../public')],
      destinationBucket: bucket,
      // Phosphor Loop deploys independently from its own repository.
      // Reserve its URL namespace here; its actual assets live in the app stack's bucket.
      exclude: ['loop', 'loop/*'],
      distribution,
      distributionPaths: ['/*']
    })
  }
}
