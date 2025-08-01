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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useRideCancellation } from '@/hooks/useRideCancellation';
import { useToast } from '@/hooks/useToast';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

interface CancelRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideOffer | RideRequest;
  notifyUsers?: string[]; // pubkeys of users to notify
}

export function CancelRideDialog({ open, onOpenChange, ride, notifyUsers = [] }: CancelRideDialogProps) {
  const [reason, setReason] = useState('');
  const { cancelRide, isLoading } = useRideCancellation();
  const { toast } = useToast();

  const isOffer = 'status' in ride;
  const rideType = isOffer ? 'ride offer' : 'ride request';
  const rideTitle = isOffer ? (ride as RideOffer).title : `${ride.pickupLocation} → ${ride.destinationLocation}`;

  const handleCancel = async () => {
    try {
      await cancelRide.mutateAsync({
        ride,
        reason: reason.trim() || undefined,
        notifyUsers,
      });

      toast({
        title: 'Ride Cancelled',
        description: `Your ${rideType} has been cancelled successfully.`,
      });

      onOpenChange(false);
      setReason('');
    } catch (error) {
      toast({
        title: 'Cancellation Failed',
        description: error instanceof Error ? error.message : 'Failed to cancel ride',
        variant: 'destructive',
      });
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      setReason('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel {rideType}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to cancel "{rideTitle}"?
            {notifyUsers.length > 0 && (
              <span className="block mt-2 text-sm">
                {notifyUsers.length} user(s) will be notified about this cancellation.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation (optional)</Label>
            <Textarea
              id="reason"
              placeholder="Let others know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          <div className="bg-muted/50 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1">What happens when you cancel:</p>
            <ul className="space-y-1 text-muted-foreground">
              {isOffer ? (
                <>
                  <li>• Your ride offer will be marked as cancelled</li>
                  <li>• It will no longer appear in active listings</li>
                </>
              ) : (
                <>
                  <li>• Your ride request will be removed</li>
                  <li>• Drivers will no longer see your request</li>
                </>
              )}
              {notifyUsers.length > 0 && (
                <li>• Interested users will receive a notification</li>
              )}
            </ul>
          </div>
        </div>

        <DialogFooter className="flex-col-reverse sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            Keep {rideType}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Cancel {rideType}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}