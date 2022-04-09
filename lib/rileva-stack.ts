import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import * as path from 'path'
import * as s3 from '@aws-cdk/aws-s3'
import * as iam from '@aws-cdk/aws-iam'

export class RilevaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);


    //Define lambda functions
    const fnGetLatestArticle = new lambda.Function(this,'fnGetLatestArticle',{
      code: lambda.Code.fromAsset(path.join(__dirname,'lambda/getLatestArticle')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
    })

    new lambda.Function(this, 'fnPostArticleUpdate',{
      code: lambda.Code.fromAsset(path.join(__dirname,'lambda/postArticleUpdate')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
    })

    //Define S3 bucket to store last article info
    const rilevaS3Bucket = new s3.Bucket(this,'rilevaS3Bucket',{
      bucketName:this.node.tryGetContext("bucketName") || 'rileva-s3-bucket',
    })
    
    const rilevaBucketAccessPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: ['s3:GetObject','s3:PutObject'],
      principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
      resources: [rilevaS3Bucket.bucketArn + '/*'],
    })
    
    //Define EventRule to execute lambda regularly
    new events.Rule(this,'rilevaEventsRule',{
      schedule: events.Schedule.cron({minute:'0/1',hour:'*',day:'*'}),
      targets: [new targets.LambdaFunction(fnGetLatestArticle)],
    });

  }
}
