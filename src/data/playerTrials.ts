export type PlayerTrial = {
  id: string;
  name: string;
  club: string;
  date: string;
  ageRange: string;
  location: string;
  evaluationType: string;
  description: string;
  crest: number;
  hero: number;
};

export const playerTrials: PlayerTrial[] = [
  {
    id: 'huracan',
    name: 'Prueba Huracán',
    club: 'Club Atlético Huracán',
    date: '25 de noviembre',
    ageRange: '15 a 17 años',
    location: 'CABA, Buenos Aires',
    evaluationType: 'Evaluación presencial',
    description:
      'El Club Atlético Huracán realizará una jornada de evaluación el 25 de noviembre, dirigida a futbolistas de entre 15 y 17 años.\n\nEsta prueba busca descubrir jóvenes talentos con proyección para incorporarse a las divisiones juveniles del club.\n\nLos participantes tendrán la oportunidad de mostrar sus habilidades frente a entrenadores y representantes oficiales del club.',
    crest: require('../../assets/mock/crest-huracan.png'),
    hero: require('../../assets/mock/trial-hero.png'),
  },
  {
    id: 'ferro',
    name: 'Prueba Ferro',
    club: 'Club Ferro Carril Oeste',
    date: '12 de diciembre',
    ageRange: '13 a 14 años',
    location: 'Caballito, CABA',
    evaluationType: 'Evaluación presencial',
    description:
      'Ferro Carril Oeste convoca a una prueba presencial el 12 de diciembre para futbolistas de 13 a 14 años.\n\nLa jornada está orientada a detectar talentos para las categorías formativas del club.',
    crest: require('../../assets/mock/crest-ferro.png'),
    hero: require('../../assets/mock/trial-hero.png'),
  },
  {
    id: 'racing',
    name: 'Prueba Racing',
    club: 'Racing Club',
    date: '4 de diciembre',
    ageRange: '13 a 15 años',
    location: 'Avellaneda, Buenos Aires',
    evaluationType: 'Evaluación presencial',
    description:
      'Racing Club realizará una prueba el 4 de diciembre para futbolistas de 13 a 15 años en Avellaneda.\n\nLa evaluación será presencial y estará a cargo del cuerpo técnico de inferiores.',
    crest: require('../../assets/mock/crest-racing.png'),
    hero: require('../../assets/mock/trial-hero.png'),
  },
  {
    id: 'independiente',
    name: 'Prueba Independiente',
    club: 'Club Atlético Independiente',
    date: '18 de diciembre',
    ageRange: '15 a 17 años',
    location: 'Avellaneda, Buenos Aires',
    evaluationType: 'Evaluación presencial',
    description:
      'Independiente abre una convocatoria el 18 de diciembre para futbolistas de 15 a 17 años.\n\nLa prueba será presencial y busca incorporar jugadores a las divisiones juveniles.',
    crest: require('../../assets/mock/crest-independiente.png'),
    hero: require('../../assets/mock/trial-hero.png'),
  },
];

export function getPlayerTrialById(id: string) {
  return playerTrials.find((trial) => trial.id === id);
}
