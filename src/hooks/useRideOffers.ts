import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface RideOffer {
  id: string;
  pubkey: string;
  title: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  destinationLocation: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  seatsAvailable: number;
  price: number; // satoshis
  status: 'active' | 'full' | 'completed' | 'cancelled';
  content: string;
  createdAt: number;
}

function validateRideOffer(event: NostrEvent): boolean {
  if (event.kind !== 30433) return false;

  const requiredTags = ['d', 'title', 'pickup_location', 'pickup_lat', 'pickup_lng',
                       'destination_location', 'destination_lat', 'destination_lng',
                       'departure_time', 'seats_available', 'price', 'status'];

  for (const tagName of requiredTags) {
    const tag = event.tags.find(([name]) => name === tagName);
    if (!tag || !tag[1]) return false;
  }

  // Validate coordinates
  const pickupLat = parseFloat(event.tags.find(([name]) => name === 'pickup_lat')?.[1] || '');
  const pickupLng = parseFloat(event.tags.find(([name]) => name === 'pickup_lng')?.[1] || '');
  const destLat = parseFloat(event.tags.find(([name]) => name === 'destination_lat')?.[1] || '');
  const destLng = parseFloat(event.tags.find(([name]) => name === 'destination_lng')?.[1] || '');

  if (isNaN(pickupLat) || isNaN(pickupLng) || isNaN(destLat) || isNaN(destLng)) return false;
  if (Math.abs(pickupLat) > 90 || Math.abs(destLat) > 90) return false;
  if (Math.abs(pickupLng) > 180 || Math.abs(destLng) > 180) return false;

  // Validate seats and price
  const seats = parseInt(event.tags.find(([name]) => name === 'seats_available')?.[1] || '');
  const price = parseInt(event.tags.find(([name]) => name === 'price')?.[1] || '');
  if (isNaN(seats) || isNaN(price) || seats < 1 || price < 0) return false;

  // Validate status
  const status = event.tags.find(([name]) => name === 'status')?.[1];
  if (!['active', 'full', 'completed', 'cancelled'].includes(status || '')) return false;

  return true;
}

function eventToRideOffer(event: NostrEvent): RideOffer {
  const getTag = (name: string) => event.tags.find(([tagName]) => tagName === name)?.[1] || '';

  return {
    id: getTag('d'),
    pubkey: event.pubkey,
    title: getTag('title'),
    pickupLocation: getTag('pickup_location'),
    pickupLat: parseFloat(getTag('pickup_lat')),
    pickupLng: parseFloat(getTag('pickup_lng')),
    destinationLocation: getTag('destination_location'),
    destinationLat: parseFloat(getTag('destination_lat')),
    destinationLng: parseFloat(getTag('destination_lng')),
    departureTime: getTag('departure_time'),
    seatsAvailable: parseInt(getTag('seats_available')),
    price: parseInt(getTag('price')),
    status: getTag('status') as RideOffer['status'],
    content: event.content,
    createdAt: event.created_at,
  };
}

export function useRideOffers() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['ride-offers'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{
        kinds: [30433],
        limit: 100,
        '#t': ['rideshare']
      }], { signal });

      return events
        .filter(validateRideOffer)
        .map(eventToRideOffer)
        .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

// Hook to get only active ride offers
export function useActiveRideOffers() {
  const { data: allOffers, ...rest } = useRideOffers();

  const activeOffers = allOffers?.filter(offer => offer.status === 'active') || [];

  return {
    data: activeOffers,
    ...rest,
  };
}