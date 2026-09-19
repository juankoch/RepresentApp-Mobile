export type SearchResultKind = 'player' | 'agent' | 'club';

export type SearchResult = {
  id: string;
  name: string;
  kind: SearchResultKind;
  subtitle: string;
  photo: number;
};

export const playerSearchResults: SearchResult[] = [
  {
    id: 'marcos-gomez',
    name: 'Marcos Gómez',
    kind: 'agent',
    subtitle: 'Elite Sports',
    photo: require('../../assets/mock/agent-marco.png'),
  },
  {
    id: 'teo-perez',
    name: 'Teo Pérez',
    kind: 'agent',
    subtitle: 'NextGen Agency',
    photo: require('../../assets/mock/agent-teo.png'),
  },
  {
    id: 'john-kennedy',
    name: 'John Kennedy',
    kind: 'agent',
    subtitle: 'Global Sports',
    photo: require('../../assets/mock/agent-john.png'),
  },
  {
    id: 'lucas-moretti',
    name: 'Lucas Moretti',
    kind: 'agent',
    subtitle: 'ProTalent',
    photo: require('../../assets/mock/agent-lucas.png'),
  },
  {
    id: 'carla-nunez',
    name: 'Carla Núñez',
    kind: 'agent',
    subtitle: 'Núñez & Asociados',
    photo: require('../../assets/mock/msg-carla.png'),
  },
  {
    id: 'gaston-martirena',
    name: 'Gastón Martirena',
    kind: 'agent',
    subtitle: 'MG Management',
    photo: require('../../assets/mock/msg-gaston.png'),
  },
  {
    id: 'lucas-romero',
    name: 'Lucas Romero',
    kind: 'agent',
    subtitle: 'LR Sports',
    photo: require('../../assets/mock/msg-lucas-r.png'),
  },
  {
    id: 'mateo-ruiz',
    name: 'Mateo Ruiz',
    kind: 'player',
    subtitle: 'Delantero · 2006',
    photo: require('../../assets/mock/player-mateo.png'),
  },
  {
    id: 'santiago-lopez',
    name: 'Santiago López',
    kind: 'player',
    subtitle: 'Mediocampista · 2005',
    photo: require('../../assets/mock/player-santiago.png'),
  },
  {
    id: 'valentin-diaz',
    name: 'Valentín Díaz',
    kind: 'player',
    subtitle: 'Defensor · 2006',
    photo: require('../../assets/mock/player-valentin.png'),
  },
  {
    id: 'tobias-fernandez',
    name: 'Tobías Fernández',
    kind: 'player',
    subtitle: 'Arquero · 2007',
    photo: require('../../assets/mock/player-tobias.png'),
  },
  {
    id: 'racing',
    name: 'Club Atlético Racing',
    kind: 'club',
    subtitle: 'Avellaneda, Buenos Aires',
    photo: require('../../assets/mock/crest-racing.png'),
  },
  {
    id: 'huracan',
    name: 'Club Atlético Huracán',
    kind: 'club',
    subtitle: 'CABA, Buenos Aires',
    photo: require('../../assets/mock/crest-huracan.png'),
  },
];

export const initialRecentSearches = [
  'Marcos Gómez',
  'Mateo Ruiz',
  'Teo Pérez',
];
