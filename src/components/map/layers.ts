export interface LayerState {
  zones: boolean;
  rainfall: boolean;
  drains: boolean;
  sensors: boolean;
  reports: boolean;
  infrastructure: boolean;
  roads: boolean;
  resources: boolean;
}

export const DEFAULT_LAYERS: LayerState = {
  zones: true,
  rainfall: true,
  drains: true,
  sensors: false,
  reports: true,
  infrastructure: true,
  roads: true,
  resources: true,
};

export const LAYER_META: { key: keyof LayerState; label: string; hint: string; pillar: string }[] = [
  { key: "zones", label: "Zone risk", hint: "Adaptive risk level per zone", pillar: "Adaptation" },
  { key: "rainfall", label: "Rainfall intensity", hint: "Observed mm/hr field", pillar: "Observation" },
  { key: "drains", label: "Drains", hint: "22 storm-water assets & flow", pillar: "Observation" },
  { key: "sensors", label: "Sensors", hint: "18 field sensors & health", pillar: "Observation" },
  { key: "reports", label: "Citizen reports", hint: "Geo-tagged public reports", pillar: "Observation" },
  { key: "infrastructure", label: "Critical assets", hint: "Hospitals, schools, grid", pillar: "Decision" },
  { key: "roads", label: "Roads & underpasses", hint: "Passability status", pillar: "Decision" },
  { key: "resources", label: "Deployed units", hint: "Crews, pumps, barricades", pillar: "Resource Allocation" },
];
