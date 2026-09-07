/**
 * FICTIONAL DEMO DATA — Nadipur Municipal Corporation (NMC)
 * No real city, ward, sensor, or citizen is represented here.
 * All coordinates, assets and readings are synthetic and exist only to drive
 * the SIH26085 prototype scenario.
 */

export type RiskLevel = "low" | "moderate" | "high" | "severe";

export interface Zone {
  id: string;
  code: string;
  name: string;
  ward: string;
  lat: number;
  lng: number;
  /** rectangular footprint half-size in degrees */
  size: [number, number];
  population: number;
  areaKm2: number;
  /** how much of rain becomes runoff (imperviousness) */
  runoff: number;
  /** designed drainage capacity mm/hr */
  drainCapacity: number;
  /** terrain lowness factor — higher means water pools */
  lowLying: number;
  /** storm-cell arrival offset in ticks (cell tracks NW -> SE) */
  rainOffset: number;
  /** local rainfall intensity multiplier */
  rainMult: number;
  landuse: string;
  historicalFloods: number;
}

export interface Drain {
  id: string;
  name: string;
  zoneId: string;
  lat: number;
  lng: number;
  diameterMm: number;
  designFlow: number;
  lastDesilted: string;
  siltIndex: number; // 0..1, higher = more silted
  telemetry: boolean;
}

export interface Sensor {
  id: string;
  name: string;
  zoneId: string;
  type: "rain_gauge" | "water_level" | "drain_flow" | "cctv";
  lat: number;
  lng: number;
  installed: string;
  health: "online" | "degraded" | "offline";
  unit: string;
}

export interface Infrastructure {
  id: string;
  name: string;
  zoneId: string;
  type: "hospital" | "school" | "substation" | "metro" | "shelter" | "water_works" | "fire";
  lat: number;
  lng: number;
  criticality: "high" | "medium";
}

export interface RoadSegment {
  id: string;
  name: string;
  zoneId: string;
  path: [number, number][];
  class: "arterial" | "underpass" | "collector";
  vulnerability: number; // 0..1
}

export interface ResourceUnit {
  id: string;
  name: string;
  type: "pump" | "desilting" | "rescue" | "traffic" | "medical" | "barricade";
  homeZoneId: string;
  capacity: string;
  crew: number;
  etaMinutesTo: Record<string, number>;
}

const C_LAT = 17.402;
const C_LNG = 78.468;

export const CITY = {
  name: "Nadipur",
  authority: "Nadipur Municipal Corporation",
  state: "Deccan State (fictional)",
  center: [C_LAT, C_LNG] as [number, number],
  river: "Kalvi River",
  population: 1_284_000,
};

