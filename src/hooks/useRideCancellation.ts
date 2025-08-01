import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useNIP17Messaging } from '@/hooks/useNIP17Messaging';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

export interface CancelRideParams {
  ride: RideOffer | RideRequest;
  reason?: string;
  notifyUsers?: string[]; // pubkeys of users to notify
}

export function useRideCancellation() {
  const { mutate: createEvent } = useNostrPublish();
  const { sendMessage } = useNIP17Messaging();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  const cancelRide = useMutation({
    mutationFn: async ({ ride, reason, notifyUsers = [] }: CancelRideParams) => {
      if (!user) {
        throw new Error('User must be logged in to cancel rides');
      }

      // Check if user owns this ride
      if (ride.pubkey !== user.pubkey) {
        throw new Error('You can only cancel your own rides');
      }

      const isOffer = 'status' in ride;

      if (isOffer) {
        // For ride offers (kind 30433), update the status to 'cancelled'
        const offer = ride as RideOffer;
        
        // Create updated ride offer with cancelled status
        const updatedTags = offer.id ? [
          ['d', offer.id],
          ['title', offer.title],
          ['pickup_location', offer.pickupLocation],
          ['pickup_lat', offer.pickupLat.toString()],
          ['pickup_lng', offer.pickupLng.toString()],
          ['destination_location', offer.destinationLocation],
          ['destination_lat', offer.destinationLat.toString()],
          ['destination_lng', offer.destinationLng.toString()],
          ['departure_time', offer.departureTime],
          ['seats_available', offer.seatsAvailable.toString()],
          ['price', offer.price.toString()],
          ['status', 'cancelled'], // Update status to cancelled
          ['t', 'rideshare'],
          ['alt', `Cancelled ride offer: ${offer.title}`],
        ] : [];

        if (reason) {
          updatedTags.push(['cancellation_reason', reason]);
        }

        // Publish the updated ride offer
        createEvent({
          kind: 30433,
          content: reason ? `CANCELLED: ${reason}\n\n${offer.content}` : `CANCELLED\n\n${offer.content}`,
          tags: updatedTags,
        });
      } else {
        // For ride requests (kind 3961), publish a cancellation event
        const request = ride as RideRequest;
        
        const cancellationTags = [
          ['e', request.id], // Reference to the original request
          ['k', '3961'], // Kind of the cancelled event
          ['t', 'rideshare'],
          ['t', 'cancellation'],
          ['alt', 'Ride request cancellation'],
        ];

        if (reason) {
          cancellationTags.push(['reason', reason]);
        }

        // Publish cancellation event (kind 5 - deletion)
        createEvent({
          kind: 5,
          content: reason || 'Ride request cancelled',
          tags: cancellationTags,
        });
      }

      // Send notifications to interested users
      if (notifyUsers.length > 0) {
        const rideType = isOffer ? 'ride offer' : 'ride request';
        const rideDescription = isOffer 
          ? `${(ride as RideOffer).title} (${ride.pickupLocation} → ${ride.destinationLocation})`
          : `${ride.pickupLocation} → ${ride.destinationLocation}`;
        
        const notificationContent = reason
          ? `The ${rideType} "${rideDescription}" has been cancelled.\n\nReason: ${reason}`
          : `The ${rideType} "${rideDescription}" has been cancelled.`;

        // Send notification to each user
        for (const pubkey of notifyUsers) {
          try {
            await sendMessage.mutateAsync({
              recipientPubkey: pubkey,
              content: notificationContent,
              subject: `Ride Cancellation - ${rideType}`,
            });
          } catch (error) {
            console.warn(`Failed to notify user ${pubkey}:`, error);
          }
        }
      }

      return { success: true, rideId: ride.id };
    },
    onSuccess: () => {
      // Invalidate and refetch ride data
      queryClient.invalidateQueries({ queryKey: ['ride-offers'] });
      queryClient.invalidateQueries({ queryKey: ['ride-requests'] });
    },
  });

  return {
    cancelRide,
    isLoading: cancelRide.isPending,
  };
}