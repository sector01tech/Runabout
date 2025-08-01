import { useEffect, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useTheme } from '@/hooks/useTheme';
import type { RideOffer } from '@/hooks/useRideOffers';
import type { RideRequest } from '@/hooks/useRideRequests';

// Fix for default markers in react-leaflet
// @ts-expect-error - Leaflet internal property fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for different marker types
const createIcon = (color: string) => new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
      <circle cx="12.5" cy="12.5" r="6" fill="white"/>
    </svg>
  `)}`,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const driverIcon = createIcon('#10b981'); // Green for drivers
const riderIcon = createIcon('#3b82f6'); // Blue for riders
const userIcon = createIcon('#ef4444'); // Red for current user

interface MapProps {
  rideOffers?: RideOffer[];
  rideRequests?: RideRequest[];
  userLocation?: { lat: number; lng: number };
  center?: { lat: number; lng: number };
  zoom?: number;
  height?: string;
  onLocationSelect?: (lat: number, lng: number) => void;
}

function MapUpdater({ center }: { center?: { lat: number; lng: number } }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView([center.lat, center.lng], map.getZoom());
    }
  }, [center, map]);

  return null;
}

export function Map({
  rideOffers = [],
  rideRequests = [],
  userLocation,
  center,
  zoom = 13,
  height = '400px',
  onLocationSelect
}: MapProps) {
  const mapRef = useRef<L.Map>(null);
  const { theme } = useTheme();

  const defaultCenter = center || userLocation || { lat: 40.7128, lng: -74.0060 }; // NYC default

  // Use dark tiles for dark mode
  const isDark = theme === 'dark' || (theme === 'system' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  const tileUrl = isDark
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = isDark
    ? '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
    : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const handleMapClick = useCallback((e: L.LeafletMouseEvent) => {
    if (onLocationSelect) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    }
  }, [onLocationSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (map && onLocationSelect) {
      map.on('click', handleMapClick);
      return () => {
        map.off('click', handleMapClick);
      };
    }
  }, [onLocationSelect, handleMapClick]);

  return (
    <div style={{ height }} className="w-full rounded-lg overflow-hidden border border-border">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          attribution={attribution}
          url={tileUrl}
        />

        <MapUpdater center={center} />

        {/* User location marker */}
        {userLocation && (
          <Marker
            position={[userLocation.lat, userLocation.lng]}
            icon={userIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>Your Location</strong>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Ride offer markers */}
        {rideOffers.map((offer) => (
          <Marker
            key={`offer-pickup-${offer.id}`}
            position={[offer.pickupLat, offer.pickupLng]}
            icon={driverIcon}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <strong className="text-green-600">Ride Offer</strong>
                <div><strong>From:</strong> {offer.pickupLocation}</div>
                <div><strong>To:</strong> {offer.destinationLocation}</div>
                <div><strong>Departure:</strong> {new Date(offer.departureTime).toLocaleString()}</div>
                <div><strong>Seats:</strong> {offer.seatsAvailable}</div>
                <div><strong>Price:</strong> {(offer.price / 1000).toFixed(0)} sats</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Ride request markers */}
        {rideRequests.map((request) => (
          <Marker
            key={`request-pickup-${request.id}`}
            position={[request.pickupLat, request.pickupLng]}
            icon={riderIcon}
          >
            <Popup>
              <div className="text-sm space-y-1">
                <strong className="text-blue-600">Ride Request</strong>
                <div><strong>From:</strong> {request.pickupLocation}</div>
                <div><strong>To:</strong> {request.destinationLocation}</div>
                <div><strong>Departure:</strong> {new Date(request.departureTime).toLocaleString()}</div>
                <div><strong>Seats:</strong> {request.seatsNeeded}</div>
                <div><strong>Max Price:</strong> {(request.maxPrice / 1000).toFixed(0)} sats</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}