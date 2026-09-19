import { FontAwesome5 } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { UserProfile } from '../data/playerProfiles';
import { colors } from '../theme/colors';
import { useBrandColors } from '../theme/useBrandColors';

type ProfileContentProps = {
  profile: UserProfile;
  photoBadge?: ReactNode;
  nameAccessory?: ReactNode;
  footer?: ReactNode;
};

export function ProfileContent({
  profile,
  photoBadge,
  nameAccessory,
  footer,
}: ProfileContentProps) {
  const brand = useBrandColors();
  return (
    <View style={styles.wrap}>
      <View style={styles.identity}>
        <View>
          <Image source={profile.photo} style={styles.avatar} />
          {photoBadge}
        </View>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{profile.name}</Text>
          {nameAccessory}
        </View>
        {profile.email ? (
          <Text style={styles.email}>{profile.email}</Text>
        ) : null}
        <View style={[styles.roleBadge, { backgroundColor: brand.soft }]}>
          <Text style={[styles.roleBadgeText, { color: brand.header }]}>
            {profile.kind === 'player'
              ? 'Jugador'
              : profile.kind === 'club'
                ? 'Club'
                : 'Representante'}
          </Text>
        </View>
        <View style={styles.locationRow}>
          <FontAwesome5 name="map-marker-alt" size={11} color="#8A8A8A" />
          <Text style={styles.locationText}>{profile.location}</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        {profile.stats.map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: brand.header }]}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.fields}>
        {profile.fields.map((field) => (
          <View key={field.label} style={styles.fieldRow}>
            <View style={styles.fieldIcon}>
              <FontAwesome5
                name={field.icon}
                size={14}
                color={brand.header}
              />
            </View>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue} numberOfLines={1}>
              {field.value}
            </Text>
          </View>
        ))}
      </View>

      <Text style={styles.aboutTitle}>Sobre mí</Text>
      <View style={styles.aboutBox}>
        <Text style={styles.aboutText}>{profile.about}</Text>
      </View>

      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
  },
  identity: {
    alignItems: 'center',
    marginBottom: 22,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.inputBackground,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 14,
  },
  name: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  email: {
    marginTop: 4,
    color: '#8A8A8A',
    fontSize: 13,
  },
  roleBadge: {
    marginTop: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E7F8DC',
  },
  roleBadgeText: {
    color: colors.homeHeader,
    fontSize: 11,
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  locationText: {
    color: '#8A8A8A',
    fontSize: 12,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 18,
    backgroundColor: '#F3F6F4',
    borderRadius: 18,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: colors.homeHeader,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    marginTop: 2,
    color: '#8A8A8A',
    fontSize: 11,
    fontWeight: '600',
  },
  fields: {
    gap: 2,
    marginBottom: 18,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  fieldIcon: {
    width: 18,
    alignItems: 'center',
  },
  fieldLabel: {
    flex: 1,
    color: '#8A8A8A',
    fontSize: 13,
  },
  fieldValue: {
    maxWidth: '48%',
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'right',
  },
  aboutTitle: {
    marginBottom: 10,
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  aboutBox: {
    padding: 14,
    backgroundColor: '#F3F6F4',
    borderRadius: 16,
  },
  aboutText: {
    color: '#4A4A4A',
    fontSize: 14,
    lineHeight: 21,
  },
});
