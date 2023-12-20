import * as cdk from 'aws-cdk-lib'
import { type Construct } from 'constructs'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment'
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
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false
      })
    })
    
    const cloudfrontOAI = new cloudfront.OriginAccessIdentity(this, 'cloudfront-OAI');
    bucket.grantRead(cloudfrontOAI.grantPrincipal)

    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      certificate,
      defaultRootObject: 'index.html',
      domainNames: [siteDomain, domainName],
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/error/index.html',
          ttl: cdk.Duration.minutes(30)
        }
      ],
      defaultBehavior: {
        origin: new cloudfront_origins.S3Origin(bucket, {originAccessIdentity: cloudfrontOAI}),
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

    new s3deploy.BucketDeployment(this, 'DeployWebsite', {
      sources: [s3deploy.Source.asset('../src')],
      destinationBucket: bucket,
      distribution,
      distributionPaths: ['/*'],
    })
  }
}
