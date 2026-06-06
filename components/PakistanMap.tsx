'use client';

import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Tooltip } from 'react-leaflet';
import { useApp } from '@/context/AppContext';

// Dot marker — avoids webpack icon-path issues entirely
function dot(color: string) {
  return L.divIcon({
    className: '',
    html: `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    tooltipAnchor: [7, 0],
  });
}

const CITY_COORDS: Record<string, [number, number]> = {
  'Karachi':           [24.8607, 67.0011],
  'Lahore':            [31.5204, 74.3587],
  'Islamabad':         [33.6844, 73.0479],
  'Rawalpindi':        [33.5651, 73.0169],
  'Faisalabad':        [31.4504, 73.1350],
  'Multan':            [30.1984, 71.4686],
  'Peshawar':          [34.0151, 71.5249],
  'Quetta':            [30.1798, 66.9750],
  'Hyderabad':         [25.3960, 68.3578],
  'Gujranwala':        [32.1877, 74.1945],
  'Sialkot':           [32.4945, 74.5229],
  'Sukkur':            [27.7052, 68.8574],
  'Larkana':           [27.5570, 68.2086],
  'Bahawalpur':        [29.3956, 71.6836],
  'Sargodha':          [32.0836, 72.6711],
  'Gwadar':            [25.1216, 62.3254],
  'Port Qasim':        [24.7833, 67.3500],
  'Hub':               [25.0237, 66.8961],
  'Dera Ghazi Khan':   [30.0463, 70.6459],
  'Abbottabad':        [34.1558, 73.2194],
  'Mardan':            [34.1985, 72.0470],
  'Nowshera':          [34.0153, 71.9747],
  'Attock':            [33.7667, 72.3667],
  'Chakwal':           [32.9328, 72.8539],
  'Jhang':             [31.2681, 72.3181],
  'Sheikhupura':       [31.7167, 73.9833],
  'Kohat':             [33.5890, 71.4425],
  'Dera Ismail Khan':  [31.8300, 70.9000],
  'Muzaffarabad':      [34.3700, 73.4710],
  'Wah Cantt':         [33.7764, 72.7086],
  'Sahiwal':           [30.6706, 73.1064],
  'Mirpur Khas':       [25.5270, 69.0130],
  'Nawabshah':         [26.2442, 68.4100],
  'Landi Kotal':       [34.0990, 71.1435],
  'Khuzdar':           [27.8120, 66.6110],
  'Turbat':            [26.0023, 63.0420],
  'Jacobabad':         [28.2819, 68.4514],
  'Shikarpur':         [27.9556, 68.6378],
  'Khairpur':          [27.5295, 68.7592],
  'Dadu':              [26.7319, 67.7753],
  'Mirpurkhas':        [25.5270, 69.0130],
  'Kasur':             [31.1177, 74.4529],
  'Okara':             [30.8138, 73.4534],
  'Chiniot':           [31.7197, 72.9783],
  'Kamoke':            [31.9743, 74.2241],
  'Hafizabad':         [32.0704, 73.6878],
  'Sadiqabad':         [28.3097, 70.1297],
  'Muzaffargarh':      [30.0781, 71.1934],
  'Khanewal':          [30.2992, 71.9322],
  'Pakpattan':         [30.3436, 73.3875],
  'Bahawalnagar':      [30.0000, 73.2500],
  'Mianwali':          [32.5854, 71.5438],
  'Bhakkar':           [31.6270, 71.0653],
  'Vehari':            [30.0398, 72.3503],
  'Lodhran':           [29.5346, 71.6330],
  'Rajanpur':          [29.1044, 70.3296],
  'Layyah':            [30.9573, 70.9395],
  'Toba Tek Singh':    [30.9713, 72.4823],
  'Khushab':           [32.2988, 72.3508],
  'Leiah':             [30.9573, 70.9395],
  'Bannu':             [32.9882, 70.6011],
  'Swabi':             [34.1200, 72.4700],
  'Charsadda':         [34.1480, 71.7307],
  'Mansehra':          [34.3302, 73.1967],
  'Haripur':           [33.9980, 72.9313],
  'Swat':              [35.2200, 72.4300],
  'Mingora':           [34.7717, 72.3600],
  'Gilgit':            [35.9220, 74.3081],
  'Skardu':            [35.2971, 75.6333],
  'Zhob':              [31.3420, 69.4486],
  'Loralai':           [30.3726, 68.5947],
  'Nushki':            [29.5523, 66.0222],
  'Chaman':            [30.9218, 66.4513],
  'Pishin':            [30.5793, 66.9966],
  'Mastung':           [29.7996, 66.8437],
  'Kalat':             [29.0222, 66.5887],
  'Panjgur':           [26.9688, 64.0990],
};

export default function PakistanMap() {
  const { cities, provinces } = useApp();

  const markers = cities
    .map(city => {
      const key = Object.keys(CITY_COORDS).find(k => k.toLowerCase() === city.name.toLowerCase());
      if (!key) return null;
      const province = provinces.find(p => p.id === city.province_id);
      return { city, province, coords: CITY_COORDS[key] };
    })
    .filter(Boolean) as { city: { id: string; name: string }; province: { name: string } | undefined; coords: [number, number] }[];

  const markerIcon = dot('#2563eb');

  return (
    <MapContainer
      center={[30.0, 69.5]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={false}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
        maxZoom={19}
      />
      {markers.map(({ city, province, coords }) => (
        <Marker key={city.id} position={coords} icon={markerIcon}>
          <Tooltip direction="top" offset={[0, -4]}>
            <strong>{city.name}</strong>
            {province && <div style={{ fontSize: 11, color: '#666' }}>{province.name}</div>}
          </Tooltip>
        </Marker>
      ))}
    </MapContainer>
  );
}