export const ZONES: Zone[] = [
  {
    id: "Z-A",
    code: "A",
    name: "Ashokgarh",
    ward: "Ward 12",
    lat: C_LAT + 0.018,
    lng: C_LNG - 0.032,
    size: [0.013, 0.017],
    population: 128400,
    areaKm2: 6.4,
    runoff: 0.86,
    drainCapacity: 42,
    lowLying: 0.95,
    rainOffset: -6,
    rainMult: 1.35,
    landuse: "Dense residential + old market",
    historicalFloods: 9,
  },
  {
    id: "Z-B",
    code: "B",
    name: "Belapur Industrial Estate",
    ward: "Ward 4",
    lat: C_LAT + 0.02,
    lng: C_LNG + 0.004,
    size: [0.012, 0.018],
    population: 41200,
    areaKm2: 8.1,
    runoff: 0.79,
    drainCapacity: 55,
    lowLying: 0.42,
    rainOffset: -3,
    rainMult: 1.12,
    landuse: "Industrial",
    historicalFloods: 3,
  },
  {
    id: "Z-C",
    code: "C",
    name: "Chandanpet",
    ward: "Ward 7",
    lat: C_LAT + 0.021,
    lng: C_LNG + 0.04,
    size: [0.012, 0.016],
    population: 96700,
    areaKm2: 5.2,
    runoff: 0.72,
    drainCapacity: 48,
    lowLying: 0.55,
    rainOffset: 1,
    rainMult: 1.05,
    landuse: "Mixed residential",
    historicalFloods: 4,
  },
  {
    id: "Z-D",
    code: "D",
    name: "Dhanwada East",
    ward: "Ward 9",
    lat: C_LAT,
    lng: C_LNG - 0.033,
    size: [0.012, 0.016],
    population: 74300,
    areaKm2: 4.7,
    runoff: 0.68,
    drainCapacity: 51,
    lowLying: 0.61,
    rainOffset: -4,
    rainMult: 1.18,
    landuse: "Residential + schools",
    historicalFloods: 5,
  },
  {
    id: "Z-E",
    code: "E",
    name: "Eshwar Nagar",
    ward: "Ward 2",
    lat: C_LAT + 0.001,
    lng: C_LNG + 0.003,
    size: [0.012, 0.016],
    population: 152900,
    areaKm2: 5.9,
    runoff: 0.88,
    drainCapacity: 46,
    lowLying: 0.5,
    rainOffset: -1,
    rainMult: 1.0,
    landuse: "CBD / commercial",
    historicalFloods: 6,
  },
  {
    id: "Z-F",
    code: "F",
    name: "Fatehbagh",
    ward: "Ward 15",
    lat: C_LAT - 0.001,
    lng: C_LNG + 0.039,
    size: [0.012, 0.016],
    population: 88100,
    areaKm2: 6.0,
    runoff: 0.63,
    drainCapacity: 53,
    lowLying: 0.33,
    rainOffset: 3,
    rainMult: 0.92,
    landuse: "Residential",
    historicalFloods: 2,
  },
  {
    id: "Z-G",
    code: "G",
    name: "Gokulnagar",
    ward: "Ward 18",
    lat: C_LAT - 0.02,
    lng: C_LNG - 0.031,
    size: [0.012, 0.016],
    population: 63500,
    areaKm2: 4.2,
    runoff: 0.7,
    drainCapacity: 49,
    lowLying: 0.72,
    rainOffset: -2,
    rainMult: 1.08,
    landuse: "Residential + lake fringe",
    historicalFloods: 7,
  },
  {
    id: "Z-H",
    code: "H",
    name: "Hariyali Colony",
    ward: "Ward 21",
    lat: C_LAT - 0.019,
    lng: C_LNG + 0.002,
    size: [0.012, 0.016],
    population: 57400,
    areaKm2: 5.5,
    runoff: 0.52,
    drainCapacity: 58,
    lowLying: 0.28,
    rainOffset: 2,
    rainMult: 0.88,
    landuse: "Low density + parks",
    historicalFloods: 1,
  },
  {
    id: "Z-I",
    code: "I",
    name: "Indranagar",
    ward: "Ward 6",
    lat: C_LAT - 0.021,
    lng: C_LNG + 0.038,
    size: [0.012, 0.016],
    population: 110200,
    areaKm2: 5.1,
    runoff: 0.81,
    drainCapacity: 44,
    lowLying: 0.64,
    rainOffset: 5,
    rainMult: 0.95,
    landuse: "Dense residential",
    historicalFloods: 5,
  },
  {
    id: "Z-J",
    code: "J",
    name: "Jalvihar (Kalvi Bank)",
    ward: "Ward 11",
    lat: C_LAT - 0.039,
    lng: C_LNG - 0.016,
    size: [0.012, 0.02],
    population: 45600,
    areaKm2: 7.3,
    runoff: 0.58,
    drainCapacity: 38,
    lowLying: 0.9,
    rainOffset: 4,
    rainMult: 0.9,
    landuse: "Riverbank settlements",
    historicalFloods: 8,
  },
  {
    id: "Z-K",
    code: "K",
    name: "Kesarpalli",
    ward: "Ward 24",
    lat: C_LAT - 0.04,
    lng: C_LNG + 0.024,
    size: [0.012, 0.018],
    population: 39800,
    areaKm2: 6.8,
    runoff: 0.44,
    drainCapacity: 60,
    lowLying: 0.22,
    rainOffset: 7,
    rainMult: 0.8,
    landuse: "Peri-urban",
    historicalFloods: 1,
  },
  {
    id: "Z-L",
    code: "L",
    name: "Lakshmipuram",
    ward: "Ward 16",
    lat: C_LAT + 0.04,
    lng: C_LNG + 0.02,
    size: [0.012, 0.018],
    population: 71900,
    areaKm2: 5.6,
    runoff: 0.66,
    drainCapacity: 50,
    lowLying: 0.4,
    rainOffset: -5,
    rainMult: 1.15,
    landuse: "Residential + IT park",
    historicalFloods: 3,
  },
];

export const ZONE_BY_ID = Object.fromEntries(ZONES.map((z) => [z.id, z]));

function jitter(base: number, i: number, spread: number) {
  const s = Math.sin(i * 12.9898) * 43758.5453;
  return base + (s - Math.floor(s) - 0.5) * spread;
}

