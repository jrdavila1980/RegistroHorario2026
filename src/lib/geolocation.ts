export interface GeoPosition {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function getCurrentPosition(): Promise<GeoPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocalización no disponible en este dispositivo"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      }),
      (err) => {
        if (err.code === 1) reject(new Error("Permiso de ubicación denegado. Actívalo en la configuración del navegador."));
        else if (err.code === 2) reject(new Error("No se pudo obtener la ubicación. Comprueba tu GPS."));
        else reject(new Error("Tiempo de espera agotado para obtener ubicación."));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const dphi = ((lat2 - lat1) * Math.PI) / 180;
  const dlambda = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlambda / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function isWithinGeofence(
  pos: GeoPosition,
  officeLat: number,
  officeLon: number,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(pos.latitude, pos.longitude, officeLat, officeLon);
  return distance <= radiusMeters;
}

export function isSuspiciousAccuracy(accuracy: number): boolean {
  return accuracy > 100; // More than 100m accuracy is suspicious
}
