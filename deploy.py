"""
Deployment script for BountyBoard Smart Contract
Deploys to Algorand TestNet and saves ABI for frontend integration
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.logic import get_application_address
import json
import base64


# Contract ABI for frontend integration
CONTRACT_ABI = {
    "name": "BountyBoard",
    "description": "Escrow marketplace for micro-tasks on Algorand",
    "methods": [
        {
            "name": "create_task",
            "args": [
                {
                    "type": "string",
                    "name": "title",
                    "description": "Task title"
                },
                {
                    "type": "string",
                    "name": "description",
                    "description": "Task description"
                },
                {
                    "type": "uint64",
                    "name": "deadline",
                    "description": "Unix timestamp deadline"
                }
            ],
            "returns": {
                "type": "uint64",
                "description": "Task ID"
            },
            "description": "Create a new task with escrow payment (requires grouped payment transaction)"
        },
        {
            "name": "claim_task",
            "args": [
                {
                    "type": "uint64",
                    "name": "task_id",
                    "description": "Task ID to claim"
                }
            ],
            "returns": {"type": "void"},
            "description": "Claim an open task as a freelancer"
        },
        {
            "name": "submit_work",
            "args": [
                {
                    "type": "uint64",
                    "name": "task_id",
                    "description": "Task ID"
                },
                {
                    "type": "string",
                    "name": "proof_hash",
                    "description": "IPFS hash or URL of work proof"
                }
            ],
            "returns": {"type": "void"},
            "description": "Submit work proof for a claimed task"
        },
        {
            "name": "approve_task",
            "args": [
                {
                    "type": "uint64",
                    "name": "task_id",
                    "description": "Task ID to approve"
                }
            ],
            "returns": {"type": "void"},
            "description": "Approve completed task and release payment to freelancer"
        },
        {
            "name": "reject_task",
            "args": [
                {
                    "type": "uint64",
                    "name": "task_id",
                    "description": "Task ID to reject"
                }
            ],
            "returns": {"type": "void"},
            "description": "Reject submitted work (allows resubmission)"
        },
        {
            "name": "refund_task",
            "args": [
                {
                    "type": "uint64",
                    "name": "task_id",
                    "description": "Task ID to refund"
                }
            ],
            "returns": {"type": "void"},
            "description": "Refund task if deadline passed or by client before work submitted"
        }
    ],
    "networks": {}
}


# Task status constants for frontend
TASK_STATUS = {
    "OPEN": 0,
    "CLAIMED": 1,
    "SUBMITTED": 2,
    "APPROVED": 3,
    "REJECTED": 4,
    "REFUNDED": 5
}


def get_algod_client():
    """Connect to Algorand TestNet via public node"""
    algod_address = "https://testnet-api.algonode.cloud"
    algod_token = ""
    return algod.AlgodClient(algod_token, algod_address)


def compile_teal(client, teal_source):
    """Compile TEAL source code"""
    compile_response = client.compile(teal_source)
    return base64.b64decode(compile_response['result'])


def deploy_contract(client, creator_private_key):
    """Deploy the BountyBoard smart contract"""
    creator_address = account.address_from_private_key(creator_private_key)
    
    # Read TEAL files
    print("📄 Reading TEAL programs...")
    with open('bounty_approval.teal', 'r') as f:
        approval_teal = f.read()
    
    with open('bounty_clear.teal', 'r') as f:
        clear_teal = f.read()
    
    # Compile programs
    print("🔨 Compiling programs...")
    approval_program = compile_teal(client, approval_teal)
    clear_program = compile_teal(client, clear_teal)
    
    # Get suggested parameters
    params = client.suggested_params()
    
    # Define schema (minimal - using boxes for storage)
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    
    # Create application
    print("📝 Creating application transaction...")
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        extra_pages=3  # Extra pages for box storage
    )
    
    # Sign transaction
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    print("🚀 Sending transaction...")
    tx_id = client.send_transaction(signed_txn)
    print(f"   Transaction ID: {tx_id}")
    
    # Wait for confirmation
    print("⏳ Waiting for confirmation...")
    confirmed_txn = transaction.wait_for_confirmation(client, tx_id, 4)
    
    app_id = confirmed_txn['application-index']
    print(f"✅ Application deployed successfully!")
    print(f"   Application ID: {app_id}")
    
    return app_id


def fund_application(client, funder_private_key, app_address, amount_in_algo):
    """Fund the application account for box storage and inner transactions"""
    funder_address = account.address_from_private_key(funder_private_key)
    params = client.suggested_params()
    
    amount_microalgos = int(amount_in_algo * 1_000_000)
    
    txn = transaction.PaymentTxn(
        sender=funder_address,
        sp=params,
        receiver=app_address,
        amt=amount_microalgos
    )
    
    signed_txn = txn.sign(funder_private_key)
    tx_id = client.send_transaction(signed_txn)
    
    print("⏳ Waiting for funding confirmation...")
    transaction.wait_for_confirmation(client, tx_id, 4)
    print(f"✅ Application funded with {amount_in_algo} ALGO")


def save_deployment_info(app_id, app_address, creator_address, abi, status_enum):
    """Save deployment information for frontend integration"""
    deployment_info = {
        "contractName": "BountyBoard",
        "version": "1.0.0",
        "network": "testnet",
        "appId": app_id,
        "appAddress": app_address,
        "creator": creator_address,
        "deployedAt": None,  # Frontend can add this
        "abi": abi,
        "taskStatus": status_enum,
        "boxSchema": {
            "description": "Tasks are stored in boxes with the following keys",
            "keys": [
                "{task_id}_client",
                "{task_id}_freelancer",
                "{task_id}_amount",
                "{task_id}_deadline",
                "{task_id}_status",
                "{task_id}_title",
                "{task_id}_description",
                "{task_id}_proof"
            ]
        },
        "notes": {
            "create_task": "Requires atomic group with payment transaction first",
            "deadline": "Unix timestamp in seconds",
            "amounts": "In microAlgos (1 ALGO = 1,000,000 microAlgos)",
            "minimum_balance": "Contract needs ~0.5 ALGO for box storage per task"
        }
    }
    
    # Save as JSON
    with open('contract.json', 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    # Save ABI separately for easy integration
    with open('contract-abi.json', 'w') as f:
        json.dump(abi, f, indent=2)
    
    print("\n📦 Deployment files created:")
    print("   ✓ contract.json (complete deployment info)")
    print("   ✓ contract-abi.json (ABI only)")


def main():
    """Main deployment function"""
    print("=" * 70)
    print("  BountyBoard Smart Contract Deployment")
    print("  Algorand TestNet")
    print("=" * 70)
    print()
    
    # Get deployer wallet info
    print("🔐 Wallet Setup")
    print("-" * 70)
    print("Enter your Lute Wallet mnemonic (25 words):")
    print("(This will deploy the contract and fund it)")
    print()
    deployer_mnemonic = input("Mnemonic: ").strip()
    
    try:
        # Derive keys
        deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
        deployer_address = account.address_from_private_key(deployer_private_key)
        
        print(f"\n✅ Wallet connected")
        print(f"   Address: {deployer_address}")
        
        # Connect to TestNet
        print("\n🌐 Connecting to Algorand TestNet...")
        client = get_algod_client()
        
        # Check balance
        account_info = client.account_info(deployer_address)
        balance_algo = account_info['amount'] / 1_000_000
        print(f"✅ Connected")
        print(f"   Balance: {balance_algo:.6f} ALGO")
        
        if balance_algo < 0.5:
            print("\n❌ Error: Insufficient balance")
            print(f"   Required: ~0.5 ALGO minimum")
            print(f"   Your balance: {balance_algo:.6f} ALGO")
            print("\n💡 Get TestNet ALGO from:")
            print("   https://bank.testnet.algorand.network/")
            return
        
        print("\n" + "=" * 70)
        print("  Deployment")
        print("=" * 70)
        
        # Deploy contract
        app_id = deploy_contract(client, deployer_private_key)
        app_address = get_application_address(app_id)
        
        print(f"\n📍 Contract Address: {app_address}")
        
        # Fund application
        print("\n💰 Funding application account...")
        fund_application(client, deployer_private_key, app_address, 0.5)
        
        # Save deployment info
        print("\n💾 Saving deployment information...")
        save_deployment_info(app_id, app_address, deployer_address, CONTRACT_ABI, TASK_STATUS)
        
        # Final summary
        print("\n" + "=" * 70)
        print("  🎉 DEPLOYMENT SUCCESSFUL!")
        print("=" * 70)
        print(f"\n📋 Contract Details:")
        print(f"   App ID:      {app_id}")
        print(f"   Address:     {app_address}")
        print(f"   Network:     TestNet")
        print(f"   Creator:     {deployer_address}")
        
        print(f"\n📁 Integration Files:")
        print(f"   contract.json      - Full deployment info")
        print(f"   contract-abi.json  - ABI for frontend")
        
        print(f"\n🔗 Explore on TestNet:")
        print(f"   https://testnet.explorer.perawallet.app/application/{app_id}/")
        
        print(f"\n✨ Ready for frontend integration!")
        print()
        
    except Exception as e:
        print(f"\n❌ Deployment failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
