import { useWallet } from '../WalletProvider';
import { Link } from 'react-router-dom';

export default function Header() {
  const { activeAddress, isConnected, connect, disconnect } = useWallet();

  const handleConnect = async () => {
    try {
      await connect();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <>
      <header className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-indigo-600">
                  BountyBoard
                </div>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                  Tasks
                </Link>
                <Link to="/create" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                  Create Task
                </Link>
                {activeAddress && (
                  <Link to="/dashboard" className="text-gray-700 hover:text-indigo-600 font-medium transition">
                    Dashboard
                  </Link>
                )}
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {activeAddress ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block text-sm text-gray-600">
                    {formatAddress(activeAddress)}
                  </div>
                  <button
                    onClick={handleDisconnect}
                    className="btn-secondary text-sm"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  className="btn-primary"
                >
                  Connect Pera Wallet
                </button>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
