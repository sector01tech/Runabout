import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RideRequestForm } from '@/components/RideRequestForm';
import { RideCard } from '@/components/RideCard';
import { WalletConnect } from '@/components/WalletConnect';
import { Map } from '@/components/Map';
import { useActiveRideOffers } from '@/hooks/useRideOffers';
import { useRideRequests } from '@/hooks/useRideRequests';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Users, Plus, MapIcon, List, Navigation } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';

export function RiderMode() {
  const { user } = useCurrentUser();
  const { data: rideOffers, isLoading: offersLoading } = useActiveRideOffers();
  const { data: rideRequests, isLoading: requestsLoading } = useRideRequests();
  const { latitude, longitude } = useGeolocation();

  const [_showCreateForm, setShowCreateForm] = useState(false);
  const [_selectedRide, setSelectedRide] = useState<string | null>(null);

  const availableOffers = rideOffers?.filter(offer =>
    offer.pubkey !== user?.pubkey
  ) || [];
  const myRequests = rideRequests?.filter(request => request.pubkey === user?.pubkey) || [];

  const handleViewOnMap = (rideId: string) => {
    setSelectedRide(rideId);
  };

  const handleContact = (pubkey: string) => {
    // TODO: Implement contact functionality (DM or external contact)
    console.log('Contact driver:', pubkey);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Rider Mode</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to access rider features and request rides
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Rider Mode</h1>
        </div>
        <p className="text-muted-foreground">
          Find rides and connect with drivers in your area
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="offers" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="offers" className="flex items-center gap-2">
                <Navigation className="h-4 w-4" />
                Available Rides
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                My Requests
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Map View
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Request Ride
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Available Rides</h2>
                <p className="text-sm text-muted-foreground">
                  {availableOffers.length} rides available
                </p>
              </div>

              {offersLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : availableOffers.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <p className="text-muted-foreground">
                        No available rides found. Try another relay?
                      </p>
                      <RelaySelector className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {availableOffers.map((offer) => (
                    <RideCard
                      key={offer.id}
                      ride={offer}
                      type="offer"
                      onViewOnMap={() => handleViewOnMap(offer.id)}
                      onContact={() => handleContact(offer.pubkey)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Ride Requests</h2>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Request
                </Button>
              </div>

              {requestsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <div className="flex items-center space-x-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="space-y-1">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-4/5" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : myRequests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-2">No ride requests yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Create your first ride request to start finding drivers
                        </p>
                      </div>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ride Request
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {myRequests.map((request) => (
                    <RideCard
                      key={request.id}
                      ride={request}
                      type="request"
                      onViewOnMap={() => handleViewOnMap(request.id)}
                      onContact={() => handleContact(request.pubkey)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="map" className="space-y-4">
              <h2 className="text-xl font-semibold">Map View</h2>
              <Map
                height="600px"
                rideOffers={rideOffers}
                rideRequests={rideRequests}
                userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
              />
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <RideRequestForm onSuccess={() => setShowCreateForm(false)} />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <WalletConnect />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Rider Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Safety First</p>
                <p className="text-muted-foreground">
                  Share your trip details with someone you trust
                </p>
              </div>
              <div>
                <p className="font-medium">Be Punctual</p>
                <p className="text-muted-foreground">
                  Arrive at pickup locations on time to respect drivers
                </p>
              </div>
              <div>
                <p className="font-medium">Communication</p>
                <p className="text-muted-foreground">
                  Contact drivers if you're running late or need to cancel
                </p>
              </div>
              <div>
                <p className="font-medium">Lightning Payments</p>
                <p className="text-muted-foreground">
                  Connect your wallet for instant Bitcoin payments
                </p>
              </div>
            </CardContent>
          </Card>

          {latitude && longitude && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Location</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  <p>Lat: {latitude.toFixed(4)}</p>
                  <p>Lng: {longitude.toFixed(4)}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}