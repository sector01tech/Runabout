import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useWalletConfig, type WalletConfig } from '@/hooks/useWalletConfig';
import { useToast } from '@/hooks/useToast';
import { Wallet, Zap, Globe, Settings, Loader2, Copy, ExternalLink } from 'lucide-react';

interface WalletConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConfigDialog({ open, onOpenChange }: WalletConfigDialogProps) {
  const { config, saveConfig, isLoading, validateNWCUrl, validateLightningAddress } = useWalletConfig();
  const { toast } = useToast();

  const [formData, setFormData] = useState<WalletConfig>({
    nwcUrl: config?.nwcUrl || '',
    lightningAddress: config?.lightningAddress || '',
    method: config?.method || 'webln',
  });
  const [publishToNostr, setPublishToNostr] = useState(false);
  const [activeTab, setActiveTab] = useState('webln');

  const handleSave = async () => {
    const success = await saveConfig(formData, publishToNostr);
    if (success) {
      toast({
        title: 'Wallet Configuration Saved',
        description: 'Your wallet settings have been updated successfully.',
      });
      onOpenChange(false);
    } else {
      // Error is handled in the hook
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      // Reset form to current config
      setFormData({
        nwcUrl: config?.nwcUrl || '',
        lightningAddress: config?.lightningAddress || '',
        method: config?.method || 'webln',
      });
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied to clipboard',
        description: 'The text has been copied to your clipboard.',
      });
    } catch {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard.',
        variant: 'destructive',
      });
    }
  };

  const isNWCUrlValid = formData.nwcUrl ? validateNWCUrl(formData.nwcUrl) : true;
  const isLightningAddressValid = formData.lightningAddress ? validateLightningAddress(formData.lightningAddress) : true;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your Lightning wallet connection and payment settings.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="webln" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              WebLN
            </TabsTrigger>
            <TabsTrigger value="nwc" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              NWC
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Manual
            </TabsTrigger>
          </TabsList>

          <TabsContent value="webln" className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-blue-900 dark:text-blue-100">
                WebLN Browser Extension
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-200 mb-3">
                Connect using a WebLN-compatible browser extension like Alby, Zeus, or others.
              </p>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                <li>• Automatic wallet detection</li>
                <li>• Secure in-browser payments</li>
                <li>• No manual configuration required</li>
                <li>• Works with most Lightning wallets</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Recommended WebLN Wallets:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Alby</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://getalby.com', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Popular Lightning browser extension
                  </p>
                </div>
                <div className="border rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Zeus</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open('https://zeusln.app', '_blank')}
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Get
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Mobile and desktop Lightning wallet
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="nwc" className="space-y-4">
            <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-green-900 dark:text-green-100">
                Nostr Wallet Connect (NWC)
              </h3>
              <p className="text-sm text-green-800 dark:text-green-200">
                Connect your wallet using a Nostr Wallet Connect URL for remote wallet access.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="nwc-url">NWC Connection URL</Label>
                <Textarea
                  id="nwc-url"
                  placeholder="nostr+walletconnect://pubkey?relay=wss://relay.example.com&secret=..."
                  value={formData.nwcUrl}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, nwcUrl: e.target.value, method: 'nwc' }));
                  }}
                  disabled={isLoading}
                  rows={3}
                  className={!isNWCUrlValid ? 'border-destructive' : ''}
                />
                {!isNWCUrlValid && (
                  <p className="text-sm text-destructive mt-1">
                    Invalid NWC URL format. Must start with nostr+walletconnect://
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Get this URL from your wallet's NWC settings (Alby, Zeus, etc.)
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-950/20 p-3 rounded-lg">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                  How to get your NWC URL:
                </h4>
                <ol className="text-sm text-yellow-800 dark:text-yellow-200 space-y-1 list-decimal list-inside">
                  <li>Open your Lightning wallet (Alby, Zeus, etc.)</li>
                  <li>Go to Settings → Wallet Connect or NWC</li>
                  <li>Create a new connection with spending permissions</li>
                  <li>Copy the generated nostr+walletconnect:// URL</li>
                  <li>Paste it in the field above</li>
                </ol>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="bg-purple-50 dark:bg-purple-950/20 p-4 rounded-lg">
              <h3 className="font-medium mb-2 text-purple-900 dark:text-purple-100">
                Manual Configuration
              </h3>
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Set up your Lightning address for receiving payments manually.
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="lightning-address">Lightning Address</Label>
                <Input
                  id="lightning-address"
                  type="email"
                  placeholder="user@domain.com"
                  value={formData.lightningAddress}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, lightningAddress: e.target.value, method: 'manual' }));
                  }}
                  disabled={isLoading}
                  className={!isLightningAddressValid ? 'border-destructive' : ''}
                />
                {!isLightningAddressValid && (
                  <p className="text-sm text-destructive mt-1">
                    Invalid Lightning address format. Must be in format user@domain.com
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Your Lightning address for receiving payments (e.g., from Alby, Strike, etc.)
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="publish-to-nostr"
                  checked={publishToNostr}
                  onCheckedChange={setPublishToNostr}
                />
                <Label htmlFor="publish-to-nostr" className="text-sm">
                  Publish Lightning address to my Nostr profile
                </Label>
              </div>
              {publishToNostr && (
                <p className="text-xs text-muted-foreground">
                  This will update your Nostr profile (kind 0) with your Lightning address,
                  making it visible to other users for payments.
                </p>
              )}

              <div className="bg-gray-50 dark:bg-gray-950/20 p-3 rounded-lg">
                <h4 className="font-medium mb-2">Popular Lightning Address Providers:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span>Alby</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('user@getalby.com')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Strike</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('user@strike.me')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Wallet of Satoshi</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('user@walletofsatoshi.com')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Blink</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard('user@blink.sv')}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isLoading || !isNWCUrlValid || !isLightningAddressValid}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Configuration
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}