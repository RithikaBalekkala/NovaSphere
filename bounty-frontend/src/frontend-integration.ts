import algosdk from 'algosdk';

// Task Status Enum
export enum TaskStatus {
  OPEN = 0,
  CLAIMED = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  REJECTED = 4,
  REFUNDED = 5
}

// Task Interface
interface TaskInterface {
  taskId: number;
  client: string;
  freelancer: string;
  amount: bigint;
  deadline: bigint;
  status: TaskStatus;
  title: string;
  description: string;
  proofHash: string;
}

// Contract Info Interface
interface ContractInfoInterface {
  appId: number;
  appAddress: string;
  network: string;
}

// Explicit type exports
export type Task = TaskInterface;
export type ContractInfo = ContractInfoInterface;

// BountyBoard Class
export class BountyBoard {
  private algodClient: algosdk.Algodv2;
  private appId: number;
  private appAddress: string;

  constructor(contractInfo: ContractInfo, algodUrl?: string) {
    this.appId = contractInfo.appId;
    this.appAddress = contractInfo.appAddress;
    
    const apiUrl = algodUrl || 'https://testnet-api.algonode.cloud';
    this.algodClient = new algosdk.Algodv2('', apiUrl, '');
  }

  // Get suggested params
  private async getSuggestedParams(): Promise<algosdk.SuggestedParams> {
    return await this.algodClient.getTransactionParams().do();
  }

  // Read a task from box storage
  async getTask(taskId: number): Promise<Task | null> {
    try {
      const boxName = new Uint8Array([
        ...algosdk.encodeUint64(taskId)
      ]);

      const boxValue = await this.algodClient.getApplicationBoxByName(this.appId, boxName).do();
      return this.decodeTaskBox(taskId, boxValue.value);
    } catch (error) {
      console.error('Error fetching task:', error);
      return null;
    }
  }

  // Decode box data to Task object
  private decodeTaskBox(taskId: number, boxData: Uint8Array): Task {
    let offset = 0;

    // Client address (32 bytes)
    const clientBytes = boxData.slice(offset, offset + 32);
    const client = algosdk.encodeAddress(clientBytes);
    offset += 32;

    // Freelancer address (32 bytes)
    const freelancerBytes = boxData.slice(offset, offset + 32);
    const freelancer = algosdk.encodeAddress(freelancerBytes);
    offset += 32;

    // Amount (8 bytes)
    const amount = this.bytesToBigInt(boxData.slice(offset, offset + 8));
    offset += 8;

    // Deadline (8 bytes)
    const deadline = this.bytesToBigInt(boxData.slice(offset, offset + 8));
    offset += 8;

    // Status (1 byte)
    const status = boxData[offset] as TaskStatus;
    offset += 1;

    // Title length (2 bytes)
    const titleLen = (boxData[offset] << 8) | boxData[offset + 1];
    offset += 2;

    // Title
    const title = new TextDecoder().decode(boxData.slice(offset, offset + titleLen));
    offset += titleLen;

    // Description length (2 bytes)
    const descLen = (boxData[offset] << 8) | boxData[offset + 1];
    offset += 2;

    // Description
    const description = new TextDecoder().decode(boxData.slice(offset, offset + descLen));
    offset += descLen;

    // Proof hash length (2 bytes)
    const proofLen = (boxData[offset] << 8) | boxData[offset + 1];
    offset += 2;

    // Proof hash
    const proofHash = new TextDecoder().decode(boxData.slice(offset, offset + proofLen));

    return {
      taskId,
      client,
      freelancer,
      amount,
      deadline,
      status,
      title,
      description,
      proofHash
    };
  }

  private bytesToBigInt(bytes: Uint8Array): bigint {
    let result = 0n;
    for (let i = 0; i < bytes.length; i++) {
      result = (result << 8n) | BigInt(bytes[i]);
    }
    return result;
  }

  // Get all tasks (by reading task_counter and fetching each task)
  async getAllTasks(): Promise<Task[]> {
    try {
      const globalState = await this.algodClient.getApplicationByID(this.appId).do();
      const taskCounterKey = Buffer.from('task_counter').toString('base64');
      
      let taskCounter = 0;
      for (const kv of globalState.params['global-state']) {
        if (kv.key === taskCounterKey) {
          taskCounter = kv.value.uint;
          break;
        }
      }

      const tasks: Task[] = [];
      for (let i = 1; i <= taskCounter; i++) {
        const task = await this.getTask(i);
        if (task) {
          tasks.push(task);
        }
      }

      return tasks;
    } catch (error) {
      console.error('Error fetching all tasks:', error);
      return [];
    }
  }

  // Get tasks by status
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.status === status);
  }

  // Create task transaction (requires grouped payment)
  async createTask(
    sender: string,
    title: string,
    description: string,
    amount: number,
    deadlineDays: number
  ): Promise<algosdk.Transaction[]> {
    const params = await this.getSuggestedParams();
    const deadline = Math.floor(Date.now() / 1000) + (deadlineDays * 24 * 60 * 60);

    // Payment transaction
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: this.appAddress,
      amount: amount * 1_000_000,
      suggestedParams: params
    });

    // App call transaction
    const appArgs = [
      new Uint8Array(Buffer.from('create_task')),
      new Uint8Array(Buffer.from(title)),
      new Uint8Array(Buffer.from(description)),
      algosdk.encodeUint64(deadline)
    ];

    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });

    // Group transactions
    const txns = [paymentTxn, appCallTxn];
    algosdk.assignGroupID(txns);

    return txns;
  }

  // Claim task
  async claimTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.getSuggestedParams();
    
    const appArgs = [
      new Uint8Array(Buffer.from('claim_task')),
      algosdk.encodeUint64(taskId)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });
  }

  // Submit work
  async submitWork(sender: string, taskId: number, proofHash: string): Promise<algosdk.Transaction> {
    const params = await this.getSuggestedParams();
    
    const appArgs = [
      new Uint8Array(Buffer.from('submit_work')),
      algosdk.encodeUint64(taskId),
      new Uint8Array(Buffer.from(proofHash))
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });
  }

  // Approve task
  async approveTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.getSuggestedParams();
    
    const appArgs = [
      new Uint8Array(Buffer.from('approve_task')),
      algosdk.encodeUint64(taskId)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });
  }

  // Reject task
  async rejectTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.getSuggestedParams();
    
    const appArgs = [
      new Uint8Array(Buffer.from('reject_task')),
      algosdk.encodeUint64(taskId)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });
  }

  // Refund task
  async refundTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.getSuggestedParams();
    
    const appArgs = [
      new Uint8Array(Buffer.from('refund_task')),
      algosdk.encodeUint64(taskId)
    ];

    return algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs,
      suggestedParams: params
    });
  }

  // Utility: Convert microAlgos to Algos
  static microToAlgo(microAlgos: bigint): string {
    return (Number(microAlgos) / 1_000_000).toFixed(2);
  }

  // Utility: Format deadline
  static formatDeadline(timestamp: bigint): string {
    return new Date(Number(timestamp) * 1000).toLocaleDateString();
  }

  // Utility: Get status label
  static getStatusLabel(status: TaskStatus): string {
    const labels = {
      [TaskStatus.OPEN]: 'Open',
      [TaskStatus.CLAIMED]: 'Claimed',
      [TaskStatus.SUBMITTED]: 'Submitted',
      [TaskStatus.APPROVED]: 'Approved',
      [TaskStatus.REJECTED]: 'Rejected',
      [TaskStatus.REFUNDED]: 'Refunded'
    };
    return labels[status] || 'Unknown';
  }
}
