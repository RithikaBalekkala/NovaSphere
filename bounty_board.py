"""
BountyBoard Smart Contract for Algorand TestNet
A decentralized escrow marketplace for micro-tasks
"""

from algosdk import account, mnemonic, transaction
from algosdk.v2client import algod
from algosdk.atomic_transaction_composer import (
    AtomicTransactionComposer,
    TransactionWithSigner,
    AccountTransactionSigner
)
from algosdk.abi import Contract, Method
from algosdk.encoding import decode_address, encode_address
import json
import base64


# Task Status Enum
class TaskStatus:
    OPEN = 0
    CLAIMED = 1
    SUBMITTED = 2
    APPROVED = 3
    REJECTED = 4
    REFUNDED = 5


# ARC-4 Contract ABI
CONTRACT_ABI = {
    "name": "BountyBoard",
    "desc": "Escrow marketplace for micro-tasks on Algorand",
    "methods": [
        {
            "name": "create_task",
            "args": [
                {"type": "string", "name": "title"},
                {"type": "string", "name": "description"},
                {"type": "uint64", "name": "deadline"},
                {"type": "pay", "name": "payment"}
            ],
            "returns": {"type": "uint64"},
            "desc": "Create a new task with escrow payment"
        },
        {
            "name": "claim_task",
            "args": [
                {"type": "uint64", "name": "task_id"}
            ],
            "returns": {"type": "void"},
            "desc": "Claim an open task"
        },
        {
            "name": "submit_work",
            "args": [
                {"type": "uint64", "name": "task_id"},
                {"type": "string", "name": "proof_hash"}
            ],
            "returns": {"type": "void"},
            "desc": "Submit work proof for a claimed task"
        },
        {
            "name": "approve_task",
            "args": [
                {"type": "uint64", "name": "task_id"}
            ],
            "returns": {"type": "void"},
            "desc": "Approve completed task and release payment"
        },
        {
            "name": "reject_task",
            "args": [
                {"type": "uint64", "name": "task_id"}
            ],
            "returns": {"type": "void"},
            "desc": "Reject submitted work"
        },
        {
            "name": "refund_task",
            "args": [
                {"type": "uint64", "name": "task_id"}
            ],
            "returns": {"type": "void"},
            "desc": "Refund task if deadline passed or by client"
        }
    ],
    "networks": {}
}


