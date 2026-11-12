import React, { useState } from 'react';
import { View, Text, Pressable, Alert, Linking, StyleSheet } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import SearchBar from '../components/SearchBar';
import CategoryTabs from '../components/CategoryTabs';
import BackButton from '../components/BackButton';
import MapCanvas from '../components/MapCanvas';
import MapPin, { UserDot } from '../components/MapPin';
import PlaceSheet, { PLACE_SHEET_MIN_HEIGHT } from '../components/PlaceSheet';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { survivalMapData } from '../data/lifeInfo/survivalMap';
import { colors, fonts, emergencyColors as c } from '../theme';

// 이 화면은 PNG 기준 좌우 여백이 20 입니다. (theme.spacing.screenX 는 24)
const SCREEN_X = 20;
const SHEET_SIDE = 16;
const SHEET_BOTTOM = 16;

// 생활정보 > 자취생존맵
export default function SurvivalMapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { eyebrow, title, location, searchPlaceholder, userLocation, categories, places } =
    survivalMapData;

  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [selectedId, setSelectedId] = useState(null);
  const [query, setQuery] = useState('');

  const category = categories.find((cat) => cat.id === categoryId);
  const trimmed = query.trim();
  const visiblePlaces = (places[categoryId] ?? []).filter(
    (place) => !trimmed || place.name.includes(trimmed),
  );
  // 선택된 장소가 없거나 검색으로 사라졌으면 첫 번째 장소를 선택
  const selected = visiblePlaces.find((place) => place.id === selectedId) ?? visiblePlaces[0] ?? null;

  // 지도 영역 아래쪽은 탭 바 뒤의 연한 회색 띠 (PNG 와 동일)
  const bottomBand = TAB_BAR_HEIGHT + Math.max(insets.bottom, 12) + 10;

  const handleSelectCategory = (id) => {
    setCategoryId(id);
    setSelectedId(null);
  };

  // 뒤로 가기 (이전 기록이 없으면 생활정보 탭으로 이동)
  const handleBack = () => (navigation.canGoBack() ? navigation.goBack() : navigation.navigate('LifeInfo'));

  // 길찾기: 카카오맵 검색 링크로 연결합니다. (앱 안 길찾기가 정해지면 교체)
  const handleDirections = (place) => {
    const keyword = encodeURIComponent(place.address || place.name);
    Linking.openURL(`https://map.kakao.com/link/search/${keyword}`).catch(() =>
      Alert.alert('지도를 열 수 없어요', '잠시 후 다시 시도해 주세요.'),
    );
  };

  return (
    <View style={styles.container}>
      <View style={{ paddingTop: insets.top + 14, paddingHorizontal: SCREEN_X }}>
        <View style={styles.headerRow}>
          <BackButton onPress={handleBack} color={c.text} style={styles.backButton} />
          <View style={styles.headerTexts}>
            <Text style={styles.eyebrow}>{eyebrow}</Text>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{title}</Text>
              {/* 동네 선택 시트는 디자인이 아직 없어서 동작은 연결하지 않았습니다. */}
              <Pressable style={styles.chip} accessibilityRole="button" accessibilityLabel={location}>
                <MaterialCommunityIcons name="map-marker-outline" size={18} color={c.accent} />
                <Text style={styles.chipText}>{location}</Text>
                <Ionicons name="chevron-down" size={18} color={c.textSecondary} />
              </Pressable>
            </View>
          </View>
        </View>

        <View style={styles.searchWrap}>
          <SearchBar value={query} onChangeText={setQuery} placeholder={searchPlaceholder} />
        </View>

        <View style={styles.tabsWrap}>
          <CategoryTabs
            categories={categories}
            selectedId={categoryId}
            onSelect={handleSelectCategory}
          />
        </View>
      </View>

      <View style={[styles.mapArea, { marginBottom: bottomBand }]}>
        <MapCanvas style={StyleSheet.absoluteFill}>
          <UserDot x={userLocation.x} y={userLocation.y} />
          {visiblePlaces
            .filter((place) => place.id !== selected?.id)
            .map((place) => (
              <MapPin
                key={place.id}
                x={place.x}
                y={place.y}
                icon={category.icon}
                label={place.name}
                onPress={() => setSelectedId(place.id)}
              />
            ))}
          {selected ? (
            <MapPin
              x={selected.x}
              y={selected.y}
              icon={category.icon}
              label={selected.name}
              selected
              onPress={() => setSelectedId(selected.id)}
            />
          ) : null}
        </MapCanvas>

        {/* 현재 위치로 이동 (예시 지도라 동작은 연결하지 않았습니다) */}
        <Pressable
          style={styles.locate}
          accessibilityRole="button"
          accessibilityLabel="현재 위치로 이동"
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={24} color={c.text} />
        </Pressable>

        <View style={styles.scale} pointerEvents="none">
          <View style={styles.scaleBar} />
          <Text style={styles.scaleText}>100m</Text>
        </View>
        <Text style={styles.attribution} pointerEvents="none">
          예시 지도 · 장소 정보
        </Text>

        <PlaceSheet
          style={styles.sheet}
          title={`주변 ${category.label} 보기`}
          categoryLabel={category.label}
          place={selected}
          emptyText={
            trimmed
              ? `'${trimmed}'에 맞는 장소가 없어요.`
              : `이 주변 ${category.label} 정보를 준비 중이에요.`
          }
          onDirections={handleDirections}
        />
      </View>

      <View style={[styles.band, { height: bottomBand }]} pointerEvents="none" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
  },
  // 제목 줄(eyebrow 16 + 제목 34 의 가운데)에 화살표 높이를 맞춥니다.
  backButton: {
    marginTop: 19,
    marginRight: 6,
  },
  headerTexts: {
    flex: 1,
  },
  eyebrow: {
    fontFamily: fonts.regular,
    fontSize: 12,
    lineHeight: 16,
    color: c.textSecondary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    lineHeight: 34,
    color: c.text,
  },
  chip: {
    height: 24,
    marginTop: -2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipText: {
    marginLeft: 4,
    marginRight: 4,
    fontFamily: fonts.bold,
    fontSize: 14,
    lineHeight: 20,
    color: c.text,
  },
  searchWrap: {
    marginTop: 18,
  },
  tabsWrap: {
    marginTop: 16,
  },
  mapArea: {
    flex: 1,
    marginTop: 14,
  },
  locate: {
    position: 'absolute',
    top: 16,
    right: SCREEN_X,
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F2D3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  scale: {
    position: 'absolute',
    left: SCREEN_X,
    bottom: SHEET_BOTTOM + PLACE_SHEET_MIN_HEIGHT + 6,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  scaleBar: {
    width: 32,
    height: 6,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: c.textSecondary,
  },
  scaleText: {
    marginLeft: 6,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: c.textSecondary,
  },
  attribution: {
    position: 'absolute',
    right: SCREEN_X,
    bottom: SHEET_BOTTOM + PLACE_SHEET_MIN_HEIGHT + 6,
    fontFamily: fonts.regular,
    fontSize: 11,
    lineHeight: 14,
    color: c.textSecondary,
  },
  sheet: {
    position: 'absolute',
    left: SHEET_SIDE,
    right: SHEET_SIDE,
    bottom: SHEET_BOTTOM,
  },
  band: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: c.surface,
  },
});
