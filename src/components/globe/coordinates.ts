
// Coordenadas dos países (coordenadas específicas para capitais/pontos centrais)
export const countryCoordinates: Record<string, [number, number]> = {
  "Japan": [139.6917, 35.6895], // Tokyo
  "Italy": [12.4964, 41.9028], // Rome
  "Peru": [-72.5450, -13.1631], // Near Machu Picchu
  "France": [2.3522, 48.8566], // Paris
  "Spain": [-3.7038, 40.4168], // Madrid
  "United Kingdom": [-0.1278, 51.5074], // London
  "Germany": [13.4050, 52.5200], // Berlin
  "China": [116.4074, 39.9042], // Beijing
  "Brazil": [-47.9292, -15.7801], // Brasilia
  "Australia": [151.2093, -33.8688], // Sydney
  "United States": [-77.0369, 38.9072], // Washington DC
  "Canada": [-75.6972, 45.4215], // Ottawa
  "Portugal": [-9.1393, 38.7223], // Lisboa
};

// Converter coordenadas geográficas para posição 3D no globo
export const geoToPosition = (lon: number, lat: number, radius: number = 1): [number, number, number] => {
  // Converter para radianos
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);

  // Coordenadas cartesianas
  const x = -radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.cos(phi);
  const z = radius * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
};