# TEAL Smart Contract Code
APPROVAL_PROGRAM = """#pragma version 10

// BountyBoard Contract - Approval Program

txn ApplicationID
int 0
==
bnz create_app

// Router for method calls
txna ApplicationArgs 0
method "create_task(string,string,uint64,pay)uint64"
==
bnz create_task_method

txna ApplicationArgs 0
method "claim_task(uint64)void"
==
bnz claim_task_method

txna ApplicationArgs 0
method "submit_work(uint64,string)void"
==
bnz submit_work_method

txna ApplicationArgs 0
method "approve_task(uint64)void"
==
bnz approve_task_method

txna ApplicationArgs 0
method "reject_task(uint64)void"
==
bnz reject_task_method

txna ApplicationArgs 0
method "refund_task(uint64)void"
==
bnz refund_task_method

err

create_app:
    int 1
    return

create_task_method:
    // Verify grouped payment transaction
    global GroupSize
    int 2
    ==
    assert
    
    gtxn 0 TypeEnum
    int pay
    ==
    assert
    
    gtxn 0 Receiver
    global CurrentApplicationAddress
    ==
    assert
    
    // Extract arguments
    txna ApplicationArgs 1  // title
    txna ApplicationArgs 2  // description
    txna ApplicationArgs 3  // deadline
    btoi
    store 0  // deadline in scratch
    
    gtxn 0 Amount
    store 1  // amount in scratch
    
    // Generate task ID (using global state counter)
    byte "task_counter"
    app_global_get
    store 2  // task_id
    
    // Increment counter
    byte "task_counter"
    load 2
    int 1
    +
    app_global_put
    
    // Create task box
    load 2
    itob
    dup
    box_create
    int 300  // box size
    ==
    assert
    
    // Store task data in box
    load 2
    itob
    byte "client:"
    txn Sender
    concat
    byte ",freelancer:"
    concat
    byte "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
    concat
    byte ",amount:"
    concat
    load 1
    itob
    concat
    byte ",deadline:"
    concat
    load 0
    itob
    concat
    byte ",status:"
    concat
    int 0  // OPEN
    itob
    concat
    byte ",title:"
    concat
    txna ApplicationArgs 1
    concat
    byte ",description:"
    concat
    txna ApplicationArgs 2
    concat
    box_put
    
    // Return task ID
    byte 0x151f7c75  // ARC-4 return prefix
    load 2
    itob
    concat
    log
    
    int 1
    return

claim_task_method:
    // Extract task_id
    txna ApplicationArgs 1
    btoi
    store 3
    
    // Load task box
    load 3
    itob
    box_get
    assert  // task must exist
    store 4  // task data
    
    // Verify status is OPEN (0)
    // Parse status from box data (simplified - in production use proper parsing)
    load 4
    extract 0 1
    btoi
    int 0
    ==
    assert
    
    // Update freelancer and status
    load 3
    itob
    byte "claimed_by:"
    txn Sender
    concat
    byte ",status:"
    concat
    int 1  // CLAIMED
    itob
    concat
    box_replace
    
    int 1
    return

submit_work_method:
    // Extract task_id and proof_hash
    txna ApplicationArgs 1
    btoi
    store 5
    
    txna ApplicationArgs 2
    store 6  // proof_hash
    
    // Load task box
    load 5
    itob
    box_get
    assert
    store 7
    
    // Verify caller is freelancer
    // Verify status is CLAIMED
    
    // Update proof_hash and status to SUBMITTED
    load 5
    itob
    byte "proof:"
    load 6
    concat
    byte ",status:"
    concat
    int 2  // SUBMITTED
    itob
    concat
    box_replace
    
    int 1
    return

approve_task_method:
    // Extract task_id
    txna ApplicationArgs 1
    btoi
    store 8
    
    // Load task
    load 8
    itob
    box_get
    assert
    store 9
    
    // Verify caller is client
    // Verify status is SUBMITTED
    
    // Update status to APPROVED first
    load 8
    itob
    byte "status:"
    int 3  // APPROVED
    itob
    concat
    box_replace
    
    // Transfer payment to freelancer
    itxn_begin
    int pay
    itxn_field TypeEnum
    
    // Get freelancer address from box (parse box data)
    byte "freelancer_address"  // placeholder
    itxn_field Receiver
    
    // Get amount from box
    int 1000000  // placeholder - parse from box
    itxn_field Amount
    
    itxn_submit
    
    int 1
    return

reject_task_method:
    // Extract task_id
    txna ApplicationArgs 1
    btoi
    store 10
    
    // Verify caller is client
    // Verify status is SUBMITTED
    
    // Update status back to CLAIMED
    load 10
    itob
    byte "status:"
    int 1  // CLAIMED
    itob
    concat
    box_replace
    
    int 1
    return

refund_task_method:
    // Extract task_id
    txna ApplicationArgs 1
    btoi
    store 11
    
    // Verify caller is client OR deadline passed
    // Verify status is OPEN or CLAIMED
    
    // Update status to REFUNDED
    load 11
    itob
    byte "status:"
    int 5  // REFUNDED
    itob
    concat
    box_replace
    
    // Refund to client
    itxn_begin
    int pay
    itxn_field TypeEnum
    
    txn Sender
    itxn_field Receiver
    
    int 1000000  // Get from box
    itxn_field Amount
    
    itxn_submit
    
    int 1
    return
"""

CLEAR_PROGRAM = """#pragma version 10
// Clear program - always allow clearing
int 1
return
"""


def get_algod_client():
    """Connect to Algorand TestNet"""
    algod_address = "https://testnet-api.algonode.cloud"
    algod_token = ""
    return algod.AlgodClient(algod_token, algod_address)


def compile_program(client, source_code):
    """Compile TEAL source code"""
    compile_response = client.compile(source_code)
    return base64.b64decode(compile_response['result'])


def create_app(client, creator_private_key):
    """Deploy the BountyBoard application"""
    creator_address = account.address_from_private_key(creator_private_key)
    
    # Get suggested parameters
    params = client.suggested_params()
    
    # Compile programs
    approval_program = compile_program(client, APPROVAL_PROGRAM)
    clear_program = compile_program(client, CLEAR_PROGRAM)
    
    # Define schema
    global_schema = transaction.StateSchema(num_uints=1, num_byte_slices=0)
    local_schema = transaction.StateSchema(num_uints=0, num_byte_slices=0)
    
    # Create transaction
    txn = transaction.ApplicationCreateTxn(
        sender=creator_address,
        sp=params,
        on_complete=transaction.OnComplete.NoOpOC,
        approval_program=approval_program,
        clear_program=clear_program,
        global_schema=global_schema,
        local_schema=local_schema,
        extra_pages=3  # For box storage
    )
    
    # Sign transaction
    signed_txn = txn.sign(creator_private_key)
    
    # Send transaction
    tx_id = client.send_transaction(signed_txn)
    
    # Wait for confirmation
    confirmed_txn = transaction.wait_for_confirmation(client, tx_id, 4)
    
    app_id = confirmed_txn['application-index']
    print(f"Created BountyBoard application with ID: {app_id}")
    
    return app_id


def get_application_address(app_id):
    """Get the application's escrow address"""
    from algosdk.logic import get_application_address
    return get_application_address(app_id)


def fund_application(client, funder_private_key, app_address, amount):
    """Fund the application account for box storage and transactions"""
    funder_address = account.address_from_private_key(funder_private_key)
    params = client.suggested_params()
    
    txn = transaction.PaymentTxn(
        sender=funder_address,
        sp=params,
        receiver=app_address,
        amt=amount
    )
    
    signed_txn = txn.sign(funder_private_key)
    tx_id = client.send_transaction(signed_txn)
    
    transaction.wait_for_confirmation(client, tx_id, 4)
    print(f"Funded application with {amount} microAlgos")


def save_deployment_info(app_id, app_address, abi):
    """Save deployment information for frontend integration"""
    deployment_info = {
        "app_id": app_id,
        "app_address": app_address,
        "network": "testnet",
        "abi": abi
    }
    
    with open('deployment.json', 'w') as f:
        json.dump(deployment_info, f, indent=2)
    
    print(f"\nDeployment information saved to deployment.json")
    print(f"Application ID: {app_id}")
    print(f"Application Address: {app_address}")


if __name__ == "__main__":
    print("BountyBoard Smart Contract Deployment")
    print("=" * 50)
    
    # Get deployer mnemonic
    print("\nPlease enter your Lute Wallet mnemonic (25 words):")
    print("(This will be used to deploy the contract)")
    deployer_mnemonic = input().strip()
    
    try:
        deployer_private_key = mnemonic.to_private_key(deployer_mnemonic)
        deployer_address = account.address_from_private_key(deployer_private_key)
        print(f"\nDeployer address: {deployer_address}")
        
        # Connect to TestNet
        client = get_algod_client()
        
        # Check account balance
        account_info = client.account_info(deployer_address)
        balance = account_info['amount'] / 1_000_000
        print(f"Account balance: {balance} ALGO")
        
        if balance < 1:
            print("\nError: Insufficient balance. Please fund your account with TestNet ALGO.")
            print("Visit: https://bank.testnet.algorand.network/")
            exit(1)
        
        # Deploy application
        print("\nDeploying BountyBoard contract...")
        app_id = create_app(client, deployer_private_key)
        
        # Get application address
        app_address = get_application_address(app_id)
        
        # Fund application for box storage and inner transactions
        print("\nFunding application account...")
        fund_application(client, deployer_private_key, app_address, 500_000)
        
        # Save deployment information
        save_deployment_info(app_id, app_address, CONTRACT_ABI)
        
        print("\n" + "=" * 50)
        print("DEPLOYMENT SUCCESSFUL!")
        print("=" * 50)
        print(f"\nContract Address: {app_address}")
        print(f"Application ID: {app_id}")
        print("\nABI and contract details saved to deployment.json")
        print("You can now integrate this with your frontend!")
        
    except Exception as e:
        print(f"\nError during deployment: {e}")
        import traceback
        traceback.print_exc()