const drainSpec: [string, string, number, number][] = [
  // id, zoneId, siltIndex, diameterMm
  ["D01", "Z-A", 0.42, 900],
  ["D02", "Z-A", 0.31, 750],
  ["D03", "Z-B", 0.18, 1200],
  ["D04", "Z-B", 0.25, 1050],
  ["D05", "Z-C", 0.36, 900],
  ["D06", "Z-C", 0.12, 750],
  ["D07", "Z-D", 0.48, 900],
  ["D08", "Z-D", 0.22, 1050],
  ["D09", "Z-E", 0.55, 1200],
  ["D10", "Z-E", 0.29, 900],
  ["D11", "Z-F", 0.15, 750],
  ["D12", "Z-G", 0.61, 900],
  ["D13", "Z-G", 0.33, 750],
  ["D14", "Z-H", 0.09, 1050],
  ["D15", "Z-I", 0.52, 900],
  ["D16", "Z-I", 0.27, 750],
  ["D17", "Z-A", 0.88, 1200], // ★ the scenario drain
  ["D18", "Z-J", 0.66, 1500],
  ["D19", "Z-K", 0.11, 900],
  ["D20", "Z-L", 0.24, 1050],
  ["D21", "Z-L", 0.37, 750],
  ["D22", "Z-J", 0.44, 1200],
];

export const DRAINS: Drain[] = drainSpec.map(([id, zoneId, silt, dia], i) => {
  const z = ZONE_BY_ID[zoneId]!;
  return {
    id,
    name:
      id === "D17"
        ? "D17 — Ashokgarh Trunk Culvert"
        : `${id} — ${z.name} ${dia >= 1200 ? "Trunk" : "Lateral"} Drain`,
    zoneId,
    lat: jitter(z.lat, i + 3, z.size[0] * 1.3),
    lng: jitter(z.lng, i + 11, z.size[1] * 1.3),
    diameterMm: dia,
    designFlow: Math.round(dia / 18),
    lastDesilted: id === "D17" ? "2024-01-19" : ["2025-05-12", "2025-06-02", "2025-04-28", "2025-07-01"][i % 4]!,
    siltIndex: silt,
    telemetry: id === "D17" || i % 3 === 0,
  };
});

const sensorSpec: [string, Sensor["type"], string, Sensor["health"]][] = [
  ["S01", "rain_gauge", "Z-A", "online"],
  ["S02", "water_level", "Z-A", "online"],
  ["S03", "drain_flow", "Z-A", "online"],
  ["S04", "cctv", "Z-A", "online"],
  ["S05", "rain_gauge", "Z-B", "online"],
  ["S06", "water_level", "Z-C", "online"],
  ["S07", "rain_gauge", "Z-D", "degraded"],
  ["S08", "water_level", "Z-D", "online"],
  ["S09", "rain_gauge", "Z-E", "online"],
  ["S10", "drain_flow", "Z-E", "online"],
  ["S11", "water_level", "Z-G", "online"],
  ["S12", "rain_gauge", "Z-H", "offline"],
  ["S13", "water_level", "Z-I", "online"],
  ["S14", "rain_gauge", "Z-J", "online"],
  ["S15", "water_level", "Z-J", "online"],
  ["S16", "drain_flow", "Z-K", "degraded"],
  ["S17", "rain_gauge", "Z-L", "online"],
  ["S18", "cctv", "Z-E", "online"],
];

const UNITS: Record<Sensor["type"], string> = {
  rain_gauge: "mm/hr",
  water_level: "cm",
  drain_flow: "% capacity",
  cctv: "index",
};

export const SENSORS: Sensor[] = sensorSpec.map(([id, type, zoneId, health], i) => {
  const z = ZONE_BY_ID[zoneId]!;
  return {
    id,
    name: `${id} ${type.replace("_", " ")} · ${z.name}`,
    zoneId,
    type,
    lat: jitter(z.lat, i + 21, z.size[0]),
    lng: jitter(z.lng, i + 31, z.size[1]),
    installed: `20${22 + (i % 4)}-0${1 + (i % 8)}-1${i % 9}`,
    health,
    unit: UNITS[type],
  };
});

