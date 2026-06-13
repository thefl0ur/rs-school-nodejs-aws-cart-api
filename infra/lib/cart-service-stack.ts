import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import * as path from 'path';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = ec2.Vpc.fromLookup(this, 'Vpc', {
      vpcId: this.node.tryGetContext('VPC_ID'),
    });

    const lambdaSg = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc,
      description: 'Security group for cart service Lambda',
      allowAllOutbound: true,
    });

    const rdsSg = ec2.SecurityGroup.fromSecurityGroupId(
      this,
      'RdsSg',
      this.node.tryGetContext('RDS_SECURITY_GROUP_ID'),
    );

    rdsSg.addIngressRule(lambdaSg, ec2.Port.tcp(5432), 'Allow PostgreSQL from Lambda');

    const fn = new lambda.Function(this, 'CartServiceLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'lambda.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist')),
      timeout: cdk.Duration.seconds(29),
      memorySize: 1024,
      vpc,
      securityGroups: [lambdaSg],
      environment: {
        NODE_ENV: 'production',
        DATABASE_HOST: this.node.tryGetContext('DATABASE_HOST'),
        DATABASE_PORT: this.node.tryGetContext('DATABASE_PORT'),
        DATABASE_USER: this.node.tryGetContext('DATABASE_USER'),
        DATABASE_PASSWORD: this.node.tryGetContext('DATABASE_PASSWORD'),
        DATABASE_NAME: this.node.tryGetContext('DATABASE_NAME'),
      },
    });

    const api = new apigateway.RestApi(this, 'CartServiceApi', {
      restApiName: 'Cart Service',
      deployOptions: {
        stageName: 'prod',
      },
    });

    const integration = new apigateway.LambdaIntegration(fn, { proxy: true });

    api.root.addProxy({
      defaultIntegration: integration,
    });
  }
}
