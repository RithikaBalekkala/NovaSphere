# BountyBoard Smart Contract

A decentralized escrow marketplace for micro-tasks on Algorand TestNet.

## 📋 Overview

**Contract Name:** BountyBoard  
**Network:** Algorand TestNet  
**Language:** TEAL v10  
**Storage:** Box storage for tasks  

## 🎯 Features

- ✅ Escrow-based payments
- ✅ Multi-state task lifecycle
- ✅ Deadline enforcement
- ✅ Rejection & resubmission support
- ✅ Secure refund mechanism
- ✅ No centralized database

## 📦 Deployment

### Prerequisites

1. **Python 3.12+** installed
2. **Lute Wallet** with TestNet ALGO
3. **TestNet ALGO** (~0.5 ALGO minimum)
   - Get free TestNet ALGO: https://bank.testnet.algorand.network/

### Deploy Steps

1. **Install Dependencies**
   ```bash
   pip install algosdk
   ```

2. **Run Deployment**
   ```bash
   python deploy.py
   ```

3. **Follow Prompts**
   - Enter your Lute Wallet mnemonic (25 words)
   - Wait for deployment confirmation
   - Contract will be deployed and funded automatically

4. **Get Integration Files**
   - `contract.json` - Complete deployment info
   - `contract-abi.json` - ABI for frontend

## 📄 Contract Methods

### create_task(title, description, deadline)
Creates a new task with escrowed payment.

**Parameters:**
- `title` (string): Task title
- `description` (string): Task description
- `deadline` (uint64): Unix timestamp deadline

**Requirements:**
- Must be atomic group with payment transaction
- Payment goes to contract address

**Returns:** Task ID (uint64)

**Status Change:** → OPEN (0)

---

### claim_task(task_id)
Claim an open task as a freelancer.

**Parameters:**
- `task_id` (uint64): Task ID

**Requirements:**
- Task must be OPEN
- Caller cannot be the client

**Status Change:** OPEN → CLAIMED (1)

---

### submit_work(task_id, proof_hash)
Submit work proof for verification.

**Parameters:**
- `task_id` (uint64): Task ID
- `proof_hash` (string): IPFS hash or URL

**Requirements:**
- Task must be CLAIMED
- Caller must be the freelancer

**Status Change:** CLAIMED → SUBMITTED (2)

---

### approve_task(task_id)
Approve work and release payment.

**Parameters:**
- `task_id` (uint64): Task ID

**Requirements:**
- Task must be SUBMITTED
- Caller must be the client

**Action:** Transfers escrowed amount to freelancer

**Status Change:** SUBMITTED → APPROVED (3)

---

### reject_task(task_id)
Reject submitted work.

**Parameters:**
- `task_id` (uint64): Task ID

**Requirements:**
- Task must be SUBMITTED
- Caller must be the client

**Status Change:** SUBMITTED → CLAIMED (1)  
*Allows resubmission*

---

### refund_task(task_id)
Refund escrowed amount to client.

**Parameters:**
- `task_id` (uint64): Task ID

**Requirements:**
- Caller is client OR deadline has passed
- Task must be OPEN or CLAIMED

**Action:** Returns escrowed amount to client

**Status Change:** OPEN/CLAIMED → REFUNDED (5)

## 🔄 Task Status Flow

```
[0] OPEN
  ↓ (claim_task)
[1] CLAIMED
  ↓ (submit_work)
[2] SUBMITTED
  ↓ (approve_task)        ↓ (reject_task)
[3] APPROVED         [1] CLAIMED (resubmit)

[5] REFUNDED ← (refund_task from OPEN or CLAIMED)
```

## 📊 Task Status Enum

```javascript
const TaskStatus = {
  OPEN: 0,
  CLAIMED: 1,
  SUBMITTED: 2,
  APPROVED: 3,
  REJECTED: 4,  // Not used directly (visual only)
  REFUNDED: 5
}
```

## 💾 Box Storage Schema

Each task is stored across multiple boxes:

```
{task_id}_client       → Client address (32 bytes)
{task_id}_freelancer   → Freelancer address (32 bytes)
{task_id}_amount       → Escrow amount (8 bytes)
{task_id}_deadline     → Unix timestamp (8 bytes)
{task_id}_status       → Status enum (8 bytes)
{task_id}_title        → Title string (variable)
{task_id}_description  → Description string (variable)
{task_id}_proof        → Proof hash/URL (variable)
```

## 🔐 Security Features

1. **Strict Sender Validation**
   - Only client can approve/reject/refund
   - Only freelancer can submit work
   - Clients cannot claim their own tasks

2. **State Transition Guards**
   - Each method validates current status
   - No double-execution protection

3. **Update-Before-Transfer Pattern**
   - Status updated BEFORE payment/refund
   - Prevents reentrancy attacks

4. **Deadline Enforcement**
   - Automatic refund after deadline
   - Client can refund anytime before submission

## 🌐 Frontend Integration

### Using with React + algosdk

