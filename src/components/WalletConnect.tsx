import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWalletConnect } from '@/hooks/useWalletConnect';
import { useWalletConfig } from '@/hooks/useWalletConfig';
import { WalletConfigDialog } from '@/components/WalletConfigDialog';
import { Wallet, Zap, AlertCircle, Settings, Copy } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

export function WalletConnect() {
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const { toast } = useToast();

  const {
    connected,
    connecting,
    error,
    balance,
    connect,
    disconnect,
    getBalance
  } = useWalletConnect();

  const { config } = useWalletConfig();

  useEffect(() => {
    if (connected) {
      getBalance();
    }
  }, [connected, getBalance]);

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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Lightning Wallet
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfigDialog(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <Badge variant={connected ? "default" : "secondary"}>
              {connected ? "Connected" : "Disconnected"}
            </Badge>
          </div>

          {/* Connection Method Display */}
          {config && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Method</span>
              <Badge variant="outline">
                {config.method === 'webln' ? 'WebLN' :
                 config.method === 'nwc' ? 'NWC' : 'Manual'}
              </Badge>
            </div>
          )}

          {/* Lightning Address Display */}
          {config?.lightningAddress && (
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lightning Address</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(config.lightningAddress!)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              <div className="bg-muted/50 p-2 rounded text-xs font-mono break-all">
                {config.lightningAddress}
              </div>
            </div>
          )}

          {/* NWC URL Display (masked for security) */}
          {config?.nwcUrl && (
            <div className="space-y-1">
              <span className="text-sm font-medium">NWC Connection</span>
              <div className="bg-muted/50 p-2 rounded text-xs font-mono">
                nostr+walletconnect://***...{config.nwcUrl.slice(-8)}
              </div>
            </div>
          )}

          {connected && balance !== null && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Balance</span>
              <span className="text-sm">
                {(balance / 1000).toLocaleString()} sats
                <span className="text-xs text-muted-foreground ml-1">
                  (~${((balance / 1000) * 0.0004).toFixed(2)})
                </span>
              </span>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-destructive/10 rounded-lg">
              <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
              <div>
                <p className="text-sm font-medium text-destructive">Connection Error</p>
                <p className="text-xs text-destructive/80">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {!connected ? (
              <div className="space-y-2">
                <Button
                  onClick={connect}
                  disabled={connecting}
                  className="w-full"
                >
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowConfigDialog(true)}
                  className="w-full"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configure Wallet
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={getBalance}
                  className="w-full"
                >
                  Refresh Balance
                </Button>
                <Button
                  variant="destructive"
                  onClick={disconnect}
                  className="w-full"
                >
                  Disconnect
                </Button>
              </div>
            )}
          </div>

          {!connected && !config && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Connect your Lightning wallet to:</p>
              <ul className="list-disc list-inside space-y-0.5 ml-2">
                <li>Pay for rides instantly</li>
                <li>Receive payments as a driver</li>
                <li>View your balance</li>
              </ul>
              <p className="mt-2">
                Supports WebLN, NWC, and manual configuration.
              </p>
            </div>
          )}

          {config && !connected && (
            <div className="text-xs text-muted-foreground">
              <p>
                Wallet configured with {config.method === 'webln' ? 'WebLN' :
                config.method === 'nwc' ? 'Nostr Wallet Connect' : 'manual settings'}.
                {config.method === 'webln' && ' Make sure your WebLN extension is enabled.'}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <WalletConfigDialog
        open={showConfigDialog}
        onOpenChange={setShowConfigDialog}
      />
    </>
  );
}