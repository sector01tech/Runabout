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
import { MapPin, Calendar, Users, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/useToast';

const rideOfferSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  pickupLocation: z.string().min(1, 'Pickup location is required'),
  pickupLat: z.number().min(-90).max(90),
  pickupLng: z.number().min(-180).max(180),
  destinationLocation: z.string().min(1, 'Destination is required'),
  destinationLat: z.number().min(-90).max(90),
  destinationLng: z.number().min(-180).max(180),
  departureTime: z.string().min(1, 'Departure time is required'),
  seatsAvailable: z.number().min(1, 'At least 1 seat required').max(8, 'Maximum 8 seats'),
  price: z.number().min(0, 'Price must be positive'),
  description: z.string().max(500, 'Description too long'),
});

type RideOfferFormData = z.infer<typeof rideOfferSchema>;

interface RideOfferFormProps {
  onSuccess?: () => void;
}

export function RideOfferForm({ onSuccess }: RideOfferFormProps) {
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
  } = useForm<RideOfferFormData>({
    resolver: zodResolver(rideOfferSchema),
    defaultValues: {
      seatsAvailable: 1,
      price: 0,
    },
  });

  const onSubmit = (data: RideOfferFormData) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create a ride offer",
        variant: "destructive",
      });
      return;
    }

    const rideId = `ride-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    createEvent({
      kind: 30433,
      content: data.description,
      tags: [
        ['d', rideId],
        ['title', data.title],
        ['pickup_location', data.pickupLocation],
        ['pickup_lat', data.pickupLat.toString()],
        ['pickup_lng', data.pickupLng.toString()],
        ['destination_location', data.destinationLocation],
        ['destination_lat', data.destinationLat.toString()],
        ['destination_lng', data.destinationLng.toString()],
        ['departure_time', data.departureTime],
        ['seats_available', data.seatsAvailable.toString()],
        ['price', (data.price * 1000).toString()], // Convert to satoshis
        ['status', 'active'],
        ['t', 'rideshare'],
        ['t', 'transport'],
        ['alt', `Ride offer: ${data.title}`],
      ],
    }, {
      onSuccess: () => {
        toast({
          title: "Ride offer created!",
          description: "Your ride offer has been published to the network",
        });
        onSuccess?.();
      },
      onError: (error) => {
        toast({
          title: "Failed to create ride offer",
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
          <p className="text-muted-foreground">Please log in to create a ride offer</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Offer a Ride
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="title">Ride Title</Label>
            <Input
              id="title"
              placeholder="e.g., Downtown to Airport"
              {...register('title')}
            />
            {errors.title && (
              <p className="text-sm text-destructive mt-1">{errors.title.message}</p>
            )}
          </div>

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
                Departure Time
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
              <Label htmlFor="seatsAvailable" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Available Seats
              </Label>
              <Input
                id="seatsAvailable"
                type="number"
                min="1"
                max="8"
                {...register('seatsAvailable', { valueAsNumber: true })}
              />
              {errors.seatsAvailable && (
                <p className="text-sm text-destructive mt-1">{errors.seatsAvailable.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="price" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price per Seat (sats)
              </Label>
              <Input
                id="price"
                type="number"
                min="0"
                placeholder="0"
                {...register('price', { valueAsNumber: true })}
              />
              {errors.price && (
                <p className="text-sm text-destructive mt-1">{errors.price.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Additional Details</Label>
            <Textarea
              id="description"
              placeholder="Any additional information about the ride..."
              {...register('description')}
            />
            {errors.description && (
              <p className="text-sm text-destructive mt-1">{errors.description.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? 'Creating Offer...' : 'Create Ride Offer'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}