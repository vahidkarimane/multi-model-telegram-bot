
---

## 0 · Local & Repo Setup

* [x] **Create Git repo** `multi-model-telegram-bot` on GitHub; add `main` branch protection.
* [ ] **Install toolchain** → `nvm use 20 && npm i -g pnpm@latest aws-cdk@2 esbuild@latest tsc`.
* [x] **Initial project skeleton** → `pnpm init; mkdir src/ lib/ infra/ tests/`.
* [x] **Add ESLint + Prettier** (`eslint --init`, `pnpm i -D prettier eslint-config-prettier`).
* [x] **Commit `.editorconfig`, `.prettierrc`, `.eslintrc`**, push.

---

## 1 · AWS Bootstrap (CDK)

* [x] `cd infra && cdk init app --language typescript`.
* [x] **Create parameter file** `config/dev.json` (region, bucket name, table name).
* [ ] **Add @aws-cdk/aws-* libs*\* (`pnpm add -w @aws-cdk/aws-lambda @aws-cdk/aws-iam @aws-cdk/aws-apigateway @aws-cdk/aws-dynamodb @aws-cdk/aws-s3 @aws-cdk/aws-s3-notifications @aws-cdk/aws-secretsmanager`).
* [x] **Define S3 bucket** with prefixes `uploads/` & `outputs/`; enable default encryption.
* [x] **Define DynamoDB table `Jobs`** → `partitionKey: jobId (S)`.
* [x] **Add GSI `UserIndex`** → `partitionKey: userId (S)` `sortKey: statusCreatedAt (S)`.
* [x] **Create Secrets Manager secret `/multiModelBot/token`** (no value yet).
* [ ] **Deploy stack** `cdk deploy --profile <dev>`; verify resources.

---

## 2 · Lambda Build Pipeline

* [ ] **Create `scripts/build.ts`** → single esbuild script bundling `src/handler.ts` into `dist/handler.mjs`.
* [ ] **Add `npm run build` & `npm run watch`** in `package.json`.
* [ ] **Add Lambda layer for shared libs** (telegram, aws-sdk v3 clients) → define in CDK.
* [ ] **Wire CDK to point function code to `dist/handler.mjs`**.

---

## 3 · Telegram Webhook Function (Orchestrator)

* [ ] **Install Telegraf 4** `pnpm i telegraf`.
* [ ] **Create `src/telegram.ts`** → export `newTelegraf()` that lazily fetches bot token from Secrets Manager.
* [ ] **Define inline keyboards** (`MODEL_KB`, `CANVAS_TASK_KB`, `REEL_TASK_KB`).
* [ ] **Implement `/start` & `/menu` commands ↔ model selection**.
* [ ] **Persist user selection** → `putUser(chatId,{currentModel})` helper (Dynamo).
* [ ] **Handle task selection callbacks** → write `currentTask` & `expectedField` to Dynamo.
* [ ] **Emit `sendChatAction('typing')` on every new text prompt**.

---

## 4 · User State Helpers

* [ ] `lib/users.ts` → `getUser(userId)` & `putUser(userId, partial)` using `Jobs` table `UserIndex` item with fixed `jobId = USER_STATE`.
* [ ] Ensure helper auto-creates blank state on first access.

---

## 5 · Dynamo Job Helpers

* [ ] `lib/jobs.ts` → `createJob(item)`, `updateJobStatus(jobId, status, attrs)`, `getJob(jobId)`.
* [ ] `createJob` writes `{jobId,userId,model,status:'IN_PROGRESS',createdAt}`.
* [ ] **Guard util** → `hasActiveJob(userId)` using `UserIndex`.

---

## 6 · Bedrock Client Helpers

* [ ] `lib/bedrock.ts` → wrapper returning pre-configured `BedrockRuntimeClient`.
* [ ] **Claude helper** `invokeClaude(prompt, opts)` → returns text.
* [ ] **Canvas helper** `invokeCanvas(taskType, params)` → returns base64 image.
* [ ] **Reel helper** `startReelAsync(payload)` → returns `invocationArn`.
* [ ] **Unit-test** all three helpers with Jest mocks.

