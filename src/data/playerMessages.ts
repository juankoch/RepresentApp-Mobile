export type ChatMessage = {
  id: string;
  fromMe: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'read';
};

export type Conversation = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  avatar: number;
  messages: ChatMessage[];
};

export type MessageRequest = {
  id: string;
  profileId?: string;
  name: string;
  role: string;
  subtitle: string;
  avatar: number;
};

export const initialConversations: Conversation[] = [
  {
    id: 'marcos',
    profileId: 'marcos-gomez',
    name: 'Marcos Gómez',
    role: 'Representante',
    preview: 'Dale, nos vemos mañana.',
    time: '10:24',
    unread: 2,
    avatar: require('../../assets/mock/agent-marco.png'),
    messages: [
      {
        id: 'marcos-1',
        fromMe: false,
        text: 'Hola Juan, te confirmo la reunión de mañana.',
        time: '10:20',
      },
      {
        id: 'marcos-2',
        fromMe: false,
        text: 'Dale, nos vemos mañana.',
        time: '10:24',
      },
    ],
  },
  {
    id: 'adelina',
    profileId: 'adelina-perez',
    name: 'Adelina Perez',
    role: 'Representante',
    preview: 'Dale, muchas gracias!',
    time: '10:48',
    unread: 0,
    avatar: require('../../assets/mock/msg-adelina.png'),
    messages: [
      {
        id: 'adelina-1',
        fromMe: false,
        text: 'Hola, como estas? Tenes libre mañana a las 16pm para tu reunión?',
        time: '10:45',
      },
      {
        id: 'adelina-2',
        fromMe: true,
        text: 'Hola Adelina!',
        time: '10:46',
        status: 'read',
      },
      {
        id: 'adelina-3',
        fromMe: true,
        text: 'Sí, mañana a esa hora estoy libre.',
        time: '10:46',
        status: 'read',
      },
      {
        id: 'adelina-4',
        fromMe: false,
        text: 'Perfecto, te paso la dirección por acá. Cualquier cosa me decís.',
        time: '10:47',
      },
      {
        id: 'adelina-5',
        fromMe: true,
        text: 'Dale, muchas gracias!',
        time: '10:48',
        status: 'read',
      },
    ],
  },
  {
    id: 'sofia',
    profileId: 'sofia-ramirez',
    name: 'Sofía Ramírez',
    role: 'Representante',
    preview: 'Te paso la información.',
    time: 'Ayer',
    unread: 0,
    avatar: require('../../assets/mock/msg-sofia.png'),
    messages: [
      {
        id: 'sofia-1',
        fromMe: false,
        text: 'Te paso la información.',
        time: '18:12',
      },
    ],
  },
  {
    id: 'juan-perez',
    profileId: 'juan-perez',
    name: 'Juan Pérez',
    role: 'Representante',
    preview: 'Perfecto, gracias!',
    time: '15 sept.',
    unread: 0,
    avatar: require('../../assets/mock/agent-john.png'),
    messages: [
      {
        id: 'juan-1',
        fromMe: true,
        text: 'Listo, te confirmo.',
        time: '11:02',
        status: 'read',
      },
      {
        id: 'juan-2',
        fromMe: false,
        text: 'Perfecto, gracias!',
        time: '11:05',
      },
    ],
  },
  {
    id: 'racing',
    profileId: 'racing',
    name: 'Club Atlético Racing',
    role: 'Club',
    preview: 'Nos comunicaremos pronto.',
    time: '12 sept.',
    unread: 0,
    avatar: require('../../assets/mock/crest-racing.png'),
    messages: [
      {
        id: 'racing-1',
        fromMe: false,
        text: 'Nos comunicaremos pronto.',
        time: '16:40',
      },
    ],
  },
  {
    id: 'agustin',
    profileId: 'agustin-torres',
    name: 'Agustín Torres',
    role: 'Representante',
    preview: '¿Tenés disponibilidad?',
    time: '10 sept.',
    unread: 0,
    avatar: require('../../assets/mock/agent-lucas.png'),
    messages: [
      {
        id: 'agustin-1',
        fromMe: false,
        text: '¿Tenés disponibilidad?',
        time: '09:18',
      },
    ],
  },
  {
    id: 'lucia',
    profileId: 'lucia-fernandez',
    name: 'Lucía Fernández',
    role: 'Representante',
    preview: 'Gracias por el mensaje.',
    time: '8 sept.',
    unread: 0,
    avatar: require('../../assets/mock/msg-lucia.png'),
    messages: [
      {
        id: 'lucia-1',
        fromMe: false,
        text: 'Gracias por el mensaje.',
        time: '14:22',
      },
    ],
  },
];

