import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuthor } from '@/hooks/useAuthor';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { genUserName } from '@/lib/genUserName';
import { MapPin, Calendar, Users, DollarSign, MessageCircle, X, Check } from 'lucide-react';
import { CancelRideDialog } from '@/components/CancelRideDialog';
import { AcceptRideDialog } from '@/components/AcceptRideDialog';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

interface RideCardProps {
  ride: RideOffer | RideRequest;
  type: 'offer' | 'request';
  onContact?: () => void;
  onViewOnMap?: () => void;
}

export function RideCard({ ride, type, onContact, onViewOnMap }: RideCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showAcceptDialog, setShowAcceptDialog] = useState(false);

  const author = useAuthor(ride.pubkey);
  const { user } = useCurrentUser();
  const metadata = author.data?.metadata;

  const displayName = metadata?.name ?? genUserName(ride.pubkey);
  const profileImage = metadata?.picture;

  const isOffer = type === 'offer';
  const offer = isOffer ? (ride as RideOffer) : null;
  const request = !isOffer ? (ride as RideRequest) : null;

  const departureDate = new Date(ride.departureTime);
  const isUpcoming = departureDate > new Date();

  const price = isOffer ? offer!.price : request!.maxPrice;
  const seats = isOffer ? offer!.seatsAvailable : request!.seatsNeeded;

  // Check if current user owns this ride
  const isOwner = user?.pubkey === ride.pubkey;

  // Check if ride can be cancelled (only active offers or any requests)
  const canCancel = isOwner && (isOffer ? offer!.status === 'active' : true);

  // Check if ride can be accepted (not owned by user, upcoming, and active)
  const canAccept = !isOwner && isUpcoming && user && (isOffer ? offer!.status === 'active' : true);

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={profileImage} alt={displayName} />
              <AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{displayName}</p>
              <div className="flex items-center gap-2">
                <Badge variant={isOffer ? "default" : "secondary"}>
                  {isOffer ? "Driver" : "Rider"}
                </Badge>
                {!isUpcoming && (
                  <Badge variant="outline">Past</Badge>
                )}
              </div>
            </div>
          </div>
          {isOffer && offer && (
            <Badge
              variant={offer.status === 'active' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {offer.status}
            </Badge>
          )}
        </div>
        {isOffer && offer?.title && (
          <h3 className="font-semibold text-lg">{offer.title}</h3>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-green-600" />
            <div>
              <p className="text-sm font-medium">From</p>
              <p className="text-sm text-muted-foreground">
                {isOffer ? offer!.pickupLocation : request!.pickupLocation}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 mt-0.5 text-red-600" />
            <div>
              <p className="text-sm font-medium">To</p>
              <p className="text-sm text-muted-foreground">
                {isOffer ? offer!.destinationLocation : request!.destinationLocation}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <div>
              <p className="font-medium">Departure</p>
              <p className="text-muted-foreground">
                {departureDate.toLocaleDateString()}
              </p>
              <p className="text-muted-foreground">
                {departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <div>
              <p className="font-medium">
                {isOffer ? 'Available Seats' : 'Seats Needed'}
              </p>
              <p className="text-muted-foreground">{seats}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4" />
          <div>
            <p className="font-medium">
              {isOffer ? 'Price per Seat' : 'Max Price per Seat'}
            </p>
            <p className="text-muted-foreground">
              {(price / 1000).toFixed(0)} sats
              {price > 0 && (
                <span className="text-xs ml-1">
                  (~${((price / 1000) * 0.0004).toFixed(2)})
                </span>
              )}
            </p>
          </div>
        </div>

        {ride.content && (
          <div>
            <p className="text-sm font-medium mb-1">Details</p>
            <p className="text-sm text-muted-foreground">{ride.content}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewOnMap}
            className="flex-1"
          >
            <MapPin className="h-4 w-4 mr-1" />
            View on Map
          </Button>

          {canAccept && (
            <Button
              size="sm"
              onClick={() => setShowAcceptDialog(true)}
              className="flex-1"
            >
              <Check className="h-4 w-4 mr-1" />
              {isOffer ? 'Book Ride' : 'Offer Ride'}
            </Button>
          )}

          {!canAccept && !isOwner && (
            <Button
              size="sm"
              onClick={onContact}
              className="flex-1"
            >
              <MessageCircle className="h-4 w-4 mr-1" />
              Contact
            </Button>
          )}

          {canCancel && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
        </div>

        {/* Dialogs */}
        <CancelRideDialog
          open={showCancelDialog}
          onOpenChange={setShowCancelDialog}
          ride={ride}
          notifyUsers={[]} // TODO: Add logic to determine interested users
        />

        <AcceptRideDialog
          open={showAcceptDialog}
          onOpenChange={setShowAcceptDialog}
          ride={ride}
        />
      </CardContent>
    </Card>
  );
}