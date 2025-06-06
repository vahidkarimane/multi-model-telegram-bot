import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import * as Infra from '../lib/multi-model-bot-stack';

test('S3 Bucket Created', () => {
  const app = new cdk.App();
  const config = {
    region: 'us-east-1',
    bucketName: 'test-bucket',
    tableName: 'TestJobs',
  };
  
  // WHEN
  const stack = new Infra.MultiModelBotStack(app, 'MyTestStack', { config });
  
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::S3::Bucket', {
    BucketName: 'test-bucket',
    BucketEncryption: {
      ServerSideEncryptionConfiguration: [
        {
          ServerSideEncryptionByDefault: {
            SSEAlgorithm: 'AES256'
          }
        }
      ]
    }
  });
});

test('DynamoDB Table Created', () => {
  const app = new cdk.App();
  const config = {
    region: 'us-east-1',
    bucketName: 'test-bucket',
    tableName: 'TestJobs',
  };
  
  // WHEN
  const stack = new Infra.MultiModelBotStack(app, 'MyTestStack', { config });
  
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::DynamoDB::Table', {
    TableName: 'TestJobs',
    KeySchema: [
      {
        AttributeName: 'jobId',
        KeyType: 'HASH'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: 'UserIndex',
        KeySchema: [
          {
            AttributeName: 'userId',
            KeyType: 'HASH'
          },
          {
            AttributeName: 'statusCreatedAt',
            KeyType: 'RANGE'
          }
        ]
      }
    ]
  });
});

test('Secrets Manager Secret Created', () => {
  const app = new cdk.App();
  const config = {
    region: 'us-east-1',
    bucketName: 'test-bucket',
    tableName: 'TestJobs',
  };
  
  // WHEN
  const stack = new Infra.MultiModelBotStack(app, 'MyTestStack', { config });
  
  // THEN
  const template = Template.fromStack(stack);
  template.hasResourceProperties('AWS::SecretsManager::Secret', {
    Name: '/multiModelBot/token'
  });
});