export const initialMessageRequests: MessageRequest[] = [
  {
    id: 'req-marco',
    name: 'Marco Gomez',
    role: 'Representante',
    subtitle: 'Gomez Sports',
    avatar: require('../../assets/mock/agent-teo.png'),
  },
  {
    id: 'req-gaston',
    profileId: 'gaston-martirena',
    name: 'Gastón Martirena',
    role: 'Representante',
    subtitle: 'MG Management',
    avatar: require('../../assets/mock/msg-gaston.png'),
  },
  {
    id: 'req-huracan',
    profileId: 'huracan',
    name: 'Club Atlético Huracán',
    role: 'Club',
    subtitle: 'Área de captación',
    avatar: require('../../assets/mock/crest-huracan.png'),
  },
  {
    id: 'req-carla',
    profileId: 'carla-nunez',
    name: 'Carla Núñez',
    role: 'Representante',
    subtitle: 'Núñez & Asociados',
    avatar: require('../../assets/mock/msg-carla.png'),
  },
  {
    id: 'req-lucas',
    profileId: 'lucas-romero',
    name: 'Lucas Romero',
    role: 'Representante',
    subtitle: 'LR Sports',
    avatar: require('../../assets/mock/msg-lucas-r.png'),
  },
];

export const agentConversations: Conversation[] = [
  {
    id: 'mateo',
    profileId: 'mateo-ruiz',
    name: 'Mateo Ruiz',
    role: 'Jugador',
    preview: 'Perfecto, gracias Rodrigo.',
    time: '11:10',
    unread: 1,
    avatar: require('../../assets/mock/player-mateo.png'),
    messages: [
      {
        id: 'mateo-1',
        fromMe: false,
        text: 'Hola Rodrigo, te confirmo que llego a la prueba.',
        time: '11:05',
      },
      {
        id: 'mateo-2',
        fromMe: true,
        text: 'Dale Mateo, te esperamos.',
        time: '11:08',
        status: 'read',
      },
      {
        id: 'mateo-3',
        fromMe: false,
        text: 'Perfecto, gracias Rodrigo.',
        time: '11:10',
      },
    ],
  },
  {
    id: 'santiago',
    profileId: 'santiago-lopez',
    name: 'Santiago López',
    role: 'Jugador',
    preview: '¿A qué hora es la reunión?',
    time: '09:42',
    unread: 0,
    avatar: require('../../assets/mock/player-santiago.png'),
    messages: [
      {
        id: 'santiago-1',
        fromMe: false,
        text: '¿A qué hora es la reunión?',
        time: '09:42',
      },
    ],
  },
];

export const agentMessageRequests: MessageRequest[] = [
  {
    id: 'req-valentin',
    profileId: 'valentin-diaz',
    name: 'Valentín Díaz',
    role: 'Jugador',
    subtitle: 'Defensor · 2006',
    avatar: require('../../assets/mock/player-valentin.png'),
  },
  {
    id: 'req-tobias',
    profileId: 'tobias-fernandez',
    name: 'Tobías Fernández',
    role: 'Jugador',
    subtitle: 'Arquero · 2007',
    avatar: require('../../assets/mock/player-tobias.png'),
  },
];
