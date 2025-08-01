import { useState, useCallback, useEffect } from 'react';
import { webln } from '@getalby/sdk';
import { useWalletConfig } from '@/hooks/useWalletConfig';

export interface WalletState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  balance: number | null; // satoshis
}

export interface PaymentRequest {
  amount: number; // satoshis
  description: string;
}

export function useWalletConnect() {
  const { config } = useWalletConfig();
  const [state, setState] = useState<WalletState>({
    connected: false,
    connecting: false,
    error: null,
    balance: null,
  });
  const [nwcProvider, setNwcProvider] = useState<webln.NostrWebLNProvider | null>(null);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      // Use configured method or default to WebLN
      const method = config?.method || 'webln';

      if (method === 'webln') {
        // Try WebLN (browser extension wallets)
        if (typeof window !== 'undefined' && window.webln) {
          await window.webln.enable();
          setState(prev => ({
            ...prev,
            connected: true,
            connecting: false,
            error: null
          }));
          return;
        } else {
          throw new Error('WebLN not available. Please install a WebLN-compatible wallet extension.');
        }
      } else if (method === 'nwc' && config?.nwcUrl) {
        // Use Nostr Wallet Connect
        const nwc = new webln.NostrWebLNProvider({
          nostrWalletConnectUrl: config.nwcUrl
        });
        await nwc.enable();
        setNwcProvider(nwc);

        setState(prev => ({
          ...prev,
          connected: true,
          connecting: false,
          error: null
        }));
        return;
      } else if (method === 'manual') {
        // Manual configuration - just mark as "connected" for Lightning address
        if (config?.lightningAddress) {
          setState(prev => ({
            ...prev,
            connected: true,
            connecting: false,
            error: null
          }));
          return;
        } else {
          throw new Error('Lightning address not configured. Please set up your Lightning address.');
        }
      }

      throw new Error('No wallet configuration found. Please configure your wallet first.');
    } catch (error) {
      setState(prev => ({
        ...prev,
        connected: false,
        connecting: false,
        error: error instanceof Error ? error.message : 'Failed to connect wallet'
      }));
    }
  }, [config]);

  const disconnect = useCallback(() => {
    setNwcProvider(null);
    setState({
      connected: false,
      connecting: false,
      error: null,
      balance: null,
    });
  }, []);

  const getBalance = useCallback(async (): Promise<number | null> => {
    if (!state.connected) return null;

    try {
      const method = config?.method || 'webln';

      if (method === 'webln' && window.webln?.getBalance) {
        const balance = await window.webln.getBalance();
        const balanceInSats = balance.balance;
        setState(prev => ({ ...prev, balance: balanceInSats }));
        return balanceInSats;
      } else if (method === 'nwc' && nwcProvider?.getBalance) {
        const balance = await nwcProvider.getBalance();
        const balanceInSats = balance.balance;
        setState(prev => ({ ...prev, balance: balanceInSats }));
        return balanceInSats;
      } else if (method === 'manual') {
        // Manual configuration doesn't support balance checking
        setState(prev => ({ ...prev, balance: null }));
        return null;
      }
    } catch (error) {
      console.error('Failed to get balance:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to get balance'
      }));
    }

    return null;
  }, [state.connected, config?.method, nwcProvider]);

  const makeInvoice = useCallback(async (request: PaymentRequest): Promise<string | null> => {
    if (!state.connected) return null;

    try {
      const method = config?.method || 'webln';

      if (method === 'webln' && window.webln) {
        const invoice = await window.webln.makeInvoice({
          amount: request.amount,
          defaultMemo: request.description,
        });
        return invoice.paymentRequest;
      } else if (method === 'nwc' && nwcProvider) {
        const invoice = await nwcProvider.makeInvoice({
          amount: request.amount,
          defaultMemo: request.description,
        });
        return invoice.paymentRequest;
      } else if (method === 'manual') {
        // Manual configuration doesn't support invoice creation
        throw new Error('Invoice creation not supported with manual configuration. Use your Lightning address to receive payments.');
      }

      throw new Error('No wallet provider available for invoice creation.');
    } catch (error) {
      console.error('Failed to create invoice:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to create invoice'
      }));
      return null;
    }
  }, [state.connected, config?.method, nwcProvider]);

  const payInvoice = useCallback(async (invoice: string): Promise<boolean> => {
    if (!state.connected) return false;

    try {
      const method = config?.method || 'webln';

      if (method === 'webln' && window.webln) {
        await window.webln.sendPayment(invoice);
        return true;
      } else if (method === 'nwc' && nwcProvider) {
        await nwcProvider.sendPayment(invoice);
        return true;
      } else if (method === 'manual') {
        // Manual configuration doesn't support automatic payments
        throw new Error('Automatic payments not supported with manual configuration. Please pay the invoice manually using your wallet.');
      }

      throw new Error('No wallet provider available for payments.');
    } catch (error) {
      console.error('Failed to pay invoice:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to pay invoice'
      }));
      return false;
    }
  }, [state.connected, config?.method, nwcProvider]);

  // Auto-connect if configuration changes
  useEffect(() => {
    if (config && !state.connected && !state.connecting) {
      // Auto-connect for manual method since it doesn't require actual connection
      if (config.method === 'manual' && config.lightningAddress) {
        setState(prev => ({ ...prev, connected: true }));
      }
    }
  }, [config, state.connected, state.connecting]);

  return {
    ...state,
    connect,
    disconnect,
    getBalance,
    makeInvoice,
    payInvoice,
  };
}

// Extend the Window interface for WebLN
declare global {
  interface Window {
    webln?: {
      enable(): Promise<void>;
      getBalance(): Promise<{ balance: number }>;
      makeInvoice(args: { amount: number; defaultMemo: string }): Promise<{ paymentRequest: string }>;
      sendPayment(invoice: string): Promise<void>;
    };
  }
}