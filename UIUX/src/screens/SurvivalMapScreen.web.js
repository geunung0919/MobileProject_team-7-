import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BackHeader from '../components/BackHeader';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { colors, fonts } from '../theme';
import { searchNearbyPlaces, searchPlacesByText } from '../../../api/placeApi';
import { useAppData } from '../store/AppDataContext';

// 웹(아이폰 Safari·PC) 용 생활지도. 앱의 지도(react-native-maps)는 웹에서 동작하지 않아서,
// 같은 장소 검색 API 결과를 목록 + 구글 지도 화면(키 없이 쓰는 embed)으로 보여 줍니다.
const DEFAULT_LOCATION = { latitude: 36.8002, longitude: 127.0749, label: '천안' };
const CATEGORIES = [
  { id: 'restaurant', label: '음식점', icon: 'silverware-fork-knife' },
  { id: 'cafe', label: '카페', icon: 'coffee-outline' },
  { id: 'convenience', label: '편의점', icon: 'store-outline' },
  { id: 'mart', label: '마트', icon: 'cart-outline' },
  { id: 'hospital', label: '병원', icon: 'hospital-box-outline' },
  { id: 'laundry', label: '세탁소', icon: 'washing-machine' },
];

const distanceText = (m) => (typeof m !== 'number' ? '' : m < 1000 ? `${m}m` : `${(m / 1000).toFixed(1)}km`);

function MapFrame({ latitude, longitude, query }) {
  const q = query ? encodeURIComponent(query) : `${latitude},${longitude}`;
  const src = `https://maps.google.com/maps?q=${q}&ll=${latitude},${longitude}&z=15&hl=ko&output=embed`;
  return (
    <View style={styles.map}>
      {React.createElement('iframe', {
        title: '생활지도', src, loading: 'lazy', referrerPolicy: 'no-referrer-when-downgrade',
        style: { border: 0, width: '100%', height: '100%' },
      })}
    </View>
  );
}

