#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { MultiModelBotStack } from '../lib/multi-model-bot-stack';
import * as fs from 'fs';
import * as path from 'path';

const app = new cdk.App();

// Load configuration based on environment
const configEnv = app.node.tryGetContext('config') || 'dev';
const configPath = path.join(__dirname, '..', 'config', `${configEnv}.json`);

let config;
if (fs.existsSync(configPath)) {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} else {
  throw new Error(`Configuration file not found: ${configPath}`);
}

new MultiModelBotStack(app, 'MultiModelBotStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: config.region || process.env.CDK_DEFAULT_REGION,
  },
  config,
});
