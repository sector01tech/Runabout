import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Users, Home } from 'lucide-react';
import { LoginArea } from '@/components/auth/LoginArea';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useCurrentUser } from '@/hooks/useCurrentUser';


export function Navigation() {
  const location = useLocation();
  const { user } = useCurrentUser();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-6">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl">
              <Car className="h-6 w-6" />
              Runabout
            </Link>

            {user && (
              <div className="flex items-center gap-2">
                <Button
                  variant={isActive('/') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/" className="flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Home
                  </Link>
                </Button>

                <Button
                  variant={isActive('/driver') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/driver" className="flex items-center gap-2">
                    <Car className="h-4 w-4" />
                    Driver
                  </Link>
                </Button>

                <Button
                  variant={isActive('/rider') ? 'default' : 'ghost'}
                  size="sm"
                  asChild
                >
                  <Link to="/rider" className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Rider
                  </Link>
                </Button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <LoginArea className="max-w-60" />
          </div>
        </div>
      </div>
    </nav>
  );
}