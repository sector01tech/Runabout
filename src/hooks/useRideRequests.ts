import { useNostr } from '@nostrify/react';
import { useQuery } from '@tanstack/react-query';
import type { NostrEvent } from '@nostrify/nostrify';

export interface RideRequest {
  id: string;
  pubkey: string;
  pickupLocation: string;
  pickupLat: number;
  pickupLng: number;
  destinationLocation: string;
  destinationLat: number;
  destinationLng: number;
  departureTime: string;
  seatsNeeded: number;
  maxPrice: number; // satoshis
  content: string;
  createdAt: number;
}

function validateRideRequest(event: NostrEvent): boolean {
  if (event.kind !== 3961) return false;

  const requiredTags = ['pickup_location', 'pickup_lat', 'pickup_lng', 
                       'destination_location', 'destination_lat', 'destination_lng', 
                       'departure_time', 'seats_needed', 'max_price'];
  
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
  const seats = parseInt(event.tags.find(([name]) => name === 'seats_needed')?.[1] || '');
  const price = parseInt(event.tags.find(([name]) => name === 'max_price')?.[1] || '');
  if (isNaN(seats) || isNaN(price) || seats < 1 || price < 0) return false;

  return true;
}

function eventToRideRequest(event: NostrEvent): RideRequest {
  const getTag = (name: string) => event.tags.find(([tagName]) => tagName === name)?.[1] || '';

  return {
    id: event.id,
    pubkey: event.pubkey,
    pickupLocation: getTag('pickup_location'),
    pickupLat: parseFloat(getTag('pickup_lat')),
    pickupLng: parseFloat(getTag('pickup_lng')),
    destinationLocation: getTag('destination_location'),
    destinationLat: parseFloat(getTag('destination_lat')),
    destinationLng: parseFloat(getTag('destination_lng')),
    departureTime: getTag('departure_time'),
    seatsNeeded: parseInt(getTag('seats_needed')),
    maxPrice: parseInt(getTag('max_price')),
    content: event.content,
    createdAt: event.created_at,
  };
}

export function useRideRequests() {
  const { nostr } = useNostr();

  return useQuery({
    queryKey: ['ride-requests'],
    queryFn: async (c) => {
      const signal = AbortSignal.any([c.signal, AbortSignal.timeout(3000)]);
      const events = await nostr.query([{ 
        kinds: [3961], 
        limit: 100,
        '#t': ['rideshare']
      }], { signal });

      return events
        .filter(validateRideRequest)
        .map(eventToRideRequest)
        .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}