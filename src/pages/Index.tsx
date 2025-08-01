
import { useSeoMeta } from '@unhead/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginArea } from "@/components/auth/LoginArea";
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { Car, Users, Zap, MapPin, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';

const Index = () => {
  const { user } = useCurrentUser();


  useSeoMeta({
    title: 'Runabout - Decentralized Ride Sharing',
    description: 'Decentralized ride-sharing on Nostr with instant Lightning payments. Connect directly with drivers and riders without intermediaries.',
  });

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center space-y-6 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Car className="h-12 w-12 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                Runabout
              </h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Decentralized ride-sharing on Nostr with instant Lightning payments.
              Connect directly with drivers and riders without intermediaries.
            </p>

            {!user && (
              <div className="flex justify-center">
                <LoginArea className="max-w-60" />
              </div>
            )}
          </div>

          {/* Mode Selection for Logged In Users */}
          {user && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <Card className="hover:shadow-lg dark:hover:shadow-xl transition-all cursor-pointer border-2 hover:border-green-500 dark:hover:border-green-400 group">
                <Link to="/driver">
                  <CardHeader className="text-center">
                    <div className="p-4 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Car className="h-16 w-16 text-green-600 dark:text-green-400" />
                    </div>
                    <CardTitle className="text-2xl">Driver Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Offer rides and earn Bitcoin by helping others get around
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-600">
                      Start Driving
                    </Button>
                  </CardContent>
                </Link>
              </Card>

              <Card className="hover:shadow-lg dark:hover:shadow-xl transition-all cursor-pointer border-2 hover:border-blue-500 dark:hover:border-blue-400 group">
                <Link to="/rider">
                  <CardHeader className="text-center">
                    <div className="p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 w-fit mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Users className="h-16 w-16 text-blue-600 dark:text-blue-400" />
                    </div>
                    <CardTitle className="text-2xl">Rider Mode</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-muted-foreground mb-4">
                      Find rides and pay instantly with Lightning Bitcoin
                    </p>
                    <Button className="w-full">
                      Find a Ride
                    </Button>
                  </CardContent>
                </Link>
              </Card>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 w-fit mx-auto mb-2">
                  <Zap className="h-12 w-12 text-yellow-500 dark:text-yellow-400" />
                </div>
                <CardTitle>Lightning Fast Payments</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Instant Bitcoin payments with Lightning Network. No waiting for bank transfers.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/30 w-fit mx-auto mb-2">
                  <Shield className="h-12 w-12 text-green-500 dark:text-green-400" />
                </div>
                <CardTitle>Decentralized & Private</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  Built on Nostr protocol. No central authority, no data harvesting.
                </p>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md dark:hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30 w-fit mx-auto mb-2">
                  <MapPin className="h-12 w-12 text-red-500 dark:text-red-400" />
                </div>
                <CardTitle>Real-time Tracking</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-muted-foreground">
                  See driver locations on the map and track your ride in real-time.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* How It Works */}
          <Card className="mb-12">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">How It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Car className="h-5 w-5 text-green-600" />
                    For Drivers
                  </h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                      Connect your Nostr identity and Lightning wallet
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                      Create ride offers with pickup/destination locations
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-green-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                      Connect with riders and receive instant payments
                    </li>
                  </ol>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    For Riders
                  </h3>
                  <ol className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">1</span>
                      Connect your Nostr identity and Lightning wallet
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">2</span>
                      Browse available rides or create ride requests
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">3</span>
                      Contact drivers and pay instantly with Lightning
                    </li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center text-sm text-muted-foreground">
            <p className="mb-2">
              Runabout is built on open protocols and powered by Bitcoin Lightning Network
            </p>
            <p>
              Vibed with{' '}
              <a
                href="https://soapbox.pub/mkstack"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                MKStack
              </a>
            </p>
          </div>
        </div>
      </div>
  );
};

export default Index;
