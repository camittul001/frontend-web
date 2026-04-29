// Google Maps environment + helpers for the web app.
// Three keys are scoped per platform — this is the *web* key, restricted
// to amplifyapp.com + custom domain via HTTP referrer rules in Cloud Console.

import type { AddressComponents } from "@/types";

export const GOOGLE_MAPS_KEY =
  process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY_WEB ?? "";

// Single country code (ISO 3166-1 alpha-2) for autocomplete bias. Defaults
// to India per A2N's current deployment scope; override at build time if
// expanding beyond IN.
export const GOOGLE_PLACES_COUNTRY =
  (process.env.NEXT_PUBLIC_GOOGLE_PLACES_COUNTRY ?? "in").toLowerCase();

// Map our backend AddressComponents shape to the keys that Google's Places
// AddressComponent uses. We pick the first matching long_name per type.
//
// Google `types` we care about:
//   - locality                → city / locality
//   - sublocality / sublocality_level_1 → sublocality
//   - administrative_area_level_1 → state
//   - postal_code             → postalCode
//   - country                 → country
export function extractAddressComponents(
  components: google.maps.GeocoderAddressComponent[] | undefined,
): AddressComponents | null {
  if (!components || components.length === 0) return null;
  const out: AddressComponents = {};
  for (const c of components) {
    const types = c.types ?? [];
    if (types.includes("locality")) {
      out.city = c.long_name;
      out.locality = c.long_name;
    } else if (
      !out.sublocality &&
      (types.includes("sublocality") || types.includes("sublocality_level_1"))
    ) {
      out.sublocality = c.long_name;
    } else if (types.includes("postal_code")) {
      out.postalCode = c.long_name;
    } else if (types.includes("administrative_area_level_1")) {
      out.state = c.long_name;
    } else if (types.includes("country")) {
      out.country = c.long_name;
    }
  }
  return Object.keys(out).length ? out : null;
}

export interface ResolvedPlace {
  lat: number;
  lng: number;
  placeId: string | null;
  formattedAddress: string | null;
  addressComponents: AddressComponents | null;
}
