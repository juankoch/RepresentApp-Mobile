import { ComponentProps } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';

type IconName = ComponentProps<typeof FontAwesome5>['name'];

export type ProfileKind = 'player' | 'agent' | 'club';

export type ProfileStat = {
  value: string;
  label: string;
};

export type ProfileField = {
  icon: IconName;
  label: string;
  value: string;
};

export const OWN_PROFILE_ID = 'me';

export type UserProfile = {
  id: string;
  kind: ProfileKind;
  name: string;
  email?: string;
  location: string;
  photo: number;
  stats: ProfileStat[];
  fields: ProfileField[];
  about: string;
  birthDate?: string;
  conversationId?: string;
};

export function isOwnProfileId(userId?: string) {
  return !userId || userId === OWN_PROFILE_ID;
}

export const currentPlayerProfile: UserProfile = {
  id: OWN_PROFILE_ID,
  kind: 'player',
  name: 'Juan Gonzales',
  email: 'juan.gonzales@email.com',
  location: 'Buenos Aires, Argentina',
  birthDate: '15/03/2005',
  photo: require('../../assets/mock/juan.png'),
  stats: [
    { value: '27', label: 'Partidos' },
    { value: '12', label: 'Goles' },
    { value: '8', label: 'Asistencias' },
  ],
  fields: [
    { icon: 'futbol', label: 'Posición', value: 'Delantero' },
    { icon: 'calendar-alt', label: 'Edad', value: '21 años' },
    { icon: 'arrows-alt-v', label: 'Altura', value: '1,83 m' },
    { icon: 'walking', label: 'Pierna hábil', value: 'Derecha' },
    { icon: 'shield-alt', label: 'Club actual', value: 'Racing Club' },
    { icon: 'user-tie', label: 'Representante', value: 'Sin representante' },
  ],
  about:
    'Delantero con gran movilidad y juego aéreo. Siempre buscando mejorar.',
};

export const currentAgentProfile: UserProfile = {
  id: OWN_PROFILE_ID,
  kind: 'agent',
  name: 'Rodrigo Fernández',
  email: 'rodrigo@agenciafutbol.com',
  location: 'Buenos Aires, Argentina',
  photo: require('../../assets/mock/agent-marco.png'),
  stats: [
    { value: '28', label: 'Jugadores' },
    { value: '12', label: 'Conexiones' },
    { value: '6', label: 'Años exp.' },
  ],
  fields: [
    { icon: 'building', label: 'Agencia', value: 'Agencia Fútbol Global' },
    { icon: 'briefcase', label: 'Experiencia', value: '6 años' },
    { icon: 'star', label: 'Especialidad', value: 'Juveniles y primer contrato' },
    { icon: 'map-marker-alt', label: 'Zona', value: 'Argentina y exterior' },
    { icon: 'users', label: 'Representados', value: '28 jugadores' },
    { icon: 'user-friends', label: 'Enfoque', value: 'Carrera formativa' },
  ],
  about:
    'Representante de futbolistas profesionales y juveniles. Trabajo con clubes de Argentina y el exterior, con seguimiento cercano de cada proceso.',
};

