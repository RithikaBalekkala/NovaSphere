import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useWallet } from '../WalletProvider';
import { BountyBoard, type Task, TaskStatus } from '../frontend-integration';
import contractInfo from '../contract.json';
import toast from 'react-hot-toast';
import algosdk from 'algosdk';
import { format } from 'date-fns';

export default function TaskDetails() {
  const { id } = useParams<{ id: string }>();
  const { activeAddress, signTransactions } = useWallet();
  const navigate = useNavigate();
  const bountyBoard = new BountyBoard(contractInfo);

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [proofHash, setProofHash] = useState('');

  useEffect(() => {
    loadTask();
  }, [id]);

  const loadTask = async () => {
    try {
      setLoading(true);
      if (!id) return;
      const taskData = await bountyBoard.getTask(parseInt(id));
      setTask(taskData);
    } catch (error) {
      console.error('Failed to load task:', error);
      toast.error('Failed to load task');
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async () => {
    if (!activeAddress || !task) return;

    try {
      setActionLoading(true);
      const txn = await bountyBoard.claimTask(activeAddress, task.taskId);
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn], [0]);
      
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Task claimed successfully!');
      await loadTask();
    } catch (error: any) {
      console.error('Failed to claim task:', error);
      toast.error(error.message || 'Failed to claim task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitWork = async () => {
    if (!activeAddress || !task || !proofHash) {
      toast.error('Please enter proof hash/URL');
      return;
    }

    try {
      setActionLoading(true);
      const txn = await bountyBoard.submitWork(activeAddress, task.taskId, proofHash);
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn], [0]);
      
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Work submitted successfully!');
      setProofHash('');
      await loadTask();
    } catch (error: any) {
      console.error('Failed to submit work:', error);
      toast.error(error.message || 'Failed to submit work');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!activeAddress || !task) return;

    try {
      setActionLoading(true);
      const txn = await bountyBoard.approveTask(activeAddress, task.taskId);
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn], [0]);
      
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Task approved! Payment released.');
      await loadTask();
    } catch (error: any) {
      console.error('Failed to approve task:', error);
      toast.error(error.message || 'Failed to approve task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!activeAddress || !task) return;

    try {
      setActionLoading(true);
      const txn = await bountyBoard.rejectTask(activeAddress, task.taskId);
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn], [0]);
      
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Work rejected. Freelancer can resubmit.');
      await loadTask();
    } catch (error: any) {
      console.error('Failed to reject task:', error);
      toast.error(error.message || 'Failed to reject task');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async () => {
    if (!activeAddress || !task) return;

    try {
      setActionLoading(true);
      const txn = await bountyBoard.refundTask(activeAddress, task.taskId);
      const encodedTxn = algosdk.encodeUnsignedTransaction(txn);
      const signedTxns = await signTransactions([encodedTxn], [0]);
      
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Task refunded successfully!');
      await loadTask();
    } catch (error: any) {
      console.error('Failed to refund task:', error);
      toast.error(error.message || 'Failed to refund task');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.OPEN: return 'bg-green-100 text-green-800';
      case TaskStatus.CLAIMED: return 'bg-blue-100 text-blue-800';
      case TaskStatus.SUBMITTED: return 'bg-yellow-100 text-yellow-800';
      case TaskStatus.APPROVED: return 'bg-purple-100 text-purple-800';
      case TaskStatus.REJECTED: return 'bg-red-100 text-red-800';
      case TaskStatus.REFUNDED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Task Not Found</h2>
          <button onClick={() => navigate('/')} className="btn-primary mt-4">
            Back to Tasks
          </button>
        </div>
      </div>
    );
  }

  const isClient = activeAddress === task.client;
  const isFreelancer = activeAddress === task.freelancer;
  const isDeadlinePassed = BountyBoard.isDeadlinePassed(task.deadline);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-gray-600 hover:text-indigo-600 flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Tasks
        </button>

        <div className="card mb-6">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{task.title}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(task.status)}`}>
                {BountyBoard.getStatusLabel(task.status)}
              </span>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-indigo-600">
                {BountyBoard.microToAlgo(task.amount)} ALGO
              </div>
              <div className="text-sm text-gray-500">Task #{task.taskId}</div>
            </div>
          </div>

          <div className="prose max-w-none mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{task.description}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t pt-6">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Client</h4>
              <p className="text-sm text-gray-900 font-mono break-all">{task.client}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Freelancer</h4>
              <p className="text-sm text-gray-900 font-mono break-all">
                {task.freelancer === algosdk.encodeAddress(new Uint8Array(32))
                  ? 'Not assigned yet'
                  : task.freelancer}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Deadline</h4>
              <p className={`text-sm font-medium ${isDeadlinePassed ? 'text-red-600' : 'text-gray-900'}`}>
                {format(new Date(Number(task.deadline) * 1000), 'PPPpp')}
                {isDeadlinePassed && ' (Expired)'}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">Proof of Work</h4>
              <p className="text-sm text-gray-900">
                {task.proofHash ? (
                  <a href={task.proofHash} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline break-all">
                    {task.proofHash}
                  </a>
                ) : (
                  'Not submitted yet'
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {activeAddress && (
          <div className="card">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Actions</h3>

            {/* Claim Task (Open status, not client) */}
            {task.status === TaskStatus.OPEN && !isClient && (
              <button
                onClick={handleClaim}
                disabled={actionLoading}
                className="btn-primary w-full disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Claim This Task'}
              </button>
            )}

            {/* Submit Work (Claimed status, is freelancer) */}
            {task.status === TaskStatus.CLAIMED && isFreelancer && (
              <div className="space-y-4">
                <div>
                  <label className="label">Proof of Work (URL or IPFS Hash)</label>
                  <input
                    type="text"
                    value={proofHash}
                    onChange={(e) => setProofHash(e.target.value)}
                    placeholder="https://... or ipfs://..."
                    className="input"
                  />
                </div>
                <button
                  onClick={handleSubmitWork}
                  disabled={actionLoading || !proofHash}
                  className="btn-success w-full disabled:opacity-50"
                >
                  {actionLoading ? 'Submitting...' : 'Submit Work'}
                </button>
              </div>
            )}

            {/* Approve/Reject (Submitted status, is client) */}
            {task.status === TaskStatus.SUBMITTED && isClient && (
              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="btn-success flex-1 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Approve & Release Payment'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="btn-danger flex-1 disabled:opacity-50"
                >
                  {actionLoading ? 'Processing...' : 'Reject Work'}
                </button>
              </div>
            )}

            {/* Refund (Open/Claimed status, is client OR deadline passed) */}
            {(task.status === TaskStatus.OPEN || task.status === TaskStatus.CLAIMED) && 
             (isClient || isDeadlinePassed) && (
              <button
                onClick={handleRefund}
                disabled={actionLoading}
                className="btn-secondary w-full disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Refund Task'}
              </button>
            )}

            {/* No actions available */}
            {task.status === TaskStatus.APPROVED && (
              <div className="text-center py-4 text-gray-600">
                This task has been completed and payment has been released.
              </div>
            )}

            {task.status === TaskStatus.REFUNDED && (
              <div className="text-center py-4 text-gray-600">
                This task has been refunded to the client.
              </div>
            )}
          </div>
        )}

        {!activeAddress && (
          <div className="card text-center py-8">
            <p className="text-gray-600">Connect your wallet to interact with this task</p>
          </div>
        )}
      </div>
    </div>
  );
}
