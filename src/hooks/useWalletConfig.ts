import { useState, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useNostrPublish } from '@/hooks/useNostrPublish';

export interface WalletConfig {
  nwcUrl?: string;
  lightningAddress?: string;
  method: 'webln' | 'nwc' | 'manual';
}

export interface WalletConfigState {
  config: WalletConfig | null;
  isLoading: boolean;
  error: string | null;
}

export function useWalletConfig() {
  const { user } = useCurrentUser();
  const { mutate: createEvent } = useNostrPublish();
  const [localConfig, setLocalConfig] = useLocalStorage<WalletConfig | null>('wallet-config', null);

  const [state, setState] = useState<WalletConfigState>({
    config: localConfig,
    isLoading: false,
    error: null,
  });

  // Validate NWC URL format
  const validateNWCUrl = useCallback((url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'nostr+walletconnect:';
    } catch {
      return false;
    }
  }, []);

  // Validate Lightning address format
  const validateLightningAddress = useCallback((address: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(address);
  }, []);

  // Save wallet configuration locally and optionally to Nostr profile
  const saveConfig = useCallback(async (config: WalletConfig, publishToNostr = false) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Validate inputs
      if (config.nwcUrl && !validateNWCUrl(config.nwcUrl)) {
        throw new Error('Invalid NWC URL format. Must start with nostr+walletconnect://');
      }

      if (config.lightningAddress && !validateLightningAddress(config.lightningAddress)) {
        throw new Error('Invalid Lightning address format. Must be in format user@domain.com');
      }

      // Save locally
      setLocalConfig(() => config);
      setState(prev => ({ ...prev, config, isLoading: false }));

      // Optionally publish to Nostr profile (kind 0)
      if (publishToNostr && user && config.lightningAddress) {
        // Get current profile - user object might not have metadata directly
        const currentProfile = {}; // We'll need to fetch this from the user's kind 0 event

        // Update profile with Lightning address
        const updatedProfile = {
          ...currentProfile,
          lud16: config.lightningAddress, // NIP-57 Lightning address
        };

        // Publish updated profile
        createEvent({
          kind: 0,
          content: JSON.stringify(updatedProfile),
          tags: [],
        });
      }

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      setState(prev => ({ ...prev, error: errorMessage, isLoading: false }));
      return false;
    }
  }, [validateNWCUrl, validateLightningAddress, setLocalConfig, user, createEvent]);

  // Clear wallet configuration
  const clearConfig = useCallback(() => {
    setLocalConfig(() => null);
    setState({
      config: null,
      isLoading: false,
      error: null,
    });
  }, [setLocalConfig]);

  // Get NWC connection details from URL
  const parseNWCUrl = useCallback((url: string) => {
    try {
      const parsed = new URL(url);
      const pubkey = parsed.hostname;
      const secret = parsed.searchParams.get('secret');
      const relay = parsed.searchParams.get('relay');

      return { pubkey, secret, relay };
    } catch {
      return null;
    }
  }, []);

  return {
    ...state,
    saveConfig,
    clearConfig,
    validateNWCUrl,
    validateLightningAddress,
    parseNWCUrl,
  };
}