import { FontAwesome5 } from '@expo/vector-icons';
import {
  Dimensions,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

const { width: windowWidth } = Dimensions.get('window');
const horizontalPadding = 20;
const cardWidth = Math.min(118, (windowWidth - horizontalPadding * 2 - 24) / 3.15);

type PersonCardProps = {
  name: string;
  photo?: number;
  photoUrl?: string;
  subtitle: string;
  rating?: string;
  country?: string;
  isPremium?: boolean;
  pending: boolean;
  connected?: boolean;
  badge: 'user' | 'plus';
  onPress: () => void;
  onRequest: () => void;
};

export function PersonCard({
  name,
  photo,
  photoUrl,
  subtitle,
  rating,
  country,
  isPremium,
  pending,
  connected,
  badge,
  onPress,
  onRequest,
}: PersonCardProps) {
  const brand = useBrandColors();
  const requestBusy = pending || connected;

  return (
    <Pressable style={styles.personCard} onPress={onPress}>
      <View>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.personPhoto} />
        ) : photo ? (
          <Image source={photo} style={styles.personPhoto} />
        ) : (
          <View style={styles.personPhoto} />
        )}
        {isPremium ? (
          <View style={styles.premiumMark}>
            <FontAwesome5 name="crown" solid size={8} color={brand.accent} />
          </View>
        ) : null}
        <Pressable
          style={[
            badge === 'plus' ? [styles.plusBadge, { backgroundColor: brand.header }] : styles.photoUserBadge,
            pending && (badge === 'plus' ? styles.plusBadgePending : styles.photoUserBadgePending),
            connected && [styles.connectedBadge, { backgroundColor: brand.header }],
          ]}
          hitSlop={8}
          onPress={() => {
            if (!requestBusy) {
              onRequest();
            }
          }}
        >
          <FontAwesome5
            name={connected ? 'check' : pending ? 'clock' : badge === 'plus' ? 'plus' : 'user'}
            size={badge === 'plus' ? 11 : 9}
            color={
              connected || (badge === 'plus' && !pending) ? '#FFFFFF' : '#4A4A4A'
            }
          />
        </Pressable>
      </View>
      <Text style={styles.personName} numberOfLines={1}>
        {name}
      </Text>
      <Text style={styles.personMeta} numberOfLines={1}>
        {subtitle}
      </Text>
      {rating ? (
        <View style={styles.ratingRow}>
          {Array.from({ length: 5 }).map((_, index) => (
            <FontAwesome5
              key={index}
              name="star"
              solid
              size={9}
              color={colors.homeStar}
            />
          ))}
          <Text style={styles.ratingText}>{rating}</Text>
        </View>
      ) : null}
      {country ? <Text style={styles.country}>{country}</Text> : null}
    </Pressable>
  );
}

export const personCardWidth = cardWidth;

const styles = StyleSheet.create({
  personCard: {
    width: cardWidth,
  },
  personPhoto: {
    width: cardWidth,
    height: cardWidth,
    borderRadius: 16,
    marginBottom: 8,
    backgroundColor: colors.inputBackground,
  },
  photoUserBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoUserBadgePending: {
    backgroundColor: '#E8E8E8',
  },
  plusBadge: {
    position: 'absolute',
    right: 6,
    bottom: 14,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBadgePending: {
    backgroundColor: '#E8E8E8',
  },
  premiumMark: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.homeHeader,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectedBadge: {
    backgroundColor: colors.homeHeader,
  },
  personName: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  personMeta: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  ratingText: {
    marginLeft: 4,
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  country: {
    marginTop: 4,
    color: '#4A4A4A',
    fontSize: 11,
  },
});