```javascript
import algosdk from 'algosdk';
import { useWallet } from '@txnlab/use-wallet';
import contractInfo from './contract.json';

// Initialize client
const algodClient = new algosdk.Algodv2(
  '',
  'https://testnet-api.algonode.cloud',
  ''
);

// Create task (atomic group)
async function createTask(title, description, deadline, amountAlgos) {
  const params = await algodClient.getTransactionParams().do();
  const appId = contractInfo.appId;
  
  // Transaction 1: Payment to contract
  const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
    from: userAddress,
    to: contractInfo.appAddress,
    amount: amountAlgos * 1_000_000, // Convert to microAlgos
    suggestedParams: params
  });
  
  // Transaction 2: App call
  const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
    from: userAddress,
    appIndex: appId,
    appArgs: [
      new TextEncoder().encode('create_task'),
      new TextEncoder().encode(title),
      new TextEncoder().encode(description),
      algosdk.encodeUint64(deadline)
    ],
    suggestedParams: params
  });
  
  // Group transactions
  algosdk.assignGroupID([paymentTxn, appCallTxn]);
  
  // Sign and send via wallet
  const signedTxns = await signTransactions([
    paymentTxn.toByte(),
    appCallTxn.toByte()
  ]);
  
  await algodClient.sendRawTransaction(signedTxns).do();
}

// Claim task
async function claimTask(taskId) {
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: userAddress,
    appIndex: contractInfo.appId,
    appArgs: [
      new TextEncoder().encode('claim_task'),
      algosdk.encodeUint64(taskId)
    ],
    suggestedParams: params
  });
  
  const signedTxn = await signTransaction(txn.toByte());
  await algodClient.sendRawTransaction(signedTxn).do();
}

// Submit work
async function submitWork(taskId, proofHash) {
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: userAddress,
    appIndex: contractInfo.appId,
    appArgs: [
      new TextEncoder().encode('submit_work'),
      algosdk.encodeUint64(taskId),
      new TextEncoder().encode(proofHash)
    ],
    suggestedParams: params
  });
  
  const signedTxn = await signTransaction(txn.toByte());
  await algodClient.sendRawTransaction(signedTxn).do();
}

// Approve task
async function approveTask(taskId) {
  const params = await algodClient.getTransactionParams().do();
  
  const txn = algosdk.makeApplicationNoOpTxnFromObject({
    from: userAddress,
    appIndex: contractInfo.appId,
    appArgs: [
      new TextEncoder().encode('approve_task'),
      algosdk.encodeUint64(taskId)
    ],
    boxes: [
      // Include relevant boxes for reading
      { appIndex: contractInfo.appId, name: new TextEncoder().encode(`${taskId}_freelancer`) },
      { appIndex: contractInfo.appId, name: new TextEncoder().encode(`${taskId}_amount`) }
    ],
    suggestedParams: params
  });
  
  const signedTxn = await signTransaction(txn.toByte());
  await algodClient.sendRawTransaction(signedTxn).do();
}
```

## 📖 Reading Task Data

```javascript
// Read task from boxes
async function getTask(taskId) {
  const appId = contractInfo.appId;
  
  // Read each field
  const client = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_client`)
  ).do();
  
  const freelancer = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_freelancer`)
  ).do();
  
  const amount = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_amount`)
  ).do();
  
  const deadline = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_deadline`)
  ).do();
  
  const status = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_status`)
  ).do();
  
  const title = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_title`)
  ).do();
  
  const description = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_description`)
  ).do();
  
  const proof = await algodClient.getApplicationBoxByName(
    appId,
    new TextEncoder().encode(`${taskId}_proof`)
  ).do();
  
  return {
    taskId,
    client: algosdk.encodeAddress(client.value),
    freelancer: algosdk.encodeAddress(freelancer.value),
    amount: new DataView(amount.value.buffer).getBigUint64(0),
    deadline: new DataView(deadline.value.buffer).getBigUint64(0),
    status: new DataView(status.value.buffer).getBigUint64(0),
    title: new TextDecoder().decode(title.value),
    description: new TextDecoder().decode(description.value),
    proofHash: new TextDecoder().decode(proof.value)
  };
}
```

## 🧪 Testing Checklist

- [ ] Deploy contract to TestNet
- [ ] Create task with payment
- [ ] Claim task
- [ ] Submit work proof
- [ ] Approve task (payment released)
- [ ] Create another task
- [ ] Claim and submit
- [ ] Reject work
- [ ] Resubmit work
- [ ] Approve
- [ ] Create task
- [ ] Refund before claim
- [ ] Create task with deadline
- [ ] Wait for deadline
- [ ] Refund after deadline

## 🔗 Resources

- **Algorand TestNet Explorer:** https://testnet.explorer.perawallet.app/
- **Algorand Docs:** https://developer.algorand.org/
- **AlgoSDK Docs:** https://algorand.github.io/js-algorand-sdk/
- **TestNet Faucet:** https://bank.testnet.algorand.network/

## 📞 Support

For issues or questions, check:
- Contract code in `bounty_approval.teal`
- Deployment script in `deploy.py`
- ABI in `contract-abi.json`
