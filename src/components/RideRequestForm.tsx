import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useNostrPublish } from '@/hooks/useNostrPublish';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Map } from '@/components/Map';
import { MapPin, Calendar, Users, DollarSign, Search } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const rideRequestSchema = z.object({
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  destinationLocation: z.string().min(1, 'Destination is required'),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  departureTime: z.string().min(1, 'Departure time is required'),
  seatsNeeded: z.number().min(1, 'At least 1 seat required').max(8, 'Maximum 8 seats'),
  maxPrice: z.number().min(0, 'Price must be positive'),
  description: z.string().max(500, 'Description too long'),
});

type RideRequestFormData = z.infer<typeof rideRequestSchema>;

interface RideRequestFormProps {
  onSuccess?: () => void;
}

export function RideRequestForm({ onSuccess }: RideRequestFormProps) {
  const { user } = useCurrentUser();
  const { mutate: createEvent, isPending } = useNostrPublish();
  const { latitude, longitude } = useGeolocation();
  const { toast } = useToast();

  const [pickupCoords, setPickupCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [mapMode, setMapMode] = useState<'pickup' | 'destination' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,

    formState: { errors },
  } = useForm<RideRequestFormData>({
    resolver: zodResolver(rideRequestSchema),
    defaultValues: {
      seatsNeeded: 1,
      maxPrice: 0,
    },
  });

  const onSubmit = (data: RideRequestFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a ride request",
        variant: "destructive",
      });
      return;
    }

    createEvent({
      kind: 3961,
      content: data.description,
      tags: [
        ['pickup_location', data.pickupLocation],
        ['pickup_lat', data.pickupLat.toString()],
        ['pickup_lng', data.pickupLng.toString()],
        ['destination_location', data.destinationLocation],
        ['destination_lat', data.destinationLat.toString()],
        ['destination_lng', data.destinationLng.toString()],
        ['departure_time', data.departureTime],
        ['seats_needed', data.seatsNeeded.toString()],
        ['max_price', (data.maxPrice * 1000).toString()], // Convert to satoshis
        ['t', 'rideshare'],
        ['t', 'transport'],
        ['alt', `Ride request from ${data.pickupLocation} to ${data.destinationLocation}`],
      ],
    }, {
      onSuccess: () => {
        toast({
          title: "Ride request created!",
          description: "Your ride request has been published to the network",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Failed to create ride request",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    if (mapMode === 'pickup') {
      setPickupCoords({ lat, lng });
      setValue('pickupLat', lat);
      setValue('pickupLng', lng);
    } else if (mapMode === 'destination') {
      setDestinationCoords({ lat, lng });
      setValue('destinationLat', lat);
      setValue('destinationLng', lng);
    }
    setMapMode(null);
  };

  const handleUseCurrentLocation = (type: 'pickup' | 'destination') => {
    if (latitude && longitude) {
      if (type === 'pickup') {
        setPickupCoords({ lat: latitude, lng: longitude });
        setValue('pickupLat', latitude);
        setValue('pickupLng', longitude);
      } else {
        setDestinationCoords({ lat: latitude, lng: longitude });
        setValue('destinationLat', latitude);
        setValue('destinationLng', longitude);
      }
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Please log in to create a ride request</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5" />
          Request a Ride
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="pickupLocation" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Pickup Location
              </Label>
              <Input
                id="pickupLocation"
                placeholder="Enter pickup location"
                {...register('pickupLocation')}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapMode('pickup')}
                >
                  Select on Map
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseCurrentLocation('pickup')}
                  disabled={!latitude || !longitude}
                >
                  Use Current
                </Button>
              </div>
              {pickupCoords && (
                <p className="text-xs text-muted-foreground mt-1">
                  {pickupCoords.lat.toFixed(4)}, {pickupCoords.lng.toFixed(4)}
                </p>
              )}
              {errors.pickupLocation && (
                <p className="text-sm text-destructive mt-1">{errors.pickupLocation.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="destinationLocation" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Destination
              </Label>
              <Input
                id="destinationLocation"
                placeholder="Enter destination"
                {...register('destinationLocation')}
              />
              <div className="flex gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setMapMode('destination')}
                >
                  Select on Map
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleUseCurrentLocation('destination')}
                  disabled={!latitude || !longitude}
                >
                  Use Current
                </Button>
              </div>
              {destinationCoords && (
                <p className="text-xs text-muted-foreground mt-1">
                  {destinationCoords.lat.toFixed(4)}, {destinationCoords.lng.toFixed(4)}
                </p>
              )}
              {errors.destinationLocation && (
                <p className="text-sm text-destructive mt-1">{errors.destinationLocation.message}</p>
              )}
            </div>
          </div>

          {mapMode && (
            <div>
              <Label>Click on the map to select {mapMode} location</Label>
              <Map
                height="300px"
                center={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
                onLocationSelect={handleLocationSelect}
              />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="departureTime" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Preferred Departure
              </Label>
              <Input
                id="departureTime"
                type="datetime-local"
                {...register('departureTime')}
              />
              {errors.departureTime && (
                <p className="text-sm text-destructive mt-1">{errors.departureTime.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="seatsNeeded" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Seats Needed
              </Label>
              <Input
                id="seatsNeeded"
                type="number"
                min="1"
                max="8"
                {...register('seatsNeeded', { valueAsNumber: true })}
              />
              {errors.seatsNeeded && (
                <p className="text-sm text-destructive mt-1">{errors.seatsNeeded.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="maxPrice" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Max Price per Seat (sats)
              </Label>
              <Input
                id="maxPrice"
                type="number"
                min="0"
                placeholder="0"
                {...register('maxPrice', { valueAsNumber: true })}
              />
              {errors.maxPrice && (
                <p className="text-sm text-destructive mt-1">{errors.maxPrice.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Any special requirements or preferences..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Creating Request...' : 'Create Ride Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}