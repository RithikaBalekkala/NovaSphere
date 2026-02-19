"""
BountyBoard Smart Contract using PyTeal
Escrow marketplace for micro-tasks on Algorand TestNet
"""

from pyteal import *


class TaskStatus:
    """Task status enumeration"""
    OPEN = Int(0)
    CLAIMED = Int(1)
    SUBMITTED = Int(2)
    APPROVED = Int(3)
    REJECTED = Int(4)
    REFUNDED = Int(5)


def approval_program():
    """Main approval program for BountyBoard contract"""
    
    # Global state keys
    task_counter = Bytes("task_counter")
    
    # Local task box keys
    client_key = Bytes("client")
    freelancer_key = Bytes("freelancer")
    amount_key = Bytes("amount")
    deadline_key = Bytes("deadline")
    status_key = Bytes("status")
    title_key = Bytes("title")
    description_key = Bytes("description")
    proof_hash_key = Bytes("proof_hash")
    
    # Scratch variables
    task_id_var = ScratchVar(TealType.uint64)
    client_var = ScratchVar(TealType.bytes)
    freelancer_var = ScratchVar(TealType.bytes)
    amount_var = ScratchVar(TealType.uint64)
    status_var = ScratchVar(TealType.uint64)
    deadline_var = ScratchVar(TealType.uint64)
    
    @Subroutine(TealType.bytes)
    def task_box_name(task_id: Expr) -> Expr:
        """Generate box name for a task"""
        return Concat(Bytes("task_"), Itob(task_id))
    
    @Subroutine(TealType.none)
    def set_task_field(task_id: Expr, key: Expr, value: Expr):
        """Set a field in task box storage"""
        return App.box_put(
            Concat(task_box_name(task_id), key),
            value
        )
    
    @Subroutine(TealType.bytes)
    def get_task_field(task_id: Expr, key: Expr) -> Expr:
        """Get a field from task box storage"""
        box_value = App.box_get(Concat(task_box_name(task_id), key))
        return box_value.value()
    
    # ========== CREATE TASK ==========
    on_create_task = Seq([
        # Verify grouped payment transaction
        Assert(Global.group_size() == Int(2)),
        Assert(Gtxn[0].type_enum() == TxnType.Payment),
        Assert(Gtxn[0].receiver() == Global.current_application_address()),
        Assert(Gtxn[0].amount() > Int(0)),
        
        # Get current task counter
        task_id_var.store(App.globalGet(task_counter)),
        
        # Increment counter
        App.globalPut(task_counter, task_id_var.load() + Int(1)),
        
        # Create task box
        Assert(App.box_create(task_box_name(task_id_var.load()), Int(512))),
        
        # Store task fields
        set_task_field(task_id_var.load(), client_key, Txn.sender()),
        set_task_field(task_id_var.load(), freelancer_key, Global.zero_address()),
        set_task_field(task_id_var.load(), amount_key, Itob(Gtxn[0].amount())),
        set_task_field(task_id_var.load(), deadline_key, Txn.application_args[3]),
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.OPEN)),
        set_task_field(task_id_var.load(), title_key, Txn.application_args[1]),
        set_task_field(task_id_var.load(), description_key, Txn.application_args[2]),
        set_task_field(task_id_var.load(), proof_hash_key, Bytes("")),
        
        # Return task ID
        Log(Concat(Bytes("task_created:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== CLAIM TASK ==========
    on_claim_task = Seq([
        task_id_var.store(Btoi(Txn.application_args[1])),
        
        # Verify task exists
        Assert(App.box_length(task_box_name(task_id_var.load())).hasValue()),
        
        # Verify status is OPEN
        status_var.store(Btoi(get_task_field(task_id_var.load(), status_key))),
        Assert(status_var.load() == TaskStatus.OPEN),
        
        # Verify not the client claiming their own task
        client_var.store(get_task_field(task_id_var.load(), client_key)),
        Assert(Txn.sender() != client_var.load()),
        
        # Update freelancer and status
        set_task_field(task_id_var.load(), freelancer_key, Txn.sender()),
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.CLAIMED)),
        
        Log(Concat(Bytes("task_claimed:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== SUBMIT WORK ==========
    on_submit_work = Seq([
        task_id_var.store(Btoi(Txn.application_args[1])),
        
        # Verify task exists
        Assert(App.box_length(task_box_name(task_id_var.load())).hasValue()),
        
        # Verify caller is the freelancer
        freelancer_var.store(get_task_field(task_id_var.load(), freelancer_key)),
        Assert(Txn.sender() == freelancer_var.load()),
        
        # Verify status is CLAIMED
        status_var.store(Btoi(get_task_field(task_id_var.load(), status_key))),
        Assert(status_var.load() == TaskStatus.CLAIMED),
        
        # Update proof hash and status
        set_task_field(task_id_var.load(), proof_hash_key, Txn.application_args[2]),
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.SUBMITTED)),
        
        Log(Concat(Bytes("work_submitted:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== APPROVE TASK ==========
    on_approve_task = Seq([
        task_id_var.store(Btoi(Txn.application_args[1])),
        
        # Verify task exists
        Assert(App.box_length(task_box_name(task_id_var.load())).hasValue()),
        
        # Verify caller is the client
        client_var.store(get_task_field(task_id_var.load(), client_key)),
        Assert(Txn.sender() == client_var.load()),
        
        # Verify status is SUBMITTED
        status_var.store(Btoi(get_task_field(task_id_var.load(), status_key))),
        Assert(status_var.load() == TaskStatus.SUBMITTED),
        
        # Get payment details
        freelancer_var.store(get_task_field(task_id_var.load(), freelancer_key)),
        amount_var.store(Btoi(get_task_field(task_id_var.load(), amount_key))),
        
        # Update status BEFORE transfer (security best practice)
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.APPROVED)),
        
        # Transfer payment to freelancer
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: freelancer_var.load(),
            TxnField.amount: amount_var.load(),
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        
        Log(Concat(Bytes("task_approved:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== REJECT TASK ==========
    on_reject_task = Seq([
        task_id_var.store(Btoi(Txn.application_args[1])),
        
        # Verify task exists
        Assert(App.box_length(task_box_name(task_id_var.load())).hasValue()),
        
        # Verify caller is the client
        client_var.store(get_task_field(task_id_var.load(), client_key)),
        Assert(Txn.sender() == client_var.load()),
        
        # Verify status is SUBMITTED
        status_var.store(Btoi(get_task_field(task_id_var.load(), status_key))),
        Assert(status_var.load() == TaskStatus.SUBMITTED),
        
        # Update status back to CLAIMED for resubmission
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.CLAIMED)),
        set_task_field(task_id_var.load(), proof_hash_key, Bytes("")),
        
        Log(Concat(Bytes("task_rejected:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== REFUND TASK ==========
    on_refund_task = Seq([
        task_id_var.store(Btoi(Txn.application_args[1])),
        
        # Verify task exists
        Assert(App.box_length(task_box_name(task_id_var.load())).hasValue()),
        
        # Get task details
        client_var.store(get_task_field(task_id_var.load(), client_key)),
        status_var.store(Btoi(get_task_field(task_id_var.load(), status_key))),
        deadline_var.store(Btoi(get_task_field(task_id_var.load(), deadline_key))),
        amount_var.store(Btoi(get_task_field(task_id_var.load(), amount_key))),
        
        # Verify caller is client OR deadline has passed
        Assert(
            Or(
                Txn.sender() == client_var.load(),
                Global.latest_timestamp() > deadline_var.load()
            )
        ),
        
        # Verify status is OPEN or CLAIMED
        Assert(
            Or(
                status_var.load() == TaskStatus.OPEN,
                status_var.load() == TaskStatus.CLAIMED
            )
        ),
        
        # Update status BEFORE refund
        set_task_field(task_id_var.load(), status_key, Itob(TaskStatus.REFUNDED)),
        
        # Refund to client
        InnerTxnBuilder.Begin(),
        InnerTxnBuilder.SetFields({
            TxnField.type_enum: TxnType.Payment,
            TxnField.receiver: client_var.load(),
            TxnField.amount: amount_var.load(),
            TxnField.fee: Int(0)
        }),
        InnerTxnBuilder.Submit(),
        
        Log(Concat(Bytes("task_refunded:"), Itob(task_id_var.load()))),
        Approve()
    ])
    
    # ========== METHOD ROUTER ==========
    router = Cond(
        [Txn.application_args[0] == Bytes("create_task"), on_create_task],
        [Txn.application_args[0] == Bytes("claim_task"), on_claim_task],
        [Txn.application_args[0] == Bytes("submit_work"), on_submit_work],
        [Txn.application_args[0] == Bytes("approve_task"), on_approve_task],
        [Txn.application_args[0] == Bytes("reject_task"), on_reject_task],
        [Txn.application_args[0] == Bytes("refund_task"), on_refund_task]
    )
    
    # ========== MAIN PROGRAM ==========
    program = Cond(
        [Txn.application_id() == Int(0), Seq([
            App.globalPut(task_counter, Int(0)),
            Approve()
        ])],
        [Txn.on_completion() == OnComplete.DeleteApplication, Reject()],
        [Txn.on_completion() == OnComplete.UpdateApplication, Reject()],
        [Txn.on_completion() == OnComplete.CloseOut, Reject()],
        [Txn.on_completion() == OnComplete.OptIn, Reject()],
        [Txn.on_completion() == OnComplete.NoOp, router]
    )
    
    return program


def clear_program():
    """Clear state program - reject all clear state transactions"""
    return Approve()


def compile_contract():
    """Compile the contract to TEAL"""
    approval_teal = compileTeal(approval_program(), mode=Mode.Application, version=10)
    clear_teal = compileTeal(clear_program(), mode=Mode.Application, version=10)
    
    # Save TEAL files
    with open("bounty_approval.teal", "w") as f:
        f.write(approval_teal)
    
    with open("bounty_clear.teal", "w") as f:
        f.write(clear_teal)
    
    print("✓ Contract compiled successfully!")
    print("  - bounty_approval.teal")
    print("  - bounty_clear.teal")
    
    return approval_teal, clear_teal


if __name__ == "__main__":
    compile_contract()