export const INFRASTRUCTURE: Infrastructure[] = [
  { id: "IN01", name: "Ashokgarh Govt. Hospital", zoneId: "Z-A", type: "hospital", lat: C_LAT + 0.023, lng: C_LNG - 0.038, criticality: "high" },
  { id: "IN02", name: "Ashokgarh Girls High School", zoneId: "Z-A", type: "school", lat: C_LAT + 0.013, lng: C_LNG - 0.028, criticality: "high" },
  { id: "IN03", name: "Ashokgarh 33kV Substation", zoneId: "Z-A", type: "substation", lat: C_LAT + 0.02, lng: C_LNG - 0.022, criticality: "high" },
  { id: "IN04", name: "Ashokgarh Community Shelter", zoneId: "Z-A", type: "shelter", lat: C_LAT + 0.026, lng: C_LNG - 0.026, criticality: "medium" },
  { id: "IN05", name: "Nadipur Central Metro Depot", zoneId: "Z-E", type: "metro", lat: C_LAT + 0.004, lng: C_LNG + 0.008, criticality: "high" },
  { id: "IN06", name: "NMC Water Works", zoneId: "Z-B", type: "water_works", lat: C_LAT + 0.024, lng: C_LNG + 0.008, criticality: "high" },
  { id: "IN07", name: "Dhanwada Primary School", zoneId: "Z-D", type: "school", lat: C_LAT + 0.004, lng: C_LNG - 0.03, criticality: "medium" },
  { id: "IN08", name: "Gokulnagar Fire Station", zoneId: "Z-G", type: "fire", lat: C_LAT - 0.017, lng: C_LNG - 0.034, criticality: "high" },
  { id: "IN09", name: "Indranagar Maternity Centre", zoneId: "Z-I", type: "hospital", lat: C_LAT - 0.018, lng: C_LNG + 0.036, criticality: "high" },
  { id: "IN10", name: "Jalvihar Relief Shelter", zoneId: "Z-J", type: "shelter", lat: C_LAT - 0.036, lng: C_LNG - 0.019, criticality: "medium" },
  { id: "IN11", name: "Lakshmipuram IT Park Grid", zoneId: "Z-L", type: "substation", lat: C_LAT + 0.043, lng: C_LNG + 0.022, criticality: "medium" },
  { id: "IN12", name: "Chandanpet Municipal School", zoneId: "Z-C", type: "school", lat: C_LAT + 0.024, lng: C_LNG + 0.043, criticality: "medium" },
];

export const ROADS: RoadSegment[] = [
  {
    id: "R01",
    name: "Ashokgarh Railway Underpass",
    zoneId: "Z-A",
    class: "underpass",
    vulnerability: 1,
    path: [
      [C_LAT + 0.014, C_LNG - 0.036],
      [C_LAT + 0.016, C_LNG - 0.029],
    ],
  },
  {
    id: "R02",
    name: "MG Road – Ashokgarh Link",
    zoneId: "Z-A",
    class: "arterial",
    vulnerability: 0.8,
    path: [
      [C_LAT + 0.026, C_LNG - 0.044],
      [C_LAT + 0.019, C_LNG - 0.03],
      [C_LAT + 0.01, C_LNG - 0.018],
    ],
  },
  {
    id: "R03",
    name: "Ashokgarh Market Street",
    zoneId: "Z-A",
    class: "collector",
    vulnerability: 0.7,
    path: [
      [C_LAT + 0.022, C_LNG - 0.028],
      [C_LAT + 0.012, C_LNG - 0.026],
    ],
  },
  {
    id: "R04",
    name: "Kalvi Ring Road (West)",
    zoneId: "Z-D",
    class: "arterial",
    vulnerability: 0.5,
    path: [
      [C_LAT + 0.008, C_LNG - 0.04],
      [C_LAT - 0.01, C_LNG - 0.038],
      [C_LAT - 0.028, C_LNG - 0.028],
    ],
  },
  {
    id: "R05",
    name: "Central Business Corridor",
    zoneId: "Z-E",
    class: "arterial",
    vulnerability: 0.6,
    path: [
      [C_LAT + 0.006, C_LNG - 0.012],
      [C_LAT + 0.002, C_LNG + 0.012],
      [C_LAT - 0.004, C_LNG + 0.03],
    ],
  },
  {
    id: "R06",
    name: "Gokulnagar Lake Road",
    zoneId: "Z-G",
    class: "collector",
    vulnerability: 0.75,
    path: [
      [C_LAT - 0.024, C_LNG - 0.038],
      [C_LAT - 0.016, C_LNG - 0.024],
    ],
  },
  {
    id: "R07",
    name: "Jalvihar Causeway",
    zoneId: "Z-J",
    class: "underpass",
    vulnerability: 0.9,
    path: [
      [C_LAT - 0.042, C_LNG - 0.024],
      [C_LAT - 0.034, C_LNG - 0.008],
    ],
  },
  {
    id: "R08",
    name: "Indranagar Main Road",
    zoneId: "Z-I",
    class: "collector",
    vulnerability: 0.55,
    path: [
      [C_LAT - 0.026, C_LNG + 0.03],
      [C_LAT - 0.014, C_LNG + 0.044],
    ],
  },
  {
    id: "R09",
    name: "Belapur Freight Road",
    zoneId: "Z-B",
    class: "arterial",
    vulnerability: 0.35,
    path: [
      [C_LAT + 0.028, C_LNG - 0.008],
      [C_LAT + 0.014, C_LNG + 0.014],
    ],
  },
  {
    id: "R10",
    name: "Lakshmipuram IT Approach",
    zoneId: "Z-L",
    class: "collector",
    vulnerability: 0.4,
    path: [
      [C_LAT + 0.046, C_LNG + 0.01],
      [C_LAT + 0.036, C_LNG + 0.03],
    ],
  },
];

