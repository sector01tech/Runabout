import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RideOfferForm } from '@/components/RideOfferForm';
import { RideCard } from '@/components/RideCard';
import { WalletConnect } from '@/components/WalletConnect';
import { Map } from '@/components/Map';
import { useRideOffers, useActiveRideOffers } from '@/hooks/useRideOffers';
import { useRideRequests } from '@/hooks/useRideRequests';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useGeolocation } from '@/hooks/useGeolocation';
import { Car, Plus, MapIcon, List, Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { RelaySelector } from '@/components/RelaySelector';

export function DriverMode() {
  const { user } = useCurrentUser();
  const { data: allRideOffers, isLoading: offersLoading } = useRideOffers();
  const { data: activeRideOffers } = useActiveRideOffers();
  const { data: rideRequests, isLoading: requestsLoading } = useRideRequests();
  const { latitude, longitude } = useGeolocation();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [_selectedRide, setSelectedRide] = useState<string | null>(null);

  const myOffers = allRideOffers?.filter(offer => offer.pubkey === user?.pubkey) || [];
  const myActiveOffers = myOffers.filter(offer => offer.status === 'active');
  const myCancelledOffers = myOffers.filter(offer => offer.status === 'cancelled');
  const otherRequests = rideRequests || [];

  const handleViewOnMap = (rideId: string) => {
    setSelectedRide(rideId);
  };

  const handleContact = (pubkey: string) => {
    // TODO: Implement contact functionality (DM or external contact)
    console.log('Contact user:', pubkey);
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <Car className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-2">Driver Mode</h2>
            <p className="text-muted-foreground mb-6">
              Please log in to access driver features and offer rides
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
          <Car className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Driver Mode</h1>
        </div>
        <p className="text-muted-foreground">
          Offer rides and connect with passengers in your area
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="offers" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="offers" className="flex items-center gap-2">
                <Car className="h-4 w-4" />
                My Offers
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Ride Requests
              </TabsTrigger>
              <TabsTrigger value="map" className="flex items-center gap-2">
                <MapIcon className="h-4 w-4" />
                Map View
              </TabsTrigger>
            </TabsList>

            <TabsContent value="offers" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Ride Offers</h2>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Offer
                </Button>
              </div>

              {showCreateForm && (
                <RideOfferForm onSuccess={() => setShowCreateForm(false)} />
              )}

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
              ) : myOffers.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <Car className="h-12 w-12 mx-auto text-muted-foreground" />
                      <div>
                        <h3 className="font-semibold mb-2">No ride offers yet</h3>
                        <p className="text-muted-foreground text-sm">
                          Create your first ride offer to start connecting with passengers
                        </p>
                      </div>
                      <Button onClick={() => setShowCreateForm(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Ride Offer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Active Offers */}
                  {myActiveOffers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-green-700 dark:text-green-400">
                        Active Offers ({myActiveOffers.length})
                      </h3>
                      {myActiveOffers.map((offer) => (
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

                  {/* Cancelled Offers */}
                  {myCancelledOffers.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-muted-foreground">
                        Cancelled Offers ({myCancelledOffers.length})
                      </h3>
                      {myCancelledOffers.map((offer) => (
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
                </div>
              )}
            </TabsContent>

            <TabsContent value="requests" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Ride Requests</h2>
                <p className="text-sm text-muted-foreground">
                  {otherRequests.length} requests found
                </p>
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
              ) : otherRequests.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="py-12 px-8 text-center">
                    <div className="max-w-sm mx-auto space-y-6">
                      <p className="text-muted-foreground">
                        No ride requests found. Try another relay?
                      </p>
                      <RelaySelector className="w-full" />
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {otherRequests.map((request) => (
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
                rideOffers={activeRideOffers}
                rideRequests={rideRequests}
                userLocation={latitude && longitude ? { lat: latitude, lng: longitude } : undefined}
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <WalletConnect />

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Driver Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="font-medium">Safety First</p>
                <p className="text-muted-foreground">
                  Always verify passenger identity before starting the trip
                </p>
              </div>
              <div>
                <p className="font-medium">Fair Pricing</p>
                <p className="text-muted-foreground">
                  Set reasonable prices based on distance and fuel costs
                </p>
              </div>
              <div>
                <p className="font-medium">Communication</p>
                <p className="text-muted-foreground">
                  Keep passengers informed about pickup times and any delays
                </p>
              </div>
              <div>
                <p className="font-medium">Lightning Payments</p>
                <p className="text-muted-foreground">
                  Connect your wallet to receive instant Bitcoin payments
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}