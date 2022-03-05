import * as cdk from '@aws-cdk/core';
import * as lambda from '@aws-cdk/aws-lambda'
import * as events from '@aws-cdk/aws-events'
import * as targets from '@aws-cdk/aws-events-targets'
import * as sfn from '@aws-cdk/aws-stepfunctions'
import * as tasks from '@aws-cdk/aws-stepfunctions-tasks'
import * as path from 'path'
import { TaskStateBase } from '@aws-cdk/aws-stepfunctions';

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
    const fnGetLatestPost = new lambda.Function(this, 'fngetLatestPost',{
      code: lambda.Code.fromAsset(path.join(__dirname,'lambda/getLatestPost')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
    })
    const fnPostArticleUpdate = new lambda.Function(this, 'fnPostArticleUpdate',{
      code: lambda.Code.fromAsset(path.join(__dirname,'lambda/postArticleUpdate')),
      handler: 'index.handler',
      timeout: cdk.Duration.seconds(5),
      runtime: lambda.Runtime.NODEJS_14_X,
    })


    //Define tasks for Step Functions
    const getLatestArticleStep= new tasks.LambdaInvoke(this,'Get latest article from HP',{
      lambdaFunction: fnGetLatestArticle,
      outputPath: '$.title.article'
    })
    const getLatestPostStep = new tasks.LambdaInvoke(this, 'Get latest post from Twitter',{
      lambdaFunction: fnGetLatestPost,
      outputPath: '$.title.post'
    })
    const postArticleUpdateTask = new tasks.LambdaInvoke(this, 'Post update of articles',{
      lambdaFunction: fnPostArticleUpdate,
    })
    
    const compareLatestTitlesStep = new sfn.Choice(this,'compare latest titles')
      .when(sfn.Condition.stringEquals('$.title.article','$.title.post'), postArticleUpdateTask)

    
    //Define statemachine(Step Functinos)
    const stateMachine = new sfn.StateMachine(this,'rilevaStatemachine',{
      definition: getLatestArticleStep
      .next(getLatestPostStep)
      .next(compareLatestTitlesStep)
    })


    //Define EventRule to execute statemachine regularly
    new events.Rule(this,'rilevaEventsRule',{
      schedule: events.Schedule.cron({minute:'0/1',hour:'*',day:'*'}),
      targets: [new targets.SfnStateMachine(stateMachine)],
    });

  }
}
