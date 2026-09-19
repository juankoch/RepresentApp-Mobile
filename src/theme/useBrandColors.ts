import { usePlayerProfile } from '../context/PlayerProfileContext';
import { getBrandColors } from './brand';

export function useBrandColors() {
  const { role } = usePlayerProfile();
  return getBrandColors(role);
}
