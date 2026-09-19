export type PlayerHighlight = {
  id: string;
  title: string;
  subtitle: string;
  thumbnail: number;
};

export const highlightCatalog: PlayerHighlight[] = [
  {
    id: 'highlight-gol',
    title: 'Gol vs. Boca Juniors',
    subtitle: 'Torneo Juvenil',
    thumbnail: require('../../assets/mock/trial-hero.png'),
  },
  {
    id: 'highlight-asistencia',
    title: 'Asistencia',
    subtitle: 'Copa 2024',
    thumbnail: require('../../assets/mock/banner.png'),
  },
  {
    id: 'highlight-jugadas',
    title: 'Jugadas destacadas',
    subtitle: 'Selección Sub 20',
    thumbnail: require('../../assets/mock/player-mateo.png'),
  },
];
