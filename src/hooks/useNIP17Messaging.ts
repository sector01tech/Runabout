import { useNostr } from '@nostrify/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useMutation, useQuery } from '@tanstack/react-query';

export interface DirectMessage {
  id: string;
  pubkey: string;
  content: string;
  created_at: number;
  recipient: string;
  subject?: string;
}

export interface SendMessageParams {
  recipientPubkey: string;
  content: string;
  subject?: string;
  replyTo?: string;
}

export function useNIP17Messaging() {
  const { nostr } = useNostr();
  const { user } = useCurrentUser();

  // Send a direct message using NIP-17 (simplified implementation)
  const sendMessage = useMutation({
    mutationFn: async ({ recipientPubkey, content, subject, replyTo }: SendMessageParams) => {
      if (!user?.signer) {
        throw new Error('User must be logged in to send messages');
      }

      if (!user.signer.nip44) {
        throw new Error('Please upgrade your signer extension to a version that supports NIP-44 encryption');
      }

      // For now, we'll use a simplified approach with kind 4 (encrypted DM)
      // This is a fallback until full NIP-17 implementation is ready
      const encryptedContent = await user.signer.nip44.encrypt(recipientPubkey, content);

      const tags = [
        ['p', recipientPubkey],
      ];

      if (subject) {
        tags.push(['subject', subject]);
      }
      if (replyTo) {
        tags.push(['e', replyTo]);
      }

      const event = {
        kind: 4, // Encrypted Direct Message (legacy, but widely supported)
        content: encryptedContent,
        tags,
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(event);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return { success: true, messageId: signedEvent.id };
    },
  });

  // Get user's DM relay preferences
  const { data: dmRelays } = useQuery({
    queryKey: ['dm-relays', user?.pubkey],
    queryFn: async () => {
      if (!user?.pubkey) return [];

      const events = await nostr.query([{
        kinds: [10050],
        authors: [user.pubkey],
        limit: 1,
      }]);

      if (events.length === 0) return [];

      return events[0].tags
        .filter(([name]) => name === 'relay')
        .map(([, url]) => url);
    },
    enabled: !!user?.pubkey,
  });

  // Publish DM relay preferences
  const publishDMRelays = useMutation({
    mutationFn: async (relays: string[]) => {
      if (!user?.signer) {
        throw new Error('User must be logged in');
      }

      const event = {
        kind: 10050,
        content: '',
        tags: relays.map(relay => ['relay', relay]),
        created_at: Math.floor(Date.now() / 1000),
      };

      const signedEvent = await user.signer.signEvent(event);
      await nostr.event(signedEvent, { signal: AbortSignal.timeout(5000) });

      return signedEvent;
    },
  });

  return {
    sendMessage,
    dmRelays,
    publishDMRelays,
    isReady: !!user?.signer?.nip44,
  };
}