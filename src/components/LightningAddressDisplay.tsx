import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useWalletConfig } from '@/hooks/useWalletConfig';
import { useToast } from '@/hooks/useToast';
import { Zap, Copy, QrCode, ExternalLink } from 'lucide-react';

interface LightningAddressDisplayProps {
  _recipientPubkey?: string; // Future use for fetching recipient's Lightning address
  amount?: number; // satoshis
  description?: string;
  className?: string;
}

export function LightningAddressDisplay({
  _recipientPubkey,
  amount,
  description,
  className
}: LightningAddressDisplayProps) {
  const [customAmount, setCustomAmount] = useState(amount ? (amount / 1000).toString() : '');
  const [memo, setMemo] = useState(description || '');
  const { config } = useWalletConfig();
  const { toast } = useToast();

  // Use the current user's Lightning address for now
  // TODO: Implement recipient Lightning address fetching from Nostr profile
  const lightningAddress = config?.lightningAddress;

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'Lightning address copied to clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const openLightningWallet = () => {
    if (!lightningAddress) return;

    const amountSats = customAmount ? parseInt(customAmount) * 1000 : undefined;
    const lightningUrl = `lightning:${lightningAddress}${amountSats ? `?amount=${amountSats}` : ''}${memo ? `&message=${encodeURIComponent(memo)}` : ''}`;

    window.open(lightningUrl, '_blank');
  };

  if (!lightningAddress) {
    return (
      <Card className={className}>
        <CardContent className="py-6 text-center">
          <Zap className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No Lightning address configured
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Lightning Payment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Lightning Address */}
        <div className="space-y-2">
          <Label>Lightning Address</Label>
          <div className="flex items-center gap-2">
            <div className="bg-muted/50 p-2 rounded text-sm font-mono flex-1 break-all">
              {lightningAddress}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(lightningAddress)}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (sats)</Label>
          <Input
            id="amount"
            type="number"
            placeholder="Enter amount in sats"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            min="1"
          />
          {customAmount && (
            <p className="text-xs text-muted-foreground">
              ≈ ${((parseInt(customAmount) || 0) * 0.0004).toFixed(2)} USD
            </p>
          )}
        </div>

        {/* Memo Input */}
        <div className="space-y-2">
          <Label htmlFor="memo">Memo (optional)</Label>
          <Input
            id="memo"
            placeholder="Payment description"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
          />
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={openLightningWallet}
            disabled={!customAmount}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Wallet
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              // Generate QR code URL (you could integrate with a QR code library)
              const amountSats = customAmount ? parseInt(customAmount) * 1000 : undefined;
              const lightningUrl = `lightning:${lightningAddress}${amountSats ? `?amount=${amountSats}` : ''}${memo ? `&message=${encodeURIComponent(memo)}` : ''}`;

              // For now, just copy the lightning URL
              copyToClipboard(lightningUrl);
            }}
            disabled={!customAmount}
          >
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Send payments to this Lightning address</p>
          <p>• Compatible with most Lightning wallets</p>
          <p>• Instant and low-fee transactions</p>
        </div>
      </CardContent>
    </Card>
  );
}