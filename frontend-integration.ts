/**
 * BountyBoard Contract Integration Helper
 * Ready-to-use functions for React + TypeScript frontend
 * 
 * Usage:
 * 1. Copy this file to your React project
 * 2. Import contract.json
 * 3. Use BountyBoard class methods
 */

import algosdk from 'algosdk';

// Import your deployed contract info
// import contractInfo from './contract.json';

export enum TaskStatus {
  OPEN = 0,
  CLAIMED = 1,
  SUBMITTED = 2,
  APPROVED = 3,
  REJECTED = 4,
  REFUNDED = 5
}

export interface Task {
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

export interface ContractInfo {
  appId: number;
  appAddress: string;
  network: string;
}

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

  /**
   * Create a new task with escrowed payment
   * Returns unsigned transactions for wallet to sign
   */
  async createTask(
    sender: string,
    title: string,
    description: string,
    deadlineTimestamp: number,
    amountAlgos: number
  ): Promise<algosdk.Transaction[]> {
    const params = await this.algodClient.getTransactionParams().do();
    const amountMicroAlgos = Math.floor(amountAlgos * 1_000_000);

    // Transaction 1: Payment to contract
    const paymentTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
      from: sender,
      to: this.appAddress,
      amount: amountMicroAlgos,
      suggestedParams: params
    });

    // Transaction 2: App call
    const encoder = new TextEncoder();
    const appCallTxn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        encoder.encode('create_task'),
        encoder.encode(title),
        encoder.encode(description),
        algosdk.encodeUint64(deadlineTimestamp)
      ],
      suggestedParams: params
    });

    // Group transactions
    algosdk.assignGroupID([paymentTxn, appCallTxn]);

    return [paymentTxn, appCallTxn];
  }

  /**
   * Claim an open task
   */
  async claimTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode('claim_task'),
        algosdk.encodeUint64(taskId)
      ],
      boxes: [
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_status`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_client`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_freelancer`) }
      ],
      suggestedParams: params
    });

    return txn;
  }

  /**
   * Submit work proof
   */
  async submitWork(
    sender: string,
    taskId: number,
    proofHash: string
  ): Promise<algosdk.Transaction> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode('submit_work'),
        algosdk.encodeUint64(taskId),
        new TextEncoder().encode(proofHash)
      ],
      boxes: [
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_status`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_freelancer`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_proof`) }
      ],
      suggestedParams: params
    });

    return txn;
  }

  /**
   * Approve task and release payment
   */
  async approveTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode('approve_task'),
        algosdk.encodeUint64(taskId)
      ],
      boxes: [
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_status`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_client`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_freelancer`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_amount`) }
      ],
      suggestedParams: params
    });

    return txn;
  }

  /**
   * Reject submitted work
   */
  async rejectTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode('reject_task'),
        algosdk.encodeUint64(taskId)
      ],
      boxes: [
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_status`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_client`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_proof`) }
      ],
      suggestedParams: params
    });

    return txn;
  }

  /**
   * Refund task to client
   */
  async refundTask(sender: string, taskId: number): Promise<algosdk.Transaction> {
    const params = await this.algodClient.getTransactionParams().do();
    
    const txn = algosdk.makeApplicationNoOpTxnFromObject({
      from: sender,
      appIndex: this.appId,
      appArgs: [
        new TextEncoder().encode('refund_task'),
        algosdk.encodeUint64(taskId)
      ],
      boxes: [
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_status`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_client`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_deadline`) },
        { appIndex: this.appId, name: this.getBoxName(`${taskId}_amount`) }
      ],
      suggestedParams: params
    });

    return txn;
  }

  /**
   * Read task data from box storage
   */
  async getTask(taskId: number): Promise<Task | null> {
    try {
      const [client, freelancer, amount, deadline, status, title, description, proof] = 
        await Promise.all([
          this.getBoxValue(`${taskId}_client`),
          this.getBoxValue(`${taskId}_freelancer`),
          this.getBoxValue(`${taskId}_amount`),
          this.getBoxValue(`${taskId}_deadline`),
          this.getBoxValue(`${taskId}_status`),
          this.getBoxValue(`${taskId}_title`),
          this.getBoxValue(`${taskId}_description`),
          this.getBoxValue(`${taskId}_proof`)
        ]);

      return {
        taskId,
        client: algosdk.encodeAddress(client),
        freelancer: algosdk.encodeAddress(freelancer),
        amount: this.bytesToBigInt(amount),
        deadline: this.bytesToBigInt(deadline),
        status: Number(this.bytesToBigInt(status)) as TaskStatus,
        title: new TextDecoder().decode(title),
        description: new TextDecoder().decode(description),
        proofHash: new TextDecoder().decode(proof)
      };
    } catch (error) {
      console.error(`Failed to get task ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Get all tasks (by reading global state counter and fetching each)
   */
  async getAllTasks(): Promise<Task[]> {
    try {
      // Get task counter from global state
      const appInfo = await this.algodClient.getApplicationByID(this.appId).do();
      const globalState = appInfo.params['global-state'];
      
      let taskCount = 0;
      for (const item of globalState) {
        const key = Buffer.from(item.key, 'base64').toString();
        if (key === 'task_counter') {
          taskCount = item.value.uint;
          break;
        }
      }

      // Fetch all tasks
      const tasks: Task[] = [];
      for (let i = 0; i < taskCount; i++) {
        const task = await this.getTask(i);
        if (task) {
          tasks.push(task);
        }
      }

      return tasks;
    } catch (error) {
      console.error('Failed to get all tasks:', error);
      return [];
    }
  }

  /**
   * Filter tasks by status
   */
  async getTasksByStatus(status: TaskStatus): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.status === status);
  }

  /**
   * Get tasks created by a specific address
   */
  async getTasksByClient(clientAddress: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => task.client === clientAddress);
  }

  /**
   * Get tasks claimed by a specific address
   */
  async getTasksByFreelancer(freelancerAddress: string): Promise<Task[]> {
    const allTasks = await this.getAllTasks();
    return allTasks.filter(task => 
      task.freelancer === freelancerAddress && 
      task.freelancer !== algosdk.encodeAddress(new Uint8Array(32)) // Not zero address
    );
  }

  /**
   * Helper: Get box value
   */
  private async getBoxValue(boxKey: string): Promise<Uint8Array> {
    const boxName = this.getBoxName(boxKey);
    const box = await this.algodClient.getApplicationBoxByName(this.appId, boxName).do();
    return new Uint8Array(box.value);
  }

  /**
   * Helper: Convert box key to bytes
   */
  private getBoxName(key: string): Uint8Array {
    return new TextEncoder().encode(key);
  }

  /**
   * Helper: Convert bytes to BigInt
   */
  private bytesToBigInt(bytes: Uint8Array): bigint {
    if (bytes.length === 0) return BigInt(0);
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    return view.getBigUint64(0, false); // Big-endian
  }

  /**
   * Helper: Convert microAlgos to Algos
   */
  static microToAlgo(microAlgos: bigint): number {
    return Number(microAlgos) / 1_000_000;
  }

  /**
   * Helper: Convert Algos to microAlgos
   */
  static algoToMicro(algos: number): bigint {
    return BigInt(Math.floor(algos * 1_000_000));
  }

  /**
   * Helper: Format deadline for display
   */
  static formatDeadline(timestamp: bigint): string {
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleString();
  }

  /**
   * Helper: Check if deadline has passed
   */
  static isDeadlinePassed(timestamp: bigint): boolean {
    const now = Math.floor(Date.now() / 1000);
    return now > Number(timestamp);
  }

  /**
   * Helper: Get status label
   */
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

/**
 * Example usage in React component:
 * 
 * import { BountyBoard, TaskStatus } from './frontend-integration';
 * import { useWallet } from '@txnlab/use-wallet';
 * import contractInfo from './contract.json';
 * 
 * function MyComponent() {
 *   const { activeAddress, signTransactions } = useWallet();
 *   const bountyBoard = new BountyBoard(contractInfo);
 *   
 *   // Create task
 *   const handleCreateTask = async () => {
 *     const txns = await bountyBoard.createTask(
 *       activeAddress,
 *       'Build a website',
 *       'Need a React developer',
 *       Math.floor(Date.now() / 1000) + 86400, // 24 hours
 *       5 // 5 ALGO
 *     );
 *     
 *     const signed = await signTransactions(
 *       txns.map(txn => txn.toByte())
 *     );
 *     
 *     await algodClient.sendRawTransaction(signed).do();
 *   };
 *   
 *   // Get all open tasks
 *   const [tasks, setTasks] = useState([]);
 *   useEffect(() => {
 *     bountyBoard.getTasksByStatus(TaskStatus.OPEN)
 *       .then(setTasks);
 *   }, []);
 *   
 *   return (
 *     <div>
 *       {tasks.map(task => (
 *         <div key={task.taskId}>
 *           <h3>{task.title}</h3>
 *           <p>{task.description}</p>
 *           <p>Amount: {BountyBoard.microToAlgo(task.amount)} ALGO</p>
 *           <p>Deadline: {BountyBoard.formatDeadline(task.deadline)}</p>
 *         </div>
 *       ))}
 *     </div>
 *   );
 * }
 */