export const otherUserProfiles: UserProfile[] = [
  {
    id: 'marcos-gomez',
    kind: 'agent',
    name: 'Marcos Gómez',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/agent-marco.png'),
    stats: [
      { value: '14', label: 'Jugadores' },
      { value: '9', label: 'Años' },
      { value: '4.8', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'Elite Sports' },
      { icon: 'briefcase', label: 'Experiencia', value: '9 años' },
      { icon: 'star', label: 'Especialidad', value: 'Inferiores' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'CABA y GBA' },
      { icon: 'users', label: 'Representados', value: '14 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Carrera formativa' },
    ],
    about:
      'Representante enfocado en juveniles con proyección. Acompaña procesos de formación y visibilidad frente a clubes.',
    conversationId: 'marcos',
  },
  {
    id: 'teo-perez',
    kind: 'agent',
    name: 'Teo Pérez',
    location: 'Córdoba, Argentina',
    photo: require('../../assets/mock/agent-teo.png'),
    stats: [
      { value: '11', label: 'Jugadores' },
      { value: '6', label: 'Años' },
      { value: '4.7', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'NextGen Agency' },
      { icon: 'briefcase', label: 'Experiencia', value: '6 años' },
      { icon: 'star', label: 'Especialidad', value: 'Primer contrato' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Córdoba' },
      { icon: 'users', label: 'Representados', value: '11 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Desarrollo profesional' },
    ],
    about:
      'Trabaja con futbolistas en etapa de primer contrato. Prioriza continuidad, seguimiento y oportunidades concretas.',
  },
  {
    id: 'john-kennedy',
    kind: 'agent',
    name: 'John Kennedy',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/agent-john.png'),
    stats: [
      { value: '18', label: 'Jugadores' },
      { value: '12', label: 'Años' },
      { value: '4.6', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'Global Sports' },
      { icon: 'briefcase', label: 'Experiencia', value: '12 años' },
      { icon: 'star', label: 'Especialidad', value: 'Mercado internacional' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Buenos Aires' },
      { icon: 'users', label: 'Representados', value: '18 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Puentes con el exterior' },
    ],
    about:
      'Experiencia vinculando talento local con clubes y redes internacionales, con seguimiento cercano de cada proceso.',
  },
  {
    id: 'lucas-moretti',
    kind: 'agent',
    name: 'Lucas Moretti',
    location: 'Rosario, Argentina',
    photo: require('../../assets/mock/agent-lucas.png'),
    stats: [
      { value: '9', label: 'Jugadores' },
      { value: '5', label: 'Años' },
      { value: '4.5', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'ProTalent' },
      { icon: 'briefcase', label: 'Experiencia', value: '5 años' },
      { icon: 'star', label: 'Especialidad', value: 'Scouting' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Rosario' },
      { icon: 'users', label: 'Representados', value: '9 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Detección de talentos' },
    ],
    about:
      'Combina scouting territorial con representación. Busca jugadores con recorrido claro en inferiores.',
  },
  {
    id: 'carla-nunez',
    kind: 'agent',
    name: 'Carla Núñez',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/msg-carla.png'),
    stats: [
      { value: '10', label: 'Jugadores' },
      { value: '7', label: 'Años' },
      { value: '4.6', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'Núñez & Asociados' },
      { icon: 'briefcase', label: 'Experiencia', value: '7 años' },
      { icon: 'star', label: 'Especialidad', value: 'Acompañamiento integral' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'CABA' },
      { icon: 'users', label: 'Representados', value: '10 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Formación y contratos' },
    ],
    about:
      'Acompaña a futbolistas en lo deportivo y contractual, con comunicación directa y seguimiento constante.',
  },
  {
    id: 'gaston-martirena',
    kind: 'agent',
    name: 'Gastón Martirena',
    location: 'La Plata, Argentina',
    photo: require('../../assets/mock/msg-gaston.png'),
    stats: [
      { value: '8', label: 'Jugadores' },
      { value: '4', label: 'Años' },
      { value: '4.4', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'MG Management' },
      { icon: 'briefcase', label: 'Experiencia', value: '4 años' },
      { icon: 'star', label: 'Especialidad', value: 'Juveniles' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'La Plata' },
      { icon: 'users', label: 'Representados', value: '8 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Primeras oportunidades' },
    ],
    about:
      'Trabaja con juveniles que están dando el salto. Prioriza pruebas, visibilidad y un plan de carrera ordenado.',
  },
  {
    id: 'lucas-romero',
    kind: 'agent',
    name: 'Lucas Romero',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/msg-lucas-r.png'),
    stats: [
      { value: '7', label: 'Jugadores' },
      { value: '3', label: 'Años' },
      { value: '4.3', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'LR Sports' },
      { icon: 'briefcase', label: 'Experiencia', value: '3 años' },
      { icon: 'star', label: 'Especialidad', value: 'Red de clubes' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Buenos Aires' },
      { icon: 'users', label: 'Representados', value: '7 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Contacto con clubes' },
    ],
    about:
      'Construye puentes entre jugadores y clubes de la región. Perfil cercano, con seguimiento partido a partido.',
  },
  {
    id: 'mateo-ruiz',
    kind: 'player',
    name: 'Mateo Ruiz',
    location: 'CABA, Argentina',
    photo: require('../../assets/mock/player-mateo.png'),
    stats: [
      { value: '31', label: 'Partidos' },
      { value: '14', label: 'Goles' },
      { value: '6', label: 'Asistencias' },
    ],
    fields: [
      { icon: 'futbol', label: 'Posición', value: 'Delantero' },
      { icon: 'calendar-alt', label: 'Edad', value: '20 años' },
      { icon: 'arrows-alt-v', label: 'Altura', value: '1,78 m' },
      { icon: 'walking', label: 'Pierna hábil', value: 'Derecha' },
      { icon: 'shield-alt', label: 'Club actual', value: 'Huracán' },
      { icon: 'user-tie', label: 'Representante', value: 'Sin representante' },
    ],
    about:
      'Delantero con desmarque y definición. Busca continuidad y un entorno para seguir creciendo.',
  },
  {
    id: 'santiago-lopez',
    kind: 'player',
    name: 'Santiago López',
    location: 'Avellaneda, Argentina',
    photo: require('../../assets/mock/player-santiago.png'),
    stats: [
      { value: '28', label: 'Partidos' },
      { value: '5', label: 'Goles' },
      { value: '11', label: 'Asistencias' },
    ],
    fields: [
      { icon: 'futbol', label: 'Posición', value: 'Mediocampista' },
      { icon: 'calendar-alt', label: 'Edad', value: '21 años' },
      { icon: 'arrows-alt-v', label: 'Altura', value: '1,76 m' },
      { icon: 'walking', label: 'Pierna hábil', value: 'Izquierda' },
      { icon: 'shield-alt', label: 'Club actual', value: 'Independiente' },
      { icon: 'user-tie', label: 'Representante', value: 'NextGen Agency' },
    ],
    about:
      'Mediocampista con buen pie y llegada. Le gusta asociarse y manejar el ritmo del partido.',
  },
  {
    id: 'valentin-diaz',
    kind: 'player',
    name: 'Valentín Díaz',
    location: 'Caballito, Argentina',
    photo: require('../../assets/mock/player-valentin.png'),
    stats: [
      { value: '24', label: 'Partidos' },
      { value: '2', label: 'Goles' },
      { value: '3', label: 'Asistencias' },
    ],
    fields: [
      { icon: 'futbol', label: 'Posición', value: 'Defensor' },
      { icon: 'calendar-alt', label: 'Edad', value: '20 años' },
      { icon: 'arrows-alt-v', label: 'Altura', value: '1,84 m' },
      { icon: 'walking', label: 'Pierna hábil', value: 'Derecha' },
      { icon: 'shield-alt', label: 'Club actual', value: 'Ferro' },
      { icon: 'user-tie', label: 'Representante', value: 'Sin representante' },
    ],
    about:
      'Defensor central con juego aéreo y salida limpia. Prioriza la concentración y el uno contra uno.',
  },
  {
    id: 'tobias-fernandez',
    kind: 'player',
    name: 'Tobías Fernández',
    location: 'Avellaneda, Argentina',
    photo: require('../../assets/mock/player-tobias.png'),
    stats: [
      { value: '22', label: 'Partidos' },
      { value: '8', label: 'Vallas' },
      { value: '47', label: 'Atajadas' },
    ],
    fields: [
      { icon: 'futbol', label: 'Posición', value: 'Arquero' },
      { icon: 'calendar-alt', label: 'Edad', value: '19 años' },
      { icon: 'arrows-alt-v', label: 'Altura', value: '1,86 m' },
      { icon: 'walking', label: 'Pierna hábil', value: 'Derecha' },
      { icon: 'shield-alt', label: 'Club actual', value: 'Racing Club' },
      { icon: 'user-tie', label: 'Representante', value: 'Elite Sports' },
    ],
    about:
      'Arquero con buen juego con los pies y personalidad en el área. Busca sumar minutos y rodaje.',
  },
  {
    id: 'adelina-perez',
    kind: 'agent',
    name: 'Adelina Perez',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/msg-adelina.png'),
    stats: [
      { value: '9', label: 'Jugadores' },
      { value: '6', label: 'Años' },
      { value: '4.6', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'AP Management' },
      { icon: 'briefcase', label: 'Experiencia', value: '6 años' },
      { icon: 'star', label: 'Especialidad', value: 'Juveniles' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'CABA' },
      { icon: 'users', label: 'Representados', value: '9 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Seguimiento cercano' },
    ],
    about:
      'Representante con seguimiento cercano de cada jugador. Prioriza comunicación clara y continuidad.',
    conversationId: 'adelina',
  },
  {
    id: 'sofia-ramirez',
    kind: 'agent',
    name: 'Sofía Ramírez',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/msg-sofia.png'),
    stats: [
      { value: '8', label: 'Jugadores' },
      { value: '5', label: 'Años' },
      { value: '4.5', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'Ramírez Sports' },
      { icon: 'briefcase', label: 'Experiencia', value: '5 años' },
      { icon: 'star', label: 'Especialidad', value: 'Primer contrato' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Buenos Aires' },
      { icon: 'users', label: 'Representados', value: '8 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Desarrollo profesional' },
    ],
    about:
      'Acompaña a futbolistas en la etapa de visibilidad y primer contrato, con un perfil cercano y ordenado.',
    conversationId: 'sofia',
  },
  {
    id: 'juan-perez',
    kind: 'agent',
    name: 'Juan Pérez',
    location: 'Buenos Aires, Argentina',
    photo: require('../../assets/mock/agent-john.png'),
    stats: [
      { value: '13', label: 'Jugadores' },
      { value: '8', label: 'Años' },
      { value: '4.6', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'JP Sports' },
      { icon: 'briefcase', label: 'Experiencia', value: '8 años' },
      { icon: 'star', label: 'Especialidad', value: 'Inferiores' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'CABA y GBA' },
      { icon: 'users', label: 'Representados', value: '13 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Red de clubes' },
    ],
    about:
      'Trabaja con juveniles y clubes de la región. Busca procesos claros y oportunidades concretas.',
    conversationId: 'juan-perez',
  },
  {
    id: 'agustin-torres',
    kind: 'agent',
    name: 'Agustín Torres',
    location: 'Rosario, Argentina',
    photo: require('../../assets/mock/agent-lucas.png'),
    stats: [
      { value: '7', label: 'Jugadores' },
      { value: '4', label: 'Años' },
      { value: '4.4', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'Torres Agency' },
      { icon: 'briefcase', label: 'Experiencia', value: '4 años' },
      { icon: 'star', label: 'Especialidad', value: 'Scouting' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Rosario' },
      { icon: 'users', label: 'Representados', value: '7 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Detección de talentos' },
    ],
    about:
      'Perfil de scouting y representación. Busca jugadores con recorrido y proyección en inferiores.',
    conversationId: 'agustin',
  },
  {
    id: 'lucia-fernandez',
    kind: 'agent',
    name: 'Lucía Fernández',
    location: 'Córdoba, Argentina',
    photo: require('../../assets/mock/msg-lucia.png'),
    stats: [
      { value: '10', label: 'Jugadores' },
      { value: '6', label: 'Años' },
      { value: '4.5', label: 'Rating' },
    ],
    fields: [
      { icon: 'building', label: 'Agencia', value: 'LF Management' },
      { icon: 'briefcase', label: 'Experiencia', value: '6 años' },
      { icon: 'star', label: 'Especialidad', value: 'Acompañamiento integral' },
      { icon: 'map-marker-alt', label: 'Zona', value: 'Córdoba' },
      { icon: 'users', label: 'Representados', value: '10 jugadores' },
      { icon: 'user-friends', label: 'Enfoque', value: 'Formación y contratos' },
    ],
    about:
      'Acompaña procesos de formación y contrato con comunicación directa y seguimiento constante.',
    conversationId: 'lucia',
  },
  {
    id: 'racing',
    kind: 'club',
    name: 'Club Atlético Racing',
    location: 'Avellaneda, Buenos Aires',
    photo: require('../../assets/mock/crest-racing.png'),
    stats: [
      { value: '12', label: 'Divisiones' },
      { value: '4', label: 'Pruebas' },
      { value: '121', label: 'Años' },
    ],
    fields: [
      { icon: 'shield-alt', label: 'Tipo', value: 'Club' },
      { icon: 'futbol', label: 'Enfoque', value: 'Inferiores' },
      { icon: 'map-marker-alt', label: 'Sede', value: 'Avellaneda' },
      { icon: 'users', label: 'Captación', value: 'Juveniles' },
      { icon: 'clipboard', label: 'Evaluación', value: 'Presencial' },
      { icon: 'calendar-alt', label: 'Próxima prueba', value: '4 de diciembre' },
    ],
    about:
      'Racing Club convoca futbolistas para sus divisiones formativas. La evaluación es presencial y está a cargo del cuerpo técnico de inferiores.',
    conversationId: 'racing',
  },
  {
    id: 'huracan',
    kind: 'club',
    name: 'Club Atlético Huracán',
    location: 'CABA, Buenos Aires',
    photo: require('../../assets/mock/crest-huracan.png'),
    stats: [
      { value: '10', label: 'Divisiones' },
      { value: '3', label: 'Pruebas' },
      { value: '116', label: 'Años' },
    ],
    fields: [
      { icon: 'shield-alt', label: 'Tipo', value: 'Club' },
      { icon: 'futbol', label: 'Enfoque', value: 'Inferiores' },
      { icon: 'map-marker-alt', label: 'Sede', value: 'Parque Patricios' },
      { icon: 'users', label: 'Captación', value: '15 a 17 años' },
      { icon: 'clipboard', label: 'Evaluación', value: 'Presencial' },
      { icon: 'calendar-alt', label: 'Próxima prueba', value: '25 de noviembre' },
    ],
    about:
      'Huracán realiza jornadas de evaluación para descubrir jóvenes con proyección en las divisiones juveniles del club.',
  },
];

export function getUserProfileById(id: string) {
  if (isOwnProfileId(id)) {
    return currentPlayerProfile;
  }

  return otherUserProfiles.find((profile) => profile.id === id);
}

export function getProfilesByKind(kind: ProfileKind) {
  return otherUserProfiles.filter((profile) => profile.kind === kind);
}

export function getProfileSecondary(profile: UserProfile) {
  if (profile.kind === 'player') {
    return (
      profile.fields.find((field) => field.label === 'Posición')?.value ??
      profile.location
    );
  }

  if (profile.kind === 'agent') {
    return (
      profile.fields.find((field) => field.label === 'Agencia')?.value ??
      profile.location
    );
  }

  return profile.location;
}

export function getProfileRating(profile: UserProfile) {
  return profile.stats.find((stat) => stat.label === 'Rating')?.value;
}

export function getProfileRoleLabel(kind: ProfileKind) {
  if (kind === 'player') {
    return 'Jugador';
  }
  if (kind === 'club') {
    return 'Club';
  }
  return 'Representante';
}

export const initialIncomingRequestIds = [
  'sofia-ramirez',
  'santiago-lopez',
  'carla-nunez',
  'tobias-fernandez',
];

export const initialConnectedIds = ['teo-perez', 'mateo-ruiz'];

export const agentIncomingRequestIds = [
  'santiago-lopez',
  'valentin-diaz',
  'tobias-fernandez',
];

export const agentConnectedIds = ['mateo-ruiz'];
