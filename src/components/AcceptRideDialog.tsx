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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRideAcceptance } from '@/hooks/useRideAcceptance';
import { useToast } from '@/hooks/useToast';
import { LightningAddressDisplay } from '@/components/LightningAddressDisplay';
import { CheckCircle, Loader2, Users } from 'lucide-react';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

interface AcceptRideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ride: RideOffer | RideRequest;
}

export function AcceptRideDialog({ open, onOpenChange, ride }: AcceptRideDialogProps) {
  const [message, setMessage] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [seatsRequested, setSeatsRequested] = useState(1);

  const { acceptRideOffer, acceptRideRequest, isAcceptingOffer, isAcceptingRequest } = useRideAcceptance();
  const { toast } = useToast();

  const isOffer = 'status' in ride;
  const isLoading = isAcceptingOffer || isAcceptingRequest;

  const rideTitle = isOffer
    ? (ride as RideOffer).title
    : `${ride.pickupLocation} → ${ride.destinationLocation}`;

  const maxSeats = isOffer ? (ride as RideOffer).seatsAvailable : (ride as RideRequest).seatsNeeded;
  const price = isOffer ? (ride as RideOffer).price : (ride as RideRequest).maxPrice;

  const handleAccept = async () => {
    try {
      if (isOffer) {
        await acceptRideOffer.mutateAsync({
          offer: ride as RideOffer,
          seatsRequested,
          message: message.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
        });

        toast({
          title: 'Ride Request Sent',
          description: 'Your booking request has been sent to the driver.',
        });
      } else {
        await acceptRideRequest.mutateAsync({
          request: ride as RideRequest,
          message: message.trim() || undefined,
          contactInfo: contactInfo.trim() || undefined,
        });

        toast({
          title: 'Ride Offer Sent',
          description: 'Your ride offer has been sent to the rider.',
        });
      }

      onOpenChange(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Failed to Send',
        description: error instanceof Error ? error.message : 'Failed to send request',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setMessage('');
    setContactInfo('');
    setSeatsRequested(1);
  };

  const handleClose = () => {
    if (!isLoading) {
      onOpenChange(false);
      resetForm();
    }
  };

  const totalPrice = price * seatsRequested;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            {isOffer ? 'Book This Ride' : 'Offer This Ride'}
          </DialogTitle>
          <DialogDescription>
            {isOffer
              ? `Send a booking request for "${rideTitle}"`
              : `Offer to provide the requested ride`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Ride Details Summary */}
          <div className="bg-muted/50 p-3 rounded-lg text-sm space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Route:</span>
              <span>{ride.pickupLocation} → {ride.destinationLocation}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Departure:</span>
              <span>{new Date(ride.departureTime).toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">
                {isOffer ? 'Price per seat:' : 'Max price per seat:'}
              </span>
              <span>{(price / 1000).toFixed(0)} sats</span>
            </div>
          </div>

          {/* Seats Selection (only for ride offers) */}
          {isOffer && (
            <div className="space-y-2">
              <Label htmlFor="seats" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Number of seats
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="seats"
                  type="number"
                  min={1}
                  max={maxSeats}
                  value={seatsRequested}
                  onChange={(e) => setSeatsRequested(Math.max(1, Math.min(maxSeats, parseInt(e.target.value) || 1)))}
                  disabled={isLoading}
                  className="w-20"
                />
                <span className="text-sm text-muted-foreground">
                  of {maxSeats} available
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Total cost: {(totalPrice / 1000).toFixed(0)} sats
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            <Label htmlFor="contact">Contact information (optional)</Label>
            <Input
              id="contact"
              placeholder="Phone number, email, or other contact method"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              This will be shared privately to coordinate the ride
            </p>
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label htmlFor="message">Message (optional)</Label>
            <Textarea
              id="message"
              placeholder={isOffer
                ? "Any special requests or additional information..."
                : "Details about your vehicle, pickup instructions, etc..."
              }
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isLoading}
              rows={3}
            />
          </div>

          {/* Lightning Payment Info for Offers */}
          {isOffer && (
            <LightningAddressDisplay
              _recipientPubkey={ride.pubkey}
              amount={totalPrice}
              description={`Payment for ride: ${rideTitle}`}
            />
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg text-sm">
            <p className="font-medium mb-1 text-blue-900 dark:text-blue-100">
              {isOffer ? 'Booking Process:' : 'Offer Process:'}
            </p>
            <ul className="space-y-1 text-blue-800 dark:text-blue-200">
              <li>• A private message will be sent via Nostr</li>
              <li>• {isOffer ? 'The driver' : 'The rider'} will receive your details</li>
              <li>• Coordinate pickup details and payment privately</li>
              <li>• Use Lightning payments for secure transactions</li>
              {isOffer && <li>• Payment details are shown above for convenience</li>}
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
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={isLoading}
            className="w-full sm:w-auto"
          >
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {isOffer ? 'Send Booking Request' : 'Send Ride Offer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}