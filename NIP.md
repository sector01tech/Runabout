# NIP-XX: Runabout Ride-Sharing Protocol

`draft` `optional`

This NIP defines event kinds for decentralized ride-sharing on Nostr with Lightning payments.

## Event Kinds

### Kind 30433: Ride Offer (Addressable)

A replaceable event that represents a driver offering a ride. The `d` tag serves as a unique identifier for the ride offer.

#### Tags

- `d` - unique identifier for the ride offer
- `title` - short description of the ride (e.g., "Downtown to Airport")
- `pickup_location` - pickup location name
- `pickup_lat` - pickup latitude (decimal degrees)
- `pickup_lng` - pickup longitude (decimal degrees)
- `destination_location` - destination location name
- `destination_lat` - destination latitude (decimal degrees)
- `destination_lng` - destination longitude (decimal degrees)
- `departure_time` - ISO 8601 timestamp for departure
- `seats_available` - number of available seats (string)
- `price` - price per seat in satoshis (string)
- `status` - ride status: "active", "full", "completed", "cancelled"
- `t` - category tags (e.g., "rideshare", "transport")
- `alt` - human-readable description for NIP-31 compatibility

#### Content

The content field contains a markdown description of the ride offer, including any additional details, requirements, or preferences.

#### Example

```json
{
  "kind": 30433,
  "content": "Comfortable ride from downtown to the airport. Non-smoking vehicle, luggage space available.",
  "tags": [
    ["d", "ride-20240716-001"],
    ["title", "Downtown to Airport"],
    ["pickup_location", "Downtown Plaza"],
    ["pickup_lat", "40.7128"],
    ["pickup_lng", "-74.0060"],
    ["destination_location", "JFK Airport"],
    ["destination_lat", "40.6413"],
    ["destination_lng", "-73.7781"],
    ["departure_time", "2024-07-16T14:30:00Z"],
    ["seats_available", "3"],
    ["price", "50000"],
    ["status", "active"],
    ["t", "rideshare"],
    ["t", "transport"],
    ["alt", "Ride offer from Downtown Plaza to JFK Airport"]
  ]
}
```

### Kind 3961: Ride Request

A regular event that represents a rider requesting a ride.

#### Tags

- `pickup_location` - pickup location name
- `pickup_lat` - pickup latitude (decimal degrees)
- `pickup_lng` - pickup longitude (decimal degrees)
- `destination_location` - destination location name
- `destination_lat` - destination latitude (decimal degrees)
- `destination_lng` - destination longitude (decimal degrees)
- `departure_time` - preferred ISO 8601 timestamp for departure
- `seats_needed` - number of seats needed (string)
- `max_price` - maximum price willing to pay per seat in satoshis (string)
- `t` - category tags (e.g., "rideshare", "transport")
- `alt` - human-readable description for NIP-31 compatibility

#### Content

The content field contains a description of the ride request, including any special requirements or preferences.

#### Example

```json
{
  "kind": 3961,
  "content": "Looking for a ride to the airport. Have one large suitcase. Flexible on departure time within 30 minutes.",
  "tags": [
    ["pickup_location", "Downtown Plaza"],
    ["pickup_lat", "40.7128"],
    ["pickup_lng", "-74.0060"],
    ["destination_location", "JFK Airport"],
    ["destination_lat", "40.6413"],
    ["destination_lng", "-73.7781"],
    ["departure_time", "2024-07-16T14:30:00Z"],
    ["seats_needed", "1"],
    ["max_price", "60000"],
    ["t", "rideshare"],
    ["t", "transport"],
    ["alt", "Ride request from Downtown Plaza to JFK Airport"]
  ]
}
```

## Payment Integration

This protocol integrates with NIP-47 (Nostr Wallet Connect) for Lightning payments. Drivers and riders can connect their Lightning wallets to facilitate seamless payments.

## Location Privacy

While this protocol includes precise coordinates for matching rides, clients should:

1. Allow users to set location privacy preferences
2. Optionally obfuscate exact pickup/dropoff locations until ride is confirmed
3. Provide options to use nearby landmarks instead of exact addresses

### Kind 9639: Ride Offer Acceptance

A regular event that represents a rider accepting a driver's ride offer.

#### Tags

- `e` - event ID of the accepted ride offer (kind 30433)
- `p` - pubkey of the driver
- `k` - kind of the accepted event (30433)
- `seats_requested` - number of seats being requested (string)
- `contact` - optional contact information for coordination
- `t` - category tags ("rideshare", "acceptance")
- `alt` - human-readable description for NIP-31 compatibility

#### Content

The content field contains a message from the rider to the driver about the booking request.

### Kind 3561: Ride Request Acceptance

A regular event that represents a driver accepting a rider's ride request.

#### Tags

- `e` - event ID of the accepted ride request (kind 3961)
- `p` - pubkey of the rider
- `k` - kind of the accepted event (3961)
- `contact` - optional contact information for coordination
- `t` - category tags ("rideshare", "acceptance")
- `alt` - human-readable description for NIP-31 compatibility

#### Content

The content field contains a message from the driver to the rider about the ride offer.

## Ride Cancellation

### Ride Offer Cancellation

Ride offers (kind 30433) are cancelled by publishing an updated event with `status` set to "cancelled". An optional `cancellation_reason` tag may be included.

### Ride Request Cancellation

Ride requests (kind 3961) are cancelled by publishing a deletion event (kind 5) that references the original request.

## Private Messaging Integration

This protocol integrates with NIP-17 (Private Direct Messages) for secure communication between riders and drivers. When rides are accepted or cancelled, participants receive encrypted notifications containing:

- Ride details and status updates
- Contact information (if provided)
- Coordination messages
- Cancellation notifications with reasons

## Implementation Notes

- Clients should validate coordinates are within reasonable ranges
- Times should be validated to be in the future for new offers/requests
- Price validation should ensure reasonable satoshi amounts
- Status updates for ride offers should be published as replaceable events
- Clients may implement additional matching algorithms based on proximity and time preferences
- Acceptance events should trigger NIP-17 direct messages for private coordination
- Cancellation events should notify all interested parties via encrypted messages