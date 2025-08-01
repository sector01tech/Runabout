import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useNIP17Messaging } from '@/hooks/useNIP17Messaging';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

export interface AcceptRideOfferParams {
  offer: RideOffer;
  seatsRequested: number;
  message?: string;
  contactInfo?: string;
}

export interface AcceptRideRequestParams {
  request: RideRequest;
  message?: string;
  contactInfo?: string;
}

export function useRideAcceptance() {
  const { mutate: createEvent } = useNostrPublish();
  const { sendMessage } = useNIP17Messaging();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();

  // Accept a ride offer (rider accepting driver's offer)
  const acceptRideOffer = useMutation({
    mutationFn: async ({ offer, seatsRequested, message, contactInfo }: AcceptRideOfferParams) => {
      if (!user) {
        throw new Error('User must be logged in to accept rides');
      }

      if (offer.pubkey === user.pubkey) {
        throw new Error('You cannot accept your own ride offer');
      }

      if (seatsRequested > offer.seatsAvailable) {
        throw new Error('Not enough seats available');
      }

      if (offer.status !== 'active') {
        throw new Error('This ride offer is no longer active');
      }

      // Create ride acceptance event
      const acceptanceTags = [
        ['e', offer.id], // Reference to the ride offer
        ['p', offer.pubkey], // Driver's pubkey
        ['k', '30433'], // Kind of the accepted event
        ['seats_requested', seatsRequested.toString()],
        ['t', 'rideshare'],
        ['t', 'acceptance'],
        ['alt', `Ride acceptance for ${offer.title}`],
      ];

      if (contactInfo) {
        acceptanceTags.push(['contact', contactInfo]);
      }

      // Publish acceptance event
      createEvent({
        kind: 9639, // Custom kind for ride offer acceptance
        content: message || `I would like to accept your ride offer: ${offer.title}`,
        tags: acceptanceTags,
      });

      // Send direct message to driver
      const dmContent = [
        `🚗 Ride Request Accepted!`,
        ``,
        `Ride: ${offer.title}`,
        `Route: ${offer.pickupLocation} → ${offer.destinationLocation}`,
        `Departure: ${new Date(offer.departureTime).toLocaleString()}`,
        `Seats requested: ${seatsRequested}`,
        `Price: ${(offer.price / 1000).toFixed(0)} sats per seat`,
        ``,
        message ? `Message: ${message}` : '',
        contactInfo ? `Contact: ${contactInfo}` : '',
        ``,
        `Please confirm this booking and share pickup details.`,
      ].filter(Boolean).join('\n');

      await sendMessage.mutateAsync({
        recipientPubkey: offer.pubkey,
        content: dmContent,
        subject: `Ride Booking - ${offer.title}`,
      });

      return { success: true, offerId: offer.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-offers'] });
    },
  });

  // Accept a ride request (driver accepting rider's request)
  const acceptRideRequest = useMutation({
    mutationFn: async ({ request, message, contactInfo }: AcceptRideRequestParams) => {
      if (!user) {
        throw new Error('User must be logged in to accept ride requests');
      }

      if (request.pubkey === user.pubkey) {
        throw new Error('You cannot accept your own ride request');
      }

      // Create ride acceptance event
      const acceptanceTags = [
        ['e', request.id], // Reference to the ride request
        ['p', request.pubkey], // Rider's pubkey
        ['k', '3961'], // Kind of the accepted event
        ['t', 'rideshare'],
        ['t', 'acceptance'],
        ['alt', `Ride request acceptance`],
      ];

      if (contactInfo) {
        acceptanceTags.push(['contact', contactInfo]);
      }

      // Publish acceptance event
      createEvent({
        kind: 3561, // Custom kind for ride request acceptance
        content: message || `I can provide the ride you requested.`,
        tags: acceptanceTags,
      });

      // Send direct message to rider
      const dmContent = [
        `🚗 Ride Offer Available!`,
        ``,
        `Route: ${request.pickupLocation} → ${request.destinationLocation}`,
        `Departure: ${new Date(request.departureTime).toLocaleString()}`,
        `Seats needed: ${request.seatsNeeded}`,
        `Your max price: ${(request.maxPrice / 1000).toFixed(0)} sats per seat`,
        ``,
        message ? `Message: ${message}` : '',
        contactInfo ? `Contact: ${contactInfo}` : '',
        ``,
        `I can provide this ride. Please confirm if you're still interested.`,
      ].filter(Boolean).join('\n');

      await sendMessage.mutateAsync({
        recipientPubkey: request.pubkey,
        content: dmContent,
        subject: `Ride Available - ${request.pickupLocation} to ${request.destinationLocation}`,
      });

      return { success: true, requestId: request.id };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ride-requests'] });
    },
  });

  return {
    acceptRideOffer,
    acceptRideRequest,
    isAcceptingOffer: acceptRideOffer.isPending,
    isAcceptingRequest: acceptRideRequest.isPending,
  };
}