export default function SurvivalMapScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { sharedReceipts, sharedUid } = useAppData();
  const [location, setLocation] = useState(null);
  const [locationNote, setLocationNote] = useState('');
  const [categoryId, setCategoryId] = useState('convenience');
  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [places, setPlaces] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestRef = useRef(0);
  const needsLogin = sharedReceipts && !sharedUid;

  useEffect(() => {
    const fallback = (why) => {
      setLocation(DEFAULT_LOCATION);
      setLocationNote(`${why} 기본 위치(${DEFAULT_LOCATION.label}) 기준으로 보여 드려요.`);
    };
    const geo = typeof navigator !== 'undefined' ? navigator.geolocation : null;
    // 아이폰 Safari 는 https 주소(--tunnel)에서만 현재 위치를 줍니다.
    if (!geo || (typeof window !== 'undefined' && window.isSecureContext === false)) {
      fallback('이 주소에서는 현재 위치를 쓸 수 없어');
      return undefined;
    }
    let done = false;
    const timer = setTimeout(() => { if (!done) { done = true; fallback('현재 위치를 확인하지 못해'); } }, 8000);
    geo.getCurrentPosition(
      (pos) => { if (done) return; done = true; clearTimeout(timer);
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, label: '현재 위치' }); setLocationNote(''); },
      () => { if (done) return; done = true; clearTimeout(timer); fallback('위치 권한이 없어'); },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 300000 },
    );
    return () => { done = true; clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!location || needsLogin) return;
    const id = ++requestRef.current;
    const run = submitted
      ? searchPlacesByText(location.latitude, location.longitude, submitted)
      : searchNearbyPlaces(location.latitude, location.longitude, categoryId);
    run.then((rows) => { if (id === requestRef.current) setPlaces(Array.isArray(rows) ? rows : []); })
      .catch((e) => { if (id === requestRef.current) { setPlaces([]); setError(e?.message || '장소를 검색하지 못했어요.'); } })
      .finally(() => { if (id === requestRef.current) setLoading(false); });
  }, [location, categoryId, submitted, needsLogin]);

  // 검색 조건이 바뀌기 전에 이전 결과·오류를 정리합니다 (실제 검색은 아래 effect 가 합니다).
  const startSearch = () => { setLoading(true); setError(''); setSelected(null); };
  const submit = () => {
    const text = keyword.trim();
    if (text && text.length < 2) { setError('검색어는 2글자 이상 입력해 주세요.'); return; }
    if (text === submitted) return;
    startSearch();
    setSubmitted(text);
  };
  const open = (url) => Linking.openURL(url).catch(() => setError('지도를 열지 못했어요.'));
  const directions = (place) => open('https://www.google.com/maps/dir/?api=1'
    + (location ? `&origin=${location.latitude},${location.longitude}` : '')
    + `&destination=${place.latitude},${place.longitude}&destination_place_id=${encodeURIComponent(place.id || '')}&travelmode=walking`);

  const focus = selected || location || DEFAULT_LOCATION;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + 14, paddingHorizontal: 20, paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40 }}
      keyboardShouldPersistTaps="handled"
    >
      <BackHeader title="생활지도" subtitle="내 주변 생활 장소를 찾아보세요." onBack={() => navigation.navigate('LifeInfo')} />

      <View style={styles.search}>
        <MaterialCommunityIcons name="magnify" size={22} color={colors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          value={keyword}
          onChangeText={setKeyword}
          onSubmitEditing={submit}
          placeholder="장소 이름 검색 (예: 다이소)"
          placeholderTextColor={colors.placeholder}
          returnKeyType="search"
          accessibilityLabel="장소 이름 검색"
        />
        {submitted ? (
          <Pressable accessibilityRole="button" accessibilityLabel="검색 지우기" hitSlop={10} onPress={() => { setKeyword(''); startSearch(); setSubmitted(''); }}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.placeholder} />
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" accessibilityLabel="검색" hitSlop={10} onPress={submit}>
            <Text style={styles.searchButton}>검색</Text>
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {CATEGORIES.map((cat) => {
          const active = !submitted && cat.id === categoryId;
          return (
            <Pressable key={cat.id} accessibilityRole="button" accessibilityState={{ selected: active }}
              onPress={() => { if (active) return; startSearch(); setSubmitted(''); setKeyword(''); setCategoryId(cat.id); }}
              style={[styles.chip, active && styles.chipActive]}>
              <MaterialCommunityIcons name={cat.icon} size={16} color={active ? colors.white : colors.textPrimary} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <MapFrame latitude={focus.latitude} longitude={focus.longitude} query={selected ? `${selected.name} ${selected.address || ''}`.trim() : ''} />
      {locationNote ? <Text style={styles.note}>{locationNote}</Text> : null}

      {needsLogin ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>로그인하면 주변 장소를 검색할 수 있어요.</Text>
          <Pressable accessibilityRole="button" style={styles.loginButton} onPress={() => navigation.navigate('SharedLogin')}>
            <Text style={styles.loginText}>로그인</Text>
          </Pressable>
        </View>
      ) : null}

      {!needsLogin && (loading || !location) ? (
        <View style={styles.loading}><ActivityIndicator color={colors.green} /><Text style={styles.note}>{location ? '장소를 찾는 중…' : '위치를 확인하는 중…'}</Text></View>
      ) : null}
      {error ? <Text accessibilityRole="alert" style={styles.error}>{error}</Text> : null}

      {!needsLogin && !loading && location && !error ? (
        <Text style={styles.count}>{submitted ? `'${submitted}' 검색 결과` : `${location.label} 주변 ${CATEGORIES.find((c) => c.id === categoryId)?.label}`} {places.length}개</Text>
      ) : null}
      {!needsLogin && !loading && location && !error && places.length === 0 ? (
        <Text style={styles.note}>검색 결과가 없어요. 다른 종류나 검색어로 찾아보세요.</Text>
      ) : null}

      {places.map((place) => {
        const active = selected?.id === place.id;
        return (
          <View key={place.id} style={[styles.card, active && styles.cardActive]}>
            <Pressable accessibilityRole="button" onPress={() => setSelected(active ? null : place)}>
            <View style={styles.cardTop}>
              <Text style={styles.name} numberOfLines={1}>{place.name}</Text>
              {place.openNow === true ? <Text style={styles.open}>영업 중</Text> : place.openNow === false ? <Text style={styles.closed}>영업 종료</Text> : null}
            </View>
            {place.address ? <Text style={styles.address} numberOfLines={2}>{place.address}</Text> : null}
            <Text style={styles.meta}>
              {[distanceText(place.distance), place.rating ? `★ ${place.rating}${place.reviewCount ? ` (${place.reviewCount})` : ''}` : ''].filter(Boolean).join(' · ')}
            </Text>
            </Pressable>
            <View style={styles.actions}>
              <Pressable accessibilityRole="button" onPress={() => directions(place)} style={styles.action}>
                <MaterialCommunityIcons name="directions" size={16} color={colors.green} />
                <Text style={styles.actionText}>길찾기</Text>
              </Pressable>
              {place.phone ? (
                <Pressable accessibilityRole="button" onPress={() => open(`tel:${String(place.phone).replace(/[^0-9+]/g, '')}`)} style={styles.action}>
                  <MaterialCommunityIcons name="phone" size={16} color={colors.green} />
                  <Text style={styles.actionText}>전화</Text>
                </Pressable>
              ) : null}
              <Pressable accessibilityRole="button" onPress={() => setSelected(active ? null : place)} style={styles.hintButton}>
                <Text style={styles.hint}>{active ? '지도에 표시 중' : '지도에 보기'}</Text>
              </Pressable>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.cardBg, borderRadius: 16, paddingHorizontal: 14, height: 50 },
  searchInput: { flex: 1, fontFamily: fonts.regular, fontSize: 15, color: colors.textPrimary, outlineStyle: 'none' },
  searchButton: { fontFamily: fonts.bold, color: colors.green },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: colors.cardBg },
  chipActive: { backgroundColor: colors.green },
  chipText: { fontFamily: fonts.medium, color: colors.textPrimary },
  chipTextActive: { color: colors.white },
  map: { height: 260, borderRadius: 20, overflow: 'hidden', backgroundColor: colors.heroBg },
  note: { marginTop: 8, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  notice: { marginTop: 16, padding: 16, borderRadius: 16, backgroundColor: colors.heroBg, gap: 10 },
  noticeText: { fontFamily: fonts.medium, color: colors.textPrimary },
  loginButton: { alignSelf: 'flex-start', backgroundColor: colors.green, borderRadius: 12, paddingHorizontal: 18, paddingVertical: 10 },
  loginText: { fontFamily: fonts.bold, color: colors.white },
  loading: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 },
  error: { marginTop: 12, color: colors.warnText, fontFamily: fonts.medium },
  count: { marginTop: 18, marginBottom: 6, fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  card: { marginTop: 10, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: colors.divider, backgroundColor: colors.white },
  cardActive: { borderColor: colors.green, backgroundColor: colors.heroBg },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.textPrimary },
  open: { fontFamily: fonts.medium, fontSize: 12, color: colors.green },
  closed: { fontFamily: fonts.medium, fontSize: 12, color: colors.warnText },
  address: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  meta: { marginTop: 4, fontFamily: fonts.regular, fontSize: 13, color: colors.textSecondary },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, backgroundColor: colors.badgeBg },
  actionText: { fontFamily: fonts.bold, fontSize: 13, color: colors.green },
  hintButton: { marginLeft: 'auto', paddingVertical: 6 },
  hint: { fontFamily: fonts.regular, fontSize: 12, color: colors.placeholder },
});