---

## 7 · Happy-Path Flows

### 7a · Claude

* [ ] In handler, when `currentModel==='CLAUDE'` && `expectedField===null` → treat incoming text as prompt.
* [ ] Call `invokeClaude`; send reply; mark job `COMPLETED`; clear `activeJobId`.

### 7b · Canvas

* [ ] Implement prompt-collection FSM for each Canvas task (TEXT\_IMAGE, IMGVAR, COND, INPAINT, OUTPAINT, RMBG).
* [ ] Convert Telegram image (`getFile`) to base64; call `invokeCanvas`.
* [ ] Decode result, save to S3 `outputs/images/<jobId>.png`; `sendPhoto`; finish job.

### 7c · Reel

* [ ] FSM collects prompt, image (optional), duration.
* [ ] Call `startReelAsync`, store `invocationArn` as `jobId`, keep `activeJobId` locked.
* [ ] Send "video generating" message.

---

## 8 · Result-Handler Function (S3 Trigger)

* [ ] Create `src/result-handler.ts`; subscribe bucket prefix `outputs/videos/*/video-generation-status.json`.
* [ ] Parse key → `invocationId = folder`; `getJob(invocationId)`; guard if missing.
* [ ] Load status JSON; if failed ⇒ update job `FAILED`, unlock user, `sendMessage`.
* [ ] On success ⇒ `GetObject(output.mp4)`; if size ≤50 MB `sendVideo`, else presigned URL.
* [ ] Update job `COMPLETED`; unlock user.

---

## 9 · Concurrency Guard + /status & /cancel

* [ ] At top of every message, call `hasActiveJob(userId)`; block unless `/status` or `/cancel`.
* [ ] `/status` ⇒ look up job; estimate ETA ((duration\*7) - elapsed).
* [ ] `/cancel` ⇒ if job `IN_PROGRESS` & model !== REEL (async); call `updateJobStatus(jobId,'CANCELLED')`; unlock.

---

## 10 · Safety & Validation

* [ ] Reject images > 4 096 px per side before Canvas call.
* [ ] Truncate prompts > 512 chars for Reel, > 1 024 for Canvas, > 10 000 Claude tokens.
* [ ] Strip disallowed keywords list before Bedrock call; if any → user message "content not allowed".

---

## 11 · Structured Logging

* [ ] Add `lib/logger.ts` exporting Powertools logger with correlationId support.
* [ ] Wrap each handler entrypoint with `logger.appendKeys({txId})`.
* [ ] Emit `level=INFO` for state transitions, `WARN` for model failures, `ERROR` on exceptions.

---

## 12 · CD-Pipeline

* [x] **Create GitHub Actions workflow** `.github/workflows/deploy.yml`.
* [ ] Steps: `pnpm i` → `npm run lint` → `npm run test` → `npm run build` → `cdk deploy --require-approval never`.
* [ ] Use OIDC for AWS credentials; store AWS account/role in repo secrets.

---

## 13 · End-to-End Tests

* [ ] Write Jest test that mocks Telegram webhook, triggers `/start`, selects Claude, sends prompt, asserts reply text contains Claude marker.
* [ ] Mock Canvas success flow with base64 placeholder; assert S3 upload & `sendPhoto` call.
* [ ] Mock Reel async flow: create fake S3 event JSON, run `result-handler`, assert `sendVideo`.

---

## 14 · Ops Dashboards

* [ ] Create CloudWatch dashboard: Lambda p50/p95 latency, error count, Bedrock invocation count.
* [ ] Add alarm: `Errors ≥ 5 in 5 min` → SNS `#bot-alerts`.

---

## 15 · Docs & Handover

* [x] Update `README.md` with: architecture diagram, setup steps, env vars, "how to run locally" (`sam local start-api`).
* [ ] Copy task list to `docs/dev-checklist.md`; tick items as you finish.

---