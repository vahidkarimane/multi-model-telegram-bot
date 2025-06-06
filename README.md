# Multi-Model Telegram Bot

A Telegram bot that integrates with multiple AWS AI models including Claude, Canvas, and Reel.

## Project Structure

- `src/` - Source code for Lambda functions
- `lib/` - Shared libraries and utilities
- `infra/` - AWS CDK infrastructure code
- `tests/` - Test files

## Setup

### Prerequisites

- Node.js v20 or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally
- pnpm installed globally

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/vahidkarimane/multi-model-telegram-bot.git
   cd multi-model-telegram-bot
   ```

2. Install dependencies
   ```bash
   pnpm install
   ```

3. Bootstrap CDK (if not already done in your AWS account)
   ```bash
   cd infra
   cdk bootstrap
   ```

4. Deploy the infrastructure
   ```bash
   cdk deploy --profile <your-aws-profile>
   ```

5. After deployment, set the Telegram bot token in AWS Secrets Manager
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id /multiModelBot/token \
     --secret-string "YOUR_TELEGRAM_BOT_TOKEN" \
     --profile <your-aws-profile>
   ```

## Development

### Local Testing

To test the Lambda function locally:

```bash
sam local start-api
```

### Building

To build the Lambda function:

```bash
npm run build
```

## Infrastructure

The project uses AWS CDK to define and deploy the following resources:

- S3 bucket for storing uploads and outputs
- DynamoDB table for job tracking
- AWS Secrets Manager secret for the Telegram bot token

## License

ISC
