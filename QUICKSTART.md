# 🚀 Quick Start Guide

Get your BountyBoard contract deployed in 5 minutes!

## Step 1: Install Dependencies (30 seconds)

```bash
pip install algosdk
```

## Step 2: Get TestNet ALGO (2 minutes)

1. Open your Lute Wallet
2. Copy your wallet address
3. Visit: https://bank.testnet.algorand.network/
4. Paste address and request TestNet ALGO
5. Wait for confirmation

## Step 3: Deploy Contract (1 minute)

```bash
python deploy.py
```

When prompted, enter your 25-word mnemonic from Lute Wallet.

## Step 4: Get Contract Info (instant)

After deployment, you'll have:
- `contract.json` → Full contract details
- `contract-abi.json` → ABI for frontend

## Step 5: Integrate with Frontend

Copy these files to your React project:
- `contract.json`
- `frontend-integration.ts`

Use the `BountyBoard` class:

```typescript
import { BountyBoard, TaskStatus } from './frontend-integration';
import contractInfo from './contract.json';

const bountyBoard = new BountyBoard(contractInfo);

// Get all open tasks
const tasks = await bountyBoard.getTasksByStatus(TaskStatus.OPEN);

// Create a task
const txns = await bountyBoard.createTask(
  userAddress,
  'Task title',
  'Task description',
  deadlineTimestamp,
  5 // 5 ALGO
);
```

## 📚 Need More Details?

- **Full guide:** Read `DEPLOYMENT.md`
- **API docs:** Read `README.md`
- **Integration examples:** See `frontend-integration.ts`

## ✅ You're Done!

Contract is deployed and ready for integration! 🎉
