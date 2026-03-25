// shared.ts — theme, mock data, shared components
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text, TextInput, TouchableOpacity,
  View,
} from 'react-native';

// ─── THEME ────────────────────────────────────────────────────────────────────
export const T = {
  bg:          '#F5F7FA',
  white:       '#FFFFFF',
  surface:     '#FFFFFF',
  surfaceAlt:  '#EEF3FB',

  blue:        '#1A6BCC',
  blueDark:    '#124E99',
  blueLight:   '#E8F0FB',
  blueMid:     '#4A8FE0',

  good:        '#18A25B',
  goodBg:      '#E6F7EE',
  warn:        '#D97706',
  warnBg:      '#FEF3C7',
  danger:      '#DC2626',
  dangerBg:    '#FEE2E2',

  textPri:     '#111827',
  textSec:     '#6B7280',
  textMuted:   '#9CA3AF',

  border:      '#E4E8F0',
  borderFocus: '#1A6BCC',

  inputBg:     '#F9FAFB',
  radius:      12,
  radiusSm:    8,
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
export const TANKS = [
  { id: '1', name: 'Fish Tank 1', type: '20L · Freshwater', sensor: '#001', ph: 7.1, temp: 20, clarity: 90, status: 'GOOD' },
  
];

export const ACTIVITY = [
  { id: '1', tank: 'Fish Tank 1', time: '11:00AM, 28/03/26', event: 'Water Changed',    status: 'GOOD' },
  { id: '2', tank: 'Fish Tank 1', time: '7:00AM, 23/03/26',  event: 'Modified Sensors', status: 'GOOD' },
  { id: '3', tank: 'Fish Tank 1', time: '11:00AM, 28/03/26', event: 'Water Changed',    status: 'CRITICAL' },
  { id: '4', tank: 'Fish Tank 1', time: '7:00AM, 23/03/26',  event: 'Modified Sensors', status: 'CAUTION' },
  { id: '5', tank: 'Fish Tank 1', time: '11:00AM, 28/03/26', event: 'Water Changed',    status: 'GOOD' },
  { id: '6', tank: 'Fish Tank 1', time: '7:00AM, 23/03/26',  event: 'Modified Sensors', status: 'GOOD' },
];

export const REMINDERS = [
  { id: '1', tank: 'FISH TANK 1', schedule: '9:00PM, 30/03/26' },
  { id: '2', tank: 'FISH TANK 2', schedule: '7:00AM, 15/04/26' },
  { id: '3', tank: 'FISH TANK 3', schedule: '3:00PM, 01/04/26' },
];

// ─── SHARED COMPONENTS ────────────────────────────────────────────────────────
export function StatusBadge({ status, small }: { status: string; small?: boolean }) {
  const map: Record<string, { bg: string; fg: string; label: string }> = {
    GOOD:     { bg: T.goodBg,   fg: T.good,   label: 'Good' },
    CAUTION:  { bg: T.warnBg,   fg: T.warn,   label: 'Caution' },
    CRITICAL: { bg: T.dangerBg, fg: T.danger, label: 'Critical' },
  };
  const s = map[status] || map.GOOD;
  return (
    <View style={[
      sharedStyles.badge,
      { backgroundColor: s.bg },
      small && { paddingHorizontal: 6, paddingVertical: 2 },
    ]}>
      <Text style={[sharedStyles.badgeText, { color: s.fg }, small && { fontSize: 10 }]}>
        {s.label}
      </Text>
    </View>
  );
}

export function PrimaryButton({
  label, onPress, style,
}: { label: string; onPress: () => void; style?: object }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[sharedStyles.primaryBtn, style]}
      activeOpacity={0.8}>
      <Text style={sharedStyles.primaryBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function GhostButton({
  label, onPress, style,
}: { label: string; onPress: () => void; style?: object }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[sharedStyles.ghostBtn, style]}
      activeOpacity={0.7}>
      <Text style={sharedStyles.ghostBtnText}>{label}</Text>
    </TouchableOpacity>
  );
}

export function FormInput({
  label, ...props
}: { label?: string; [key: string]: any }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ marginBottom: 14 }}>
      {label && <Text style={sharedStyles.inputLabel}>{label}</Text>}
      <TextInput
        style={[sharedStyles.input, focused && sharedStyles.inputFocused]}
        placeholderTextColor={T.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        {...props}
      />
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  return <View style={[sharedStyles.card, style]}>{children}</View>;
}

export function ScreenHeader({
  title, subtitle, onBack, right,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
}) {
  return (
    <View style={sharedStyles.header}>
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        {onBack && (
          <TouchableOpacity onPress={onBack} style={{ marginRight: 12, padding: 4 }}>
            <Text style={{ color: T.blue, fontSize: 24, lineHeight: 26 }}>‹</Text>
          </TouchableOpacity>
        )}
        <View style={{ flex: 1 }}>
          <Text style={sharedStyles.headerTitle}>{title}</Text>
          {subtitle && <Text style={sharedStyles.headerSub}>{subtitle}</Text>}
        </View>
      </View>
      {right}
    </View>
  );
}

// ─── SHARED STYLES ────────────────────────────────────────────────────────────
export const sharedStyles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 44 : 56,
    paddingBottom: 14,
    backgroundColor: T.white,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    color: T.textPri,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSub: {
    color: T.textSec,
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  primaryBtn: {
    backgroundColor: T.blue,
    borderRadius: T.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.4,
  },
  ghostBtn: {
    backgroundColor: 'transparent',
    borderRadius: T.radiusSm,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: T.border,
  },
  ghostBtnText: {
    color: T.textSec,
    fontWeight: '600',
    fontSize: 15,
  },
  inputLabel: {
    color: T.textSec,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.6,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: T.inputBg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusSm,
    padding: 14,
    color: T.textPri,
    fontSize: 15,
  },
  inputFocused: {
    borderColor: T.borderFocus,
    backgroundColor: T.white,
  },
  card: {
    backgroundColor: T.white,
    borderRadius: T.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
  },
  selectBox: {
    backgroundColor: T.inputBg,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: T.radiusSm,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectText: {
    color: T.textPri,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default function SharedRoute() {
  return null;
}
