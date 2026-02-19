import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PeraWalletConnect } from '@perawallet/connect';

interface WalletContextValue {
  peraWallet: PeraWalletConnect | null;
  activeAddress: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransactions: (txnGroup: Uint8Array[], indexesToSign?: number[]) => Promise<Uint8Array[]>;
}

const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}

interface WalletProviderProps {
  children: ReactNode;
}

export default function WalletProvider({ children }: WalletProviderProps) {
  const [peraWallet] = useState(() => new PeraWalletConnect({
    chainId: 416002 // TestNet
  }));
  const [activeAddress, setActiveAddress] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Reconnect to session on page load
    peraWallet.reconnectSession().then((accounts) => {
      if (accounts.length > 0) {
        setActiveAddress(accounts[0]);
        setIsConnected(true);
      }
    }).catch((e) => {
      console.log('No previous session', e);
    });

    // Cleanup on unmount
    return () => {
      peraWallet.disconnect();
    };
  }, [peraWallet]);

  const connect = async () => {
    try {
      const accounts = await peraWallet.connect();
      if (accounts.length > 0) {
        setActiveAddress(accounts[0]);
        setIsConnected(true);
      }
    } catch (error) {
      console.error('Failed to connect to Pera Wallet:', error);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await peraWallet.disconnect();
      setActiveAddress(null);
      setIsConnected(false);
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  const signTransactions = async (
    txnGroup: Uint8Array[],
    indexesToSign?: number[]
  ): Promise<Uint8Array[]> => {
    if (!activeAddress) {
      throw new Error('No active wallet address');
    }

    try {
      const signedTxns = await peraWallet.signTransaction([txnGroup.map((txn, index) => ({
        txn,
        signers: indexesToSign && indexesToSign.includes(index) ? [activeAddress] : []
      }))]);
      
      return signedTxns;
    } catch (error) {
      console.error('Failed to sign transactions:', error);
      throw error;
    }
  };

  const value: WalletContextValue = {
    peraWallet,
    activeAddress,
    isConnected,
    connect,
    disconnect,
    signTransactions
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}
