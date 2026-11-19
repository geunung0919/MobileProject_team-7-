
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';

import Text from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { auth } from '../../../firebase/firebaseConfig';
import { listFridgeItems } from '../../../api/receiptApi';
import { useAppData } from '../store/AppDataContext';
import BackHeader from '../components/BackHeader';
import { colors, fonts, spacing } from '../theme';

// 한국 날짜 기준 YYYY-MM-DD
function getKoreanToday() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const get = (type) =>
    parts.find((part) => part.type === type)?.value;

  return `${get('year')}-${get('month')}-${get('day')}`;
}

// 날짜를 YYYY-MM-DD로 변환
function normalizeDate(value) {
  if (!value) return null;

  if (typeof value === 'object') {
    if (typeof value.toDate === 'function') {
      return normalizeDate(value.toDate());
    }

    if (typeof value.seconds === 'number') {
      return normalizeDate(new Date(value.seconds * 1000));
    }
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }

  if (typeof value !== 'string') return null;

  const text = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    const [year, month, day] = text.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    if (
      date.getUTCFullYear() === year &&
      date.getUTCMonth() + 1 === month &&
      date.getUTCDate() === day
    ) {
      return text;
    }

    return null;
  }

  const timestamp = Date.parse(text);

  if (Number.isNaN(timestamp)) return null;

  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(timestamp));
}

// 날짜 차이 계산 (시각 차이로 인한 오류 방지)
function getDaysLeft(expiry, today) {
  if (!expiry) return null;

  const expiryTime = Date.parse(`${expiry}T00:00:00Z`);
  const todayTime = Date.parse(`${today}T00:00:00Z`);

  if (
    Number.isNaN(expiryTime) ||
    Number.isNaN(todayTime)
  ) {
    return null;
  }

  return Math.round(
    (expiryTime - todayTime) / 86400000
  );
}

function getStatus(daysLeft) {
  if (daysLeft === null) return 'unknown';
  if (daysLeft < 0) return 'expired';
  if (daysLeft === 0) return 'today';
  if (daysLeft <= 3) return 'soon';
  return 'normal';
}

function getDdayText(daysLeft) {
  if (daysLeft === null) return '기한 미입력';
  if (daysLeft === 0) return 'D-Day';
  if (daysLeft > 0) return `D-${daysLeft}`;
  return `D+${Math.abs(daysLeft)}`;
}

function formatQuantity(item) {
  const quantity = item.quantity;
  const unit = item.unit || '개';

  if (
    quantity === null ||
    quantity === undefined ||
    quantity === ''
  ) {
    return '수량 미입력';
  }

  const number = Number(quantity);

  if (Number.isFinite(number)) {
    return `${number.toLocaleString('ko-KR')}${unit}`;
  }

  return `${quantity}${unit}`;
}

const STATUS = {
  expired: {
    title: '소비기한 만료',
    description: '소비기한이 지난 식재료예요.',
    color: colors.expired,
    background: colors.dangerBg,
  },
  today: {
    title: '오늘까지',
    description: '오늘이 소비기한인 식재료예요.',
    color: colors.warnText,
    background: colors.warnBg,
  },
  soon: {
    title: '소비기한 임박',
    description: '3일 이내에 소비기한이 도래해요.',
    color: '#CA8A04',
    background: '#FEFCE8',
  },
  normal: {
    title: '정상',
    description: '소비기한이 4일 이상 남았어요.',
    color: colors.green,
    background: colors.heroBg,
  },
  unknown: {
    title: '기한 미입력',
    description: '소비기한을 등록하지 않은 식재료예요.',
    color: colors.textSecondary,
    background: colors.calmBg,
  },
};

const STATUS_ORDER = [
  'expired',
  'today',
  'soon',
  'normal',
  'unknown',
];

function SummaryCard({ title, count, color }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={[styles.summaryCount, { color }]}>
        {count}
      </Text>
      <Text style={styles.summaryTitle}>{title}</Text>
    </View>
  );
}

