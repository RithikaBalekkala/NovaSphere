import { useState } from 'react';
import { useWallet } from '../WalletProvider';
import { useNavigate } from 'react-router-dom';
import { BountyBoard } from '../frontend-integration';
import contractInfo from '../contract.json';
import toast from 'react-hot-toast';
import algosdk from 'algosdk';

export default function CreateTask() {
  const { activeAddress, signTransactions } = useWallet();
  const navigate = useNavigate();
  const bountyBoard = new BountyBoard(contractInfo);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    days: '7'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!activeAddress) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!formData.title || !formData.description || !formData.amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    try {
      setLoading(true);

      // Calculate deadline
      const deadline = Math.floor(Date.now() / 1000) + (parseInt(formData.days) * 24 * 60 * 60);

      // Create transactions
      const txns = await bountyBoard.createTask(
        activeAddress,
        formData.title,
        formData.description,
        deadline,
        amount
      );

      // Encode transactions
      const encodedTxns = txns.map(txn => algosdk.encodeUnsignedTransaction(txn));

      // Sign transactions
      const signedTxns = await signTransactions(encodedTxns, [0, 1]);

      // Send to network
      const algodClient = new algosdk.Algodv2('', 'https://testnet-api.algonode.cloud', '');
      const { txId } = await algodClient.sendRawTransaction(signedTxns).do();

      // Wait for confirmation
      await algosdk.waitForConfirmation(algodClient, txId, 4);

      toast.success('Task created successfully!');
      navigate('/');
    } catch (error: any) {
      console.error('Failed to create task:', error);
      toast.error(error.message || 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Create New Task</h1>
          <p className="text-gray-600 mt-2">
            Post a task and let freelancers compete to complete it
          </p>
        </div>

        {!activeAddress ? (
          <div className="card text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Wallet Required</h3>
            <p className="mt-2 text-gray-600">
              Please connect your wallet to create a task
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="card">
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <label className="label">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Build a landing page"
                    className="input"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="label">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the task in detail, including requirements and deliverables..."
                    rows={6}
                    className="input"
                    required
                  />
                </div>

                {/* Amount and Deadline */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="label">
                      Reward Amount (ALGO) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="10.0"
                      className="input"
                      required
                    />
                    <p className="mt-1 text-sm text-gray-500">
                      Minimum: 0.1 ALGO
                    </p>
                  </div>

                  <div>
                    <label className="label">
                      Deadline (Days) *
                    </label>
                    <select
                      value={formData.days}
                      onChange={(e) => setFormData({ ...formData, days: e.target.value })}
                      className="input"
                      required
                    >
                      <option value="1">1 Day</option>
                      <option value="3">3 Days</option>
                      <option value="7">7 Days</option>
                      <option value="14">14 Days</option>
                      <option value="30">30 Days</option>
                    </select>
                  </div>
                </div>

                {/* Summary */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-3">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Task Reward:</span>
                      <span className="font-medium">{formData.amount || '0'} ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction Fee:</span>
                      <span className="font-medium">~0.002 ALGO</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Box Storage:</span>
                      <span className="font-medium">~0.02 ALGO</span>
                    </div>
                    <div className="border-t pt-2 mt-2 flex justify-between">
                      <span className="text-gray-900 font-medium">Total Cost:</span>
                      <span className="font-bold text-indigo-600">
                        ~{(parseFloat(formData.amount || '0') + 0.022).toFixed(3)} ALGO
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="btn-secondary"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={loading}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline-block" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Task...
                  </>
                ) : (
                  'Create Task'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
