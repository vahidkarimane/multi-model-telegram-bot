import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

interface MultiModelBotStackProps extends cdk.StackProps {
  config: {
    region: string;
    bucketName: string;
    tableName: string;
  };
}

export class MultiModelBotStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MultiModelBotStackProps) {
    super(scope, id, props);

    // S3 bucket for storing uploads and outputs
    const bucket = new s3.Bucket(this, 'ContentBucket', {
      bucketName: props.config.bucketName,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create prefixes for organization
    const uploadsPrefix = 'uploads/';
    const outputsPrefix = 'outputs/';

    // DynamoDB table for jobs
    const jobsTable = new dynamodb.Table(this, 'JobsTable', {
      tableName: props.config.tableName,
      partitionKey: { name: 'jobId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add GSI for user-based queries
    jobsTable.addGlobalSecondaryIndex({
      indexName: 'UserIndex',
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'statusCreatedAt', type: dynamodb.AttributeType.STRING },
    });

    // Create Secrets Manager secret for Telegram bot token
    const botTokenSecret = new secretsmanager.Secret(this, 'BotTokenSecret', {
      secretName: '/multiModelBot/token',
      description: 'Telegram bot token for the Multi-Model Bot',
    });

    // Output the resource ARNs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'S3 bucket for storing uploads and outputs',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: jobsTable.tableName,
      description: 'DynamoDB table for jobs',
    });

    new cdk.CfnOutput(this, 'SecretName', {
      value: botTokenSecret.secretName,
      description: 'Secrets Manager secret for Telegram bot token',
    });
  }
}