function ItemCard({ item }) {
  const status = STATUS[item.status];

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemTop}>
        <Text style={styles.itemName}>
          {item.name || '이름 없는 식재료'}
        </Text>

        <View
          style={[
            styles.ddayBadge,
            { backgroundColor: status.background },
          ]}
        >
          <Text
            style={[
              styles.ddayText,
              { color: status.color },
            ]}
          >
            {getDdayText(item.daysLeft)}
          </Text>
        </View>
      </View>

      <Text style={styles.itemDetail}>
        남은 수량: {formatQuantity(item)}
      </Text>

      <Text style={styles.itemDetail}>
        소비기한: {item.expiryDate || '미입력'}
      </Text>

      {item.status === 'expired' && (
        <Text style={styles.warningText}>
          소비기한이 지났어요. 상태를 확인해 주세요.
        </Text>
      )}

      {item.status === 'today' && (
        <Text style={styles.todayText}>
          오늘이 소비기한이에요.
        </Text>
      )}
    </View>
  );
}

export default function FridgeExpiryAlertScreen({
  navigation,
}) {
  const insets = useSafeAreaInsets();

  const {
    sharedUid,
    sharedReceipts,
  } = useAppData();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [today, setToday] = useState(getKoreanToday());

  const requestRef = useRef(0);

  const loadItems = useCallback(
    async (isRefresh = false) => {
      const requestId = ++requestRef.current;

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError('');
      setToday(getKoreanToday());

      try {
        if (!sharedUid) {
          throw new Error(
            '로그인 사용자 정보를 확인할 수 없어요.'
          );
        }

        if (auth.currentUser?.uid !== sharedUid) {
          throw new Error(
            '현재 로그인 계정과 냉장고 계정이 일치하지 않아요.'
          );
        }

        if (!sharedReceipts) {
          throw new Error(
            '공유 냉장고가 활성화되지 않았어요.'
          );
        }

        const result = await listFridgeItems(sharedUid);

        if (requestId !== requestRef.current) return;

        if (!result || !Array.isArray(result.items)) {
          throw new Error(
            '서버에서 올바른 냉장고 목록을 받지 못했어요.'
          );
        }

        if (result.possiblyTruncated) {
          throw new Error(
            '재고 목록 일부가 누락될 수 있어요. 전체 목록을 확인할 수 없어 표시하지 않았어요.'
          );
        }

        setItems(result.items);
      } catch (err) {
        if (requestId !== requestRef.current) return;

        setError(
          err?.message ||
            '냉장고 재고를 불러오지 못했어요.'
        );

        // 오류 발생 시 이전 데이터가 최신 데이터처럼
        // 보이지 않도록 초기화합니다.
        setItems([]);
      } finally {
        if (requestId === requestRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [sharedUid, sharedReceipts]
  );

  // 화면 진입 또는 복귀 시 서버 재고 다시 조회
  useFocusEffect(
    useCallback(() => {
      loadItems();

      return () => {
        requestRef.current += 1;
      };
    }, [loadItems])
  );

  const groupedItems = useMemo(() => {
    const groups = {
      expired: [],
      today: [],
      soon: [],
      normal: [],
      unknown: [],
    };

    items.forEach((item, index) => {
      // 재고가 0 이하인 품목은 알림 대상에서 제외
      if (
        item.quantity !== null &&
        item.quantity !== undefined &&
        item.quantity !== '' &&
        Number.isFinite(Number(item.quantity)) &&
        Number(item.quantity) <= 0
      ) {
        return;
      }

      const expiryDate = normalizeDate(item.expiresAt);
      const daysLeft = getDaysLeft(expiryDate, today);
      const status = getStatus(daysLeft);

      groups[status].push({
        ...item,
        displayKey: `${item.id || 'item'}-${index}`,
        expiryDate,
        daysLeft,
        status,
      });
    });

    STATUS_ORDER.forEach((status) => {
      groups[status].sort((a, b) => {
        if (a.daysLeft === null) {
          return a.name?.localeCompare(b.name || '', 'ko') || 0;
        }

        if (a.daysLeft !== b.daysLeft) {
          return a.daysLeft - b.daysLeft;
        }

        return (a.name || '').localeCompare(
          b.name || '',
          'ko'
        );
      });
    });

    return groups;
  }, [items, today]);

  const counts = useMemo(() => {
    const count = {};

    STATUS_ORDER.forEach((status) => {
      count[status] = groupedItems[status].length;
    });

    count.total = STATUS_ORDER.reduce(
      (sum, status) => sum + count[status],
      0
    );

    count.attention =
      count.expired + count.today + count.soon;

    return count;
  }, [groupedItems]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) + 14 }]}>
        <BackHeader
          title="소비기한 알림"
          subtitle="기한이 가까운 식재료부터 챙겨요."
          onBack={() => navigation.goBack()}
        />
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator
            size="large"
            color={colors.green}
          />
          <Text style={styles.loadingText}>
            냉장고 재고를 확인하고 있어요.
          </Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.content,
            {
              paddingBottom: Math.max(insets.bottom, 20) + 24,
            },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadItems(true)}
            />
          }
        >
          <View style={styles.introCard}>
            <Text style={styles.introTitle}>
              냉장고 소비기한 관리
            </Text>

            <Text style={styles.introDescription}>
              등록된 식재료의 소비기한을 확인하고
              필요한 재료부터 관리해 보세요.
            </Text>

            <Text style={styles.todayLabel}>
              확인 기준일: {today}
            </Text>
          </View>

          {!!error && (
            <View style={styles.errorCard}>
              <Text style={styles.errorTitle}>
                재고를 불러오지 못했어요.
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <Pressable
                style={styles.retryButton}
                onPress={() => loadItems()}
              >
                <Text style={styles.retryText}>
                  다시 시도
                </Text>
              </Pressable>
            </View>
          )}

          {!error && (
            <>
              <View style={styles.summaryGrid}>
                <SummaryCard
                  title="전체"
                  count={counts.total}
                  color={colors.textPrimary}
                />

                <SummaryCard
                  title="관리 필요"
                  count={counts.attention}
                  color={colors.expired}
                />

                <SummaryCard
                  title="정상"
                  count={counts.normal}
                  color={colors.green}
                />

                <SummaryCard
                  title="기한 미입력"
                  count={counts.unknown}
                  color={colors.textSecondary}
                />
              </View>

              {counts.attention > 0 ? (
                <View style={styles.attentionCard}>
                  <Text style={styles.attentionTitle}>
                    확인이 필요한 식재료가 {counts.attention}개 있어요.
                  </Text>
                  <Text style={styles.attentionDescription}>
                    소비기한이 지났거나 3일 이내에 도래하는
                    식재료를 확인해 주세요.
                  </Text>
                </View>
              ) : (
                <View style={styles.safeCard}>
                  <Text style={styles.safeText}>
                    현재 소비기한이 임박하거나 지난 식재료가 없어요.
                  </Text>
                </View>
              )}

              {counts.total === 0 && (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>
                    표시할 냉장고 재고가 없어요.
                  </Text>

                  <Text style={styles.emptyText}>
                    냉장고에 식재료를 등록하면 소비기한에
                    따라 자동으로 분류해 드려요.
                  </Text>
                </View>
              )}

              {STATUS_ORDER.map((statusKey) => {
                const status = STATUS[statusKey];
                const sectionItems = groupedItems[statusKey];

                if (sectionItems.length === 0) return null;

                return (
                  <View
                    key={statusKey}
                    style={styles.section}
                  >
                    <View style={styles.sectionHeader}>
                      <View
                        style={[
                          styles.sectionDot,
                          {
                            backgroundColor: status.color,
                          },
                        ]}
                      />

                      <Text style={styles.sectionTitle}>
                        {status.title}
                      </Text>

                      <Text style={styles.sectionCount}>
                        {sectionItems.length}개
                      </Text>
                    </View>

                    <Text style={styles.sectionDescription}>
                      {status.description}
                    </Text>

                    {sectionItems.map((item) => (
                      <ItemCard
                        key={item.displayKey}
                        item={item}
                      />
                    ))}
                  </View>
                );
              })}

              <View style={styles.noticeCard}>
                <Text style={styles.noticeTitle}>
                  소비기한 안내
                </Text>

                <Text style={styles.noticeText}>
                  이 화면은 서버에 저장된 소비기한을
                  기준으로 표시합니다.
                </Text>

                <Text style={styles.noticeText}>
                  소비기한이 지나도 식재료가 자동으로
                  삭제되거나 차감되지는 않습니다.
                </Text>

                <Text style={styles.noticeText}>
                  실제 섭취 가능 여부는 보관 상태와
                  식품 상태를 함께 확인해야 합니다.
                </Text>

                <Text style={styles.noticeText}>
                  현재는 앱 내부 조회 기능이며,
                  휴대전화 푸시 알림은 발송하지 않습니다.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  header: {
    paddingHorizontal: spacing.screenX,
    backgroundColor: colors.background,
  },





  scroll: {
    flex: 1,
  },

  content: {
    padding: 16,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 14,
    padding: 24,
  },

  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },

  introCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  introTitle: {
    fontSize: 21,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 10,
  },

  introDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.textSecondary,
  },

  todayLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 12,
  },

  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 8,
  },

  summaryCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  summaryCount: {
    fontSize: 28,
    fontFamily: fonts.bold,
    marginBottom: 7,
  },

  summaryTitle: {
    fontSize: 13,
    color: colors.textSecondary,
    fontFamily: fonts.medium,
  },

  attentionCard: {
    backgroundColor: colors.warnBg,
    padding: 17,
    borderRadius: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: colors.overdueBorder,
  },

  attentionTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.warnText,
    marginBottom: 7,
  },

  attentionDescription: {
    fontSize: 13,
    color: colors.warnText,
    lineHeight: 20,
  },

  safeCard: {
    backgroundColor: colors.heroBg,
    padding: 17,
    borderRadius: 14,
    marginBottom: 22,
  },

  safeText: {
    color: colors.green,
    fontSize: 14,
    lineHeight: 21,
    fontFamily: fonts.medium,
  },

  section: {
    marginBottom: 24,
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },

  sectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 9,
  },

  sectionTitle: {
    fontSize: 17,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },

  sectionCount: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 8,
  },

  sectionDescription: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },

  itemCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.divider,
  },

  itemTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 10,
  },

  itemName: {
    flex: 1,
    fontSize: 16,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
  },

  ddayBadge: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  ddayText: {
    fontSize: 13,
    fontFamily: fonts.bold,
  },

  itemDetail: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 5,
  },

  warningText: {
    fontSize: 12,
    color: colors.expired,
    marginTop: 8,
    fontFamily: fonts.medium,
  },

  todayText: {
    fontSize: 12,
    color: colors.warnText,
    marginTop: 8,
    fontFamily: fonts.medium,
  },

  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },

  emptyTitle: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 9,
  },

  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
  },

  noticeCard: {
    backgroundColor: colors.calmBg,
    borderRadius: 14,
    padding: 18,
    marginTop: 4,
  },

  noticeTitle: {
    fontSize: 14,
    fontFamily: fonts.bold,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  noticeText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 7,
  },

  errorCard: {
    backgroundColor: colors.dangerBg,
    borderRadius: 14,
    padding: 18,
    marginBottom: 18,
  },

  errorTitle: {
    color: colors.expired,
    fontSize: 15,
    fontFamily: fonts.bold,
    marginBottom: 8,
  },

  errorText: {
    color: colors.expired,
    fontSize: 13,
    lineHeight: 20,
  },

  retryButton: {
    backgroundColor: colors.expired,
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 15,
  },

  retryText: {
    color: colors.white,
    fontFamily: fonts.bold,
    fontSize: 14,
  },
});
