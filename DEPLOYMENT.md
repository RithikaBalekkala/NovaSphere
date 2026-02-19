# BountyBoard Deployment Guide

## 📋 Pre-Deployment Checklist

### 1. Environment Setup
- [ ] Python 3.12+ installed
- [ ] `algosdk` package installed (`pip install algosdk`)
- [ ] Lute Wallet configured with TestNet
- [ ] Wallet has at least 0.5 ALGO on TestNet

### 2. Get TestNet ALGO
Visit: https://bank.testnet.algorand.network/
- Enter your Lute Wallet address
- Request TestNet ALGO (free)
- Wait for confirmation (~30 seconds)

### 3. Files Check
Ensure you have:
- [ ] `bounty_approval.teal` - Approval program
- [ ] `bounty_clear.teal` - Clear program
- [ ] `deploy.py` - Deployment script

## 🚀 Deployment Steps

### Step 1: Run Deployment Script

```bash
python deploy.py
```

### Step 2: Enter Wallet Mnemonic

When prompted, enter your 25-word Lute Wallet mnemonic.

**⚠️ SECURITY NOTE:** Your mnemonic is NOT saved anywhere. It's only used to sign the deployment transaction.

### Step 3: Wait for Confirmation

The script will:
1. ✅ Connect to your wallet
2. ✅ Check your balance
3. ✅ Compile TEAL programs
4. ✅ Deploy contract
5. ✅ Fund contract account
6. ✅ Generate integration files

Expected output:
```
======================================================================
  BountyBoard Smart Contract Deployment
  Algorand TestNet
======================================================================

🔐 Wallet Setup
----------------------------------------------------------------------
Enter your Lute Wallet mnemonic (25 words):
(This will deploy the contract and fund it)

Mnemonic: [your 25 words here]

✅ Wallet connected
   Address: ABCD...XYZ

🌐 Connecting to Algorand TestNet...
✅ Connected
   Balance: 10.000000 ALGO

======================================================================
  Deployment
======================================================================
📄 Reading TEAL programs...
🔨 Compiling programs...
📝 Creating application transaction...
🚀 Sending transaction...
   Transaction ID: ABC123...
⏳ Waiting for confirmation...
✅ Application deployed successfully!
   Application ID: 12345

📍 Contract Address: EFGH...WXYZ

💰 Funding application account...
⏳ Waiting for funding confirmation...
✅ Application funded with 0.5 ALGO

💾 Saving deployment information...

📦 Deployment files created:
   ✓ contract.json (complete deployment info)
   ✓ contract-abi.json (ABI only)

======================================================================
  🎉 DEPLOYMENT SUCCESSFUL!
======================================================================

📋 Contract Details:
   App ID:      12345
   Address:     EFGH...WXYZ
   Network:     TestNet
   Creator:     ABCD...XYZ

📁 Integration Files:
   contract.json      - Full deployment info
   contract-abi.json  - ABI for frontend

🔗 Explore on TestNet:
   https://testnet.explorer.perawallet.app/application/12345/

✨ Ready for frontend integration!
```

## 📦 Output Files

After successful deployment, you'll have:

### `contract.json`
Complete deployment information including:
- App ID
- App Address
- Creator address
- Full ABI
- Task status enum
- Box schema
- Integration notes

### `contract-abi.json`
Standalone ABI file for frontend integration.

## 🔗 Post-Deployment

### Verify on Explorer

1. Visit: `https://testnet.explorer.perawallet.app/application/[APP_ID]/`
2. Check:
   - Application exists
   - Global state shows `task_counter: 0`
   - Account balance shows ~0.5 ALGO

### Share with Frontend Team

Provide them with:
1. `contract.json`
2. `contract-abi.json`
3. `frontend-integration.ts`
4. `README.md`

### Test Contract (Optional)

You can test the contract using the Algorand SDK or wait for frontend integration.

## 🛠️ Troubleshooting

### Issue: "Insufficient balance"

**Solution:** Get more TestNet ALGO from https://bank.testnet.algorand.network/

### Issue: "Git not found"

**Solution:** We're not using git. This error should not appear with `deploy.py`.

### Issue: "ModuleNotFoundError: No module named 'algosdk'"

**Solution:**
```bash
pip install algosdk
```

### Issue: "Transaction rejected"

**Possible causes:**
1. Insufficient balance
2. Invalid mnemonic
3. Network issues

**Solution:** Check balance and network connection. Try again.

### Issue: "Compilation failed"

**Solution:** Ensure TEAL files are present and not modified.

## 📊 Cost Breakdown

Deploying and funding the contract costs approximately:

- **Contract Creation:** ~0.1 ALGO (transaction fee)
- **Contract Funding:** 0.5 ALGO (for box storage & inner txns)
- **Total:** ~0.6 ALGO

Each task creation will require:
- **Payment Transaction:** Amount + 0.001 ALGO fee
- **App Call Transaction:** ~0.001 ALGO fee
- **Box Storage MBR:** ~0.0025 ALGO per box (8 boxes per task)

## 🔐 Security Reminders

1. **Never share your mnemonic** with anyone
2. **Store mnemonic securely** offline
3. **Verify contract address** before sending ALGO
4. **Test on TestNet** before MainNet deployment
5. **Audit code** before deploying to MainNet

## ✅ Deployment Complete!

Once deployed, the contract is:
- ✅ Immutable (cannot be updated)
- ✅ Permanent (cannot be deleted)
- ✅ Funded (ready for box storage)
- ✅ Ready for tasks

## 🎯 Next Steps

1. **Share files** with frontend team
2. **Test integration** with React app
3. **Create test task** to verify
4. **Monitor** contract on explorer
5. **Document** any issues or questions

## 📞 Support Resources

- **Algorand Discord:** https://discord.gg/algorand
- **Algorand Docs:** https://developer.algorand.org/
- **AlgoSDK Docs:** https://algorand.github.io/js-algorand-sdk/

---

**Ready to deploy? Run `python deploy.py` to begin!** 🚀