export const RESOURCES: ResourceUnit[] = [
  { id: "U01", name: "Desilting Unit Alpha (Jetting + Suction)", type: "desilting", homeZoneId: "Z-B", capacity: "1 trunk culvert / 90 min", crew: 6, etaMinutesTo: { "Z-A": 22, "Z-E": 18, "Z-J": 34 } },
  { id: "U02", name: "Desilting Unit Bravo", type: "desilting", homeZoneId: "Z-I", capacity: "1 lateral / 60 min", crew: 5, etaMinutesTo: { "Z-A": 41, "Z-I": 8, "Z-G": 26 } },
  { id: "U03", name: "High-Capacity Pump Set P1 (150 HP)", type: "pump", homeZoneId: "Z-E", capacity: "1,800 m³/hr", crew: 4, etaMinutesTo: { "Z-A": 19, "Z-E": 6, "Z-G": 24 } },
  { id: "U04", name: "Pump Set P2 (100 HP)", type: "pump", homeZoneId: "Z-B", capacity: "1,100 m³/hr", crew: 3, etaMinutesTo: { "Z-A": 25, "Z-C": 17, "Z-L": 21 } },
  { id: "U05", name: "Pump Set P3 (60 HP)", type: "pump", homeZoneId: "Z-J", capacity: "700 m³/hr", crew: 3, etaMinutesTo: { "Z-A": 38, "Z-J": 5, "Z-K": 20 } },
  { id: "U06", name: "Water Rescue Team R1", type: "rescue", homeZoneId: "Z-G", capacity: "2 boats, 12 pax", crew: 9, etaMinutesTo: { "Z-A": 27, "Z-G": 7, "Z-J": 19 } },
  { id: "U07", name: "Water Rescue Team R2", type: "rescue", homeZoneId: "Z-C", capacity: "1 boat, 8 pax", crew: 7, etaMinutesTo: { "Z-A": 33, "Z-C": 9, "Z-F": 15 } },
  { id: "U08", name: "Traffic Marshal Squad T1", type: "traffic", homeZoneId: "Z-E", capacity: "6 diversion points", crew: 12, etaMinutesTo: { "Z-A": 16, "Z-E": 4, "Z-D": 13 } },
  { id: "U09", name: "Barricade Van B1", type: "barricade", homeZoneId: "Z-D", capacity: "40 barricades", crew: 4, etaMinutesTo: { "Z-A": 12, "Z-D": 5, "Z-G": 18 } },
  { id: "U10", name: "Mobile Medical Unit M1", type: "medical", homeZoneId: "Z-A", capacity: "1 ambulance + 2 paramedics", crew: 5, etaMinutesTo: { "Z-A": 6, "Z-D": 15, "Z-B": 20 } },
  { id: "U11", name: "Mobile Medical Unit M2", type: "medical", homeZoneId: "Z-I", capacity: "1 ambulance", crew: 4, etaMinutesTo: { "Z-A": 36, "Z-I": 6, "Z-K": 17 } },
  { id: "U12", name: "Traffic Marshal Squad T2", type: "traffic", homeZoneId: "Z-L", capacity: "4 diversion points", crew: 8, etaMinutesTo: { "Z-A": 29, "Z-L": 5, "Z-C": 14 } },
];

export const ROLES = [
  { id: "commissioner", label: "Municipal Commissioner", scope: "City-wide decisions, resource release, public alerts" },
  { id: "drainage", label: "Drainage Engineer", scope: "Drain telemetry, blockage diagnosis, desilting crews" },
  { id: "control", label: "Control Room Operator", scope: "Sensor health, citizen report triage, alert dispatch" },
  { id: "ward", label: "Ward Officer — Ashokgarh", scope: "On-ground verification, barricading, shelter activation" },
  { id: "traffic", label: "Traffic Police Liaison", scope: "Road closures, diversions, underpass control" },
] as const;

export type RoleId = (typeof ROLES)[number]["id"];
