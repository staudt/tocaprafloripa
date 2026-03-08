// ============================================================================
// Location definitions — Porto Alegre → Florianópolis
// ============================================================================
//
// Each location is a generation template. The road builder uses these
// parameters to procedurally create road segments, so each playthrough
// is different while keeping the "feel" of each location.
//
// Tweak any value here to change the character of a location:
//   length       — segment count (~15-20 segs/sec at cruising speed, so 1000 ≈ 50-65 sec)
//   lanes        — number of lane markings
//   twoWay       — oncoming traffic on left side (future)
//   roadWidth    — wider = easier, narrower = tighter
//   curves       — frequency/intensity of horizontal curves
//   hills        — frequency/intensity of elevation changes
//   traffic      — density and speed of other vehicles
//   sprites      — roadside objects (type, frequency, colors)
//   events       — scripted moments at progress % (dialogue, gas stations, etc.)

export const LOCATIONS = [
  {
    id: 'porto_alegre',
    name: 'Porto Alegre',
    palette: {
      sky: '#8899aa', skyHorizon: '#aabbcc',
      light: { road: '#555555', grass: '#888888', rumble: '#cccccc', lane: '#ffffff' },
      dark:  { road: '#444444', grass: '#777777', rumble: '#555555', lane: '' },
    },
    length: 2000,
    lanes: 3,
    twoWay: false,
    roadWidth: 2000,
    curves: {
      frequency: 0.4,
      minLen: 8, maxLen: 24,
      minIntensity: 1, maxIntensity: 3,
    },
    hills: {
      frequency: 0.15,
      minLen: 6, maxLen: 16,
      minHeight: 100, maxHeight: 400,
    },
    traffic: { density: 36, speedRange: [0.3, 0.6] },
    sprites: {
      types: ['building'],
      frequency: 8,
      colors: ['#889099', '#7a7068', '#a09080', '#8090a0', '#706860', '#9a8878'],
    },
    events: [
      { at: 0.0,  type: 'dialogue', speaker: 'driver', text: 'Bora fam\u00edlia! Floripa nos espera!' },
      { at: 0.15, type: 'dialogue', speaker: 'wife', text: 'Tu pegou a estrada certa?' },
      { at: 0.4,  type: 'dialogue', speaker: 'wife', text: 'Cuidado com o tr\u00e2nsito da cidade...' },
      { at: 0.65, type: 'dialogue', speaker: 'kid', text: 'Pai, falta muito?!' },
      { at: 0.85, type: 'dialogue', speaker: 'driver', text: 'Calma, ainda nem sa\u00edmos de POA!' },
    ],
  },

  {
    id: 'canoas',
    name: 'Canoas',
    palette: {
      sky: '#8899aa', skyHorizon: '#bbccdd',
      light: { road: '#5a5a5a', grass: '#779966', rumble: '#cccccc', lane: '#ffffff' },
      dark:  { road: '#4a4a4a', grass: '#668855', rumble: '#555555', lane: '' },
    },
    length: 1200,
    lanes: 2,
    twoWay: false,
    roadWidth: 1800,
    curves: {
      frequency: 0.3,
      minLen: 12, maxLen: 30,
      minIntensity: 1, maxIntensity: 2.5,
    },
    hills: {
      frequency: 0.1,
      minLen: 8, maxLen: 20,
      minHeight: 50, maxHeight: 300,
    },
    traffic: { density: 16, speedRange: [0.3, 0.55] },
    sprites: {
      types: ['building', 'tree'],
      frequency: 10,
      colors: ['#889099', '#7a7068', '#2d8a2d', '#3a9a3a'],
    },
    events: [
      { at: 0.05, type: 'dialogue', speaker: 'wife', text: 'Olha, j\u00e1 estamos em Canoas!' },
      { at: 0.4,  type: 'dialogue', speaker: 'kid', text: 'Posso abrir a janela?' },
      { at: 0.75, type: 'dialogue', speaker: 'driver', text: 'Quase saindo de Canoas...' },
    ],
  },

  {
    id: 'viamao',
    name: 'Viam\u00e3o',
    palette: {
      sky: '#7799bb', skyHorizon: '#aaccdd',
      light: { road: '#6b6b6b', grass: '#55aa55', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#449944', rumble: '#ffffff', lane: '' },
    },
    length: 650,
    lanes: 2,
    twoWay: true,
    roadWidth: 1600,
    curves: {
      frequency: 0.35,
      minLen: 15, maxLen: 40,
      minIntensity: 1, maxIntensity: 2,
    },
    hills: {
      frequency: 0.3,
      minLen: 10, maxLen: 30,
      minHeight: 200, maxHeight: 800,
    },
    traffic: { density: 12, speedRange: [0.2, 0.5] },
    sprites: {
      types: ['tree'],
      frequency: 12,
      colors: ['#2d8a2d', '#3a9a3a', '#1e7a1e'],
    },
    events: [
      { at: 0.02, type: 'dialogue', speaker: 'driver', text: 'Viam\u00e3o... pista simples agora.' },
      { at: 0.3,  type: 'dialogue', speaker: 'wife', text: 'Vai devagar nessa estrada.' },
      { at: 0.55, type: 'dialogue', speaker: 'kid', text: 'T\u00f4 com fome!' },
      { at: 0.8,  type: 'dialogue', speaker: 'driver', text: 'Come a bolacha que a m\u00e3e trouxe.' },
    ],
  },

  {
    id: 'osorio',
    name: 'Os\u00f3rio',
    palette: {
      sky: '#6699bb', skyHorizon: '#99bbdd',
      light: { road: '#6b6b6b', grass: '#44aa44', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#338833', rumble: '#ffffff', lane: '' },
    },
    length: 900,
    lanes: 2,
    twoWay: true,
    roadWidth: 1600,
    curves: {
      frequency: 0.45,
      minLen: 10, maxLen: 35,
      minIntensity: 2, maxIntensity: 5,
    },
    hills: {
      frequency: 0.4,
      minLen: 10, maxLen: 40,
      minHeight: 400, maxHeight: 2000,
    },
    traffic: { density: 10, speedRange: [0.2, 0.45] },
    sprites: {
      types: ['tree'],
      frequency: 10,
      colors: ['#2d8a2d', '#1e7a1e', '#4a8a3a'],
    },
    events: [
      { at: 0.02, type: 'dialogue', speaker: 'wife', text: 'Os\u00f3rio! A serra \u00e9 linda.' },
      { at: 0.2,  type: 'dialogue', speaker: 'kid', text: 'T\u00e1 subindo muito!' },
      { at: 0.45, type: 'dialogue', speaker: 'driver', text: 'Segura que a descida \u00e9 forte!' },
      { at: 0.65, type: 'dialogue', speaker: 'wife', text: 'Vai com calma nessas curvas!' },
      { at: 0.85, type: 'dialogue', speaker: 'kid', text: 'Meu ouvido t\u00e1 tampando!' },
    ],
  },

  {
    id: 'freeway',
    name: 'Freeway',
    palette: {
      sky: '#7799cc', skyHorizon: '#aaccdd',
      light: { road: '#6b6b6b', grass: '#997755', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#886644', rumble: '#ffffff', lane: '' },
    },
    length: 4500,
    lanes: 5,
    twoWay: false,
    roadWidth: 2800,
    curves: {
      frequency: 0.2,
      minLen: 20, maxLen: 60,
      minIntensity: 0.5, maxIntensity: 2,
    },
    hills: {
      frequency: 0.25,
      minLen: 20, maxLen: 50,
      minHeight: 400, maxHeight: 1500,
    },
    traffic: { density: 30, speedRange: [0.4, 0.7] },
    sprites: {
      types: ['tree'],
      frequency: 15,
      colors: ['#997755', '#886644', '#2d8a2d'],
    },
    events: [
      { at: 0.02, type: 'dialogue', speaker: 'driver', text: 'Freeway! Agora sim, p\u00e9 na t\u00e1bua!' },
      { at: 0.2,  type: 'dialogue', speaker: 'kid', text: 'Bota m\u00fasica, pai!' },
      { at: 0.4,  type: 'dialogue', speaker: 'wife', text: 'N\u00e3o corre tanto!' },
      { at: 0.6,  type: 'dialogue', speaker: 'driver', text: 'Relaxa, a estrada \u00e9 boa.' },
      { at: 0.8,  type: 'dialogue', speaker: 'kid', text: 'Quando \u00e9 que chega?!' },
    ],
  },

  {
    id: 'tramandai',
    name: 'Tramanda\u00ed',
    palette: {
      sky: '#4499cc', skyHorizon: '#77bbdd',
      light: { road: '#6b6b6b', grass: '#aaaa66', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#999955', rumble: '#ffffff', lane: '' },
    },
    length: 750,
    lanes: 2,
    twoWay: false,
    roadWidth: 1700,
    curves: {
      frequency: 0.3,
      minLen: 10, maxLen: 30,
      minIntensity: 1, maxIntensity: 2.5,
    },
    hills: {
      frequency: 0.15,
      minLen: 8, maxLen: 20,
      minHeight: 100, maxHeight: 400,
    },
    traffic: { density: 14, speedRange: [0.25, 0.5] },
    sprites: {
      types: ['palm', 'tree'],
      frequency: 12,
      colors: ['#2a9e2a', '#3aae3a', '#1e8e2e'],
    },
    events: [
      { at: 0.05, type: 'dialogue', speaker: 'kid', text: 'T\u00f4 vendo o mar?!' },
      { at: 0.3,  type: 'dialogue', speaker: 'wife', text: 'Ainda n\u00e3o, falta um pouco.' },
      { at: 0.6,  type: 'dialogue', speaker: 'driver', text: 'Olha o cheiro de praia!' },
      { at: 0.85, type: 'dialogue', speaker: 'kid', text: 'EU QUERO SORVETE!' },
    ],
  },

  {
    id: 'litoral',
    name: 'Litoral Ga\u00facho',
    palette: {
      sky: '#2299dd', skyHorizon: '#66ccee',
      light: { road: '#6b6b6b', grass: '#ccbb77', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#bbaa66', rumble: '#ffffff', lane: '' },
    },
    length: 1100,
    lanes: 2,
    twoWay: false,
    roadWidth: 1800,
    curves: {
      frequency: 0.25,
      minLen: 15, maxLen: 40,
      minIntensity: 0.8, maxIntensity: 2,
    },
    hills: {
      frequency: 0.2,
      minLen: 10, maxLen: 25,
      minHeight: 100, maxHeight: 600,
    },
    traffic: { density: 16, speedRange: [0.3, 0.55] },
    sprites: {
      types: ['palm'],
      frequency: 12,
      colors: ['#2a9e2a', '#3aae3a', '#1e8e2e'],
    },
    events: [
      { at: 0.02, type: 'dialogue', speaker: 'driver', text: 'Litoral ga\u00facho, quase l\u00e1!' },
      { at: 0.25, type: 'dialogue', speaker: 'wife', text: 'Que lindo esse p\u00f4r do sol!' },
      { at: 0.5,  type: 'dialogue', speaker: 'kid', text: 'Pai, olha as dunas!' },
      { at: 0.75, type: 'dialogue', speaker: 'driver', text: 'J\u00e1 d\u00e1 pra sentir Floripa!' },
    ],
  },

  {
    id: 'floripa',
    name: 'Florian\u00f3polis',
    palette: {
      sky: '#1188cc', skyHorizon: '#55bbee',
      light: { road: '#6b6b6b', grass: '#ddcc88', rumble: '#cc4422', lane: '#ffffff' },
      dark:  { road: '#5a5a5a', grass: '#ccbb77', rumble: '#ffffff', lane: '' },
    },
    length: 600,
    lanes: 3,
    twoWay: false,
    roadWidth: 2000,
    curves: {
      frequency: 0.3,
      minLen: 10, maxLen: 25,
      minIntensity: 1, maxIntensity: 3,
    },
    hills: {
      frequency: 0.2,
      minLen: 8, maxLen: 20,
      minHeight: 200, maxHeight: 800,
    },
    traffic: { density: 20, speedRange: [0.3, 0.55] },
    sprites: {
      types: ['palm', 'building'],
      frequency: 10,
      colors: ['#2a9e2a', '#889099', '#a09080'],
    },
    events: [
      { at: 0.02, type: 'dialogue', speaker: 'wife', text: 'Florian\u00f3polis! Chegamos!' },
      { at: 0.3,  type: 'dialogue', speaker: 'kid', text: 'PRAIA! PRAIA! PRAIA!' },
      { at: 0.6,  type: 'dialogue', speaker: 'wife', text: 'Procura onde estacionar...' },
      { at: 0.85, type: 'dialogue', speaker: 'driver', text: 'Conseguimos, fam\u00edlia!' },
    ],
  },
];
