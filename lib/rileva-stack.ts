import * as cdk from '@aws-cdk/core';
import { NodejsFunction } from '@aws-cdk/aws-lambda-nodejs'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'

export class RilevaStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    const rilevaLambdaFunciton = new NodejsFunction(this,'rilevaLambdaFunciton',{
      entry:'lambda/lireva.ts',
      handler:'handler'
    })

    new events.Rule(this,'rilevaEventsRule',{
      schedule: events.Schedule.cron({minute:'0/1',hour:'*',day:'*'}),
      targets: [new targets.LambdaFunction(rilevaLambdaFunciton,{retryAttempts:3,})],
    });
  }
}
