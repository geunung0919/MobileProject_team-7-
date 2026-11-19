
import React, {
  useCallback,
  useState,
} from 'react';

import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';

import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../../../firebase/firebaseConfig';
import { listFridgeItems } from '../../../api/receiptApi';

import { useAppData } from '../store/AppDataContext';
import { colors, fonts, spacing } from '../theme';

export default function FridgeMealInventoryScreen({
  navigation,
  route,
}) {
  const insets = useSafeAreaInsets();

  const {
    sharedReceipts,
    sharedUid,
    refreshShared,
  } = useAppData();

  // 식사 기록 화면에서 전달받은 정보
  const mealId = route.params?.mealId ?? null;
  const mealName = route.params?.mealName ?? null;

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Firebase 서버에서 현재 재고 조회
  const loadInventory = useCallback(async () => {
    if (!sharedReceipts || !sharedUid) {
      setInventory([]);
      setLoading(false);
      setError(
        '냉장고를 사용하려면 로그인해 주세요.'
      );
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (auth.currentUser?.uid !== sharedUid) {
        throw new Error(
          '현재 로그인 계정을 확인해 주세요.'
        );
      }

      const result = await listFridgeItems(sharedUid);

      if (
        result?.success === false ||
        result?.possiblyTruncated ||
        !Array.isArray(result?.items)
      ) {
        throw new Error(
          '서버 재고를 완전히 조회하지 못했어요.'
        );
      }

      if (auth.currentUser?.uid !== sharedUid) {
        throw new Error(
          '조회 도중 로그인 계정이 변경됐어요.'
        );
      }

      const sortedItems = result.items
        .filter((item) => {
          const quantity = Number(item.quantity);

          return (
            item &&
            typeof item.id === 'string' &&
            item.id.length > 0 &&
            Number.isFinite(quantity) &&
            quantity > 0
          );
        })
        .sort((a, b) =>
          String(a.name || '').localeCompare(
            String(b.name || ''),
            'ko'
          )
        );

      setInventory(sortedItems);
    } catch (err) {
      setInventory([]);
      setError(
        err?.message ||
        '냉장고 재고를 불러오지 못했어요.'
      );
    } finally {
      setLoading(false);
    }
  }, [sharedReceipts, sharedUid]);

  // 이 화면에 다시 돌아올 때마다 재고 새로고침
  useFocusEffect(
    useCallback(() => {
      let active = true;

      const load = async () => {
        if (active) {
          await loadInventory();
        }
      };

      load();

      return () => {
        active = false;
      };
    }, [loadInventory])
  );

  const handleUse = (item) => {
    if (
      !sharedUid ||
      auth.currentUser?.uid !== sharedUid
    ) {
      setError('로그인 계정을 확인해 주세요.');
      return;
    }

    // 기존 Firebase 사용량 차감 화면을 재사용
    navigation.navigate('FridgeUse', {
      id: item.id,
      mealId,
      mealName,
    });
  };

  const handleRefresh = async () => {
    await loadInventory();

    if (
      sharedUid &&
      auth.currentUser?.uid === sharedUid
    ) {
      try {
        await refreshShared(sharedUid);
      } catch (err) {
        console.warn(
          '[MealInventory] 공용 재고 갱신 실패:',
          err?.message
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 18,
          paddingHorizontal: spacing.screenX,
          paddingBottom: insets.bottom + 70,
        }}
      >
        {/* 뒤로 가기 */}
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.back}
        >
          <Text style={styles.backText}>
            ← 식사 기록으로 돌아가기
          </Text>
        </Pressable>

        {/* 화면 제목 */}
        <Text style={styles.title}>
          사용한 식재료 차감
        </Text>

        <Text style={styles.subtitle}>
          요리에 사용한 식재료를 선택하고
          실제 사용량만큼 냉장고 재고를 줄여요.
        </Text>

        {/* 연결된 식사 기록 */}
        {!!mealName && (
          <View style={styles.mealCard}>
            <Text style={styles.cardLabel}>
              선택한 식사
            </Text>

            <Text style={styles.mealName}>
              {mealName}
            </Text>

            <Text style={styles.cardHint}>
              이 화면은 선택한 식사의 재료를
              차감하기 위한 화면이에요.
            </Text>
          </View>
        )}

        {/* 안내 */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeTitle}>
            재고 차감 안내
          </Text>

          <Text style={styles.noticeText}>
            재료를 선택하면 기존 사용량 차감 화면으로
            이동합니다.
          </Text>

          <Text style={styles.noticeText}>
            한 번에 하나의 식재료를 차감하며,
            저장 성공 후 냉장고 재고에 반영됩니다.
          </Text>

          <Text style={styles.noticeText}>
            식사 기록과 차감 내역의 자동 연결,
            재료 전량 사용 처리는 아직 지원하지 않아요.
          </Text>
        </View>

        {/* 재고 목록 헤더 */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            냉장고 식재료
          </Text>

          <Pressable
            disabled={loading}
            onPress={handleRefresh}
          >
            <Text style={styles.refreshText}>
              새로고침
            </Text>
          </Pressable>
        </View>

        {/* 로딩 */}
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator
              size="large"
              color={colors.green}
            />

            <Text style={styles.loadingText}>
              냉장고 재고를 불러오는 중...
            </Text>
          </View>
        ) : (
          <>
            {/* 오류 */}
            {!!error && (
              <View style={styles.errorBox}>
                <Text
                  style={styles.errorText}
                  accessibilityRole="alert"
                >
                  {error}
                </Text>

                <Pressable
                  onPress={handleRefresh}
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>
                    다시 시도
                  </Text>
                </Pressable>
              </View>
            )}

            {/* 빈 목록 */}
            {!error && inventory.length === 0 && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyTitle}>
                  등록된 식재료가 없어요.
                </Text>

                <Text style={styles.emptyText}>
                  냉장고에 식재료를 등록한 다음
                  사용량을 차감할 수 있어요.
                </Text>
              </View>
            )}

            {/* Firebase 재고 목록 */}
            {!error &&
              inventory.map((item) => (
                <View
                  key={item.id}
                  style={styles.itemCard}
                >
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>
                      {item.name}
                    </Text>

                    <Text style={styles.itemQuantity}>
                      현재 재고: {item.quantity}
                      {item.unit}
                    </Text>

                    <Text style={styles.itemMeta}>
                      {item.expiresAt
                        ? `기한: ${item.expiresAt}`
                        : '기한 미입력'}
                    </Text>
                  </View>

                  <Pressable
                    style={styles.useButton}
                    onPress={() => handleUse(item)}
                  >
                    <Text style={styles.useButtonText}>
                      사용량 차감
                    </Text>
                  </Pressable>
                </View>
              ))}
          </>
        )}

        <Text style={styles.footerNotice}>
          사용한 양은 저장하면 냉장고 재고에서 빠져요.
          식사 기록만 저장하거나 삭제해도 냉장고 재고가
          자동 변경되지는 않습니다.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  back: {
    marginBottom: 22,
  },

  backText: {
    fontFamily: fonts.medium,
    color: colors.green,
    fontSize: 15,
  },

  title: {
    fontFamily: fonts.bold,
    fontSize: 26,
    color: colors.textPrimary,
  },

  subtitle: {
    marginTop: 10,
    marginBottom: 22,
    fontFamily: fonts.regular,
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  mealCard: {
    backgroundColor: colors.heroBg,
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
  },

  cardLabel: {
    fontFamily: fonts.medium,
    color: colors.textSecondary,
    fontSize: 13,
  },

  mealName: {
    marginTop: 6,
    fontFamily: fonts.bold,
    color: colors.green,
    fontSize: 21,
  },

  cardHint: {
    marginTop: 10,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 19,
  },

  noticeBox: {
    borderRadius: 16,
    padding: 17,
    backgroundColor: colors.cardBg,
    marginBottom: 26,
  },

  noticeTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 16,
    marginBottom: 10,
  },

  noticeText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginBottom: 6,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },

  sectionTitle: {
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    fontSize: 20,
  },

  refreshText: {
    fontFamily: fonts.medium,
    color: colors.green,
    fontSize: 14,
  },

  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 12,
  },

  loadingText: {
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 14,
  },

  errorBox: {
    backgroundColor: colors.warnBg,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
  },

  errorText: {
    fontFamily: fonts.medium,
    color: colors.warnText,
    fontSize: 14,
    lineHeight: 21,
  },

  retryButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 10,
  },

  retryText: {
    fontFamily: fonts.bold,
    color: colors.green,
  },

  emptyBox: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },

  emptyTitle: {
    fontFamily: fonts.bold,
    fontSize: 17,
    color: colors.textPrimary,
  },

  emptyText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    textAlign: 'center',
    color: colors.textSecondary,
  },

  itemCard: {
    backgroundColor: colors.cardBg,
    padding: 17,
    borderRadius: 16,
    marginBottom: 12,
    gap: 14,
  },

  itemInfo: {
    gap: 6,
  },

  itemName: {
    fontFamily: fonts.bold,
    fontSize: 18,
    color: colors.textPrimary,
  },

  itemQuantity: {
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.textPrimary,
  },

  itemMeta: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: colors.textSecondary,
  },

  useButton: {
    backgroundColor: colors.green,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },

  useButtonText: {
    fontFamily: fonts.bold,
    color: colors.white,
    fontSize: 15,
  },

  footerNotice: {
    marginTop: 24,
    fontFamily: fonts.regular,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 20,
  },
});
