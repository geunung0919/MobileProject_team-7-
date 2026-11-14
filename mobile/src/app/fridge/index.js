
import React from 'react';
import { Text } from 'react-native';
import { router } from 'expo-router';

import ReferenceNotice from '../../features/fridge/components/ReferenceNotice';
import {
  Page,
  Card,
  Button,
  styles,
} from '../../features/fridge/components/UI';

import { useApp } from '../../features/fridge/state/AppProvider';
import {
  daysLeft,
  rankRecipes,
} from '../../features/fridge/domain/inventory.mjs';

import { recipes } from '../../features/fridge/data/seed';

export default function Home() {
  const { state } = useApp();

  const inventory = state.inventory;

  // 소비기한이 3일 이내인 재료
  const urgent = inventory.filter((item) => {
    const remaining = daysLeft(item.expiresAt);

    return remaining >= 0 && remaining <= 3;
  });

  // 기존 추천 알고리즘으로 레시피 순위 계산
  const rankedRecipes = rankRecipes(inventory, recipes);

  // 필요한 재료가 모두 있는 레시피만 추천
  const availableRecipes = rankedRecipes.filter(
    (recipe) => recipe.missing.length === 0
  );

  const best = availableRecipes[0] ?? null;

  return (
    <Page
      title="오늘은 무엇을 먹을까요?"
      subtitle="있는 재료로 한 끼, 버리는 재료는 줄이기."
    >
      <Text style={styles.muted}>
        현재 재고는 기기에 저장돼요.
        중앙 DB 동기화는 아직 연결 전이에요.
      </Text>

      <Button
        secondary
        title="재고 목록"
        onPress={() => router.push('/fridge/inventory')}
      />

      <Button
        secondary
        title="레시피 검색"
        onPress={() => router.push('/fridge/recipe')}
      />

      <Button
        secondary
        title="장보기"
        onPress={() => router.push('/fridge/shopping')}
      />

      <Button
        secondary
        title="식사 기록"
        onPress={() => router.push('/fridge/meal')}
      />

      <Button
        secondary
        title="소비 관리"
        onPress={() => router.push('/spending')}
      />

      <Button
        secondary
        title="통합 현황"
        onPress={() => router.push('/dashboard')}
      />

      <Card>
        <Text style={styles.label}>내 냉장고</Text>

        <Text>
          재고 {inventory.length}종 · 식사 기록 {state.meals.length}건
        </Text>

        <Button
          title="재고 등록"
          onPress={() => router.push('/fridge/inventory/new')}
        />
      </Card>

      <Card>
        <Text style={styles.label}>
          보관 참고일이 3일 이내인 재료
        </Text>

        {urgent.length > 0 ? (
          urgent.map((item) => (
            <Text key={item.id}>
              {item.name} · {item.quantity}
              {item.unit} · D-{daysLeft(item.expiresAt)}
            </Text>
          ))
        ) : (
          <Text style={styles.muted}>
            임박한 재료가 없어요.
          </Text>
        )}
      </Card>

      {best ? (
        <Card>
          <Text style={styles.label}>
            오늘의 추천 · {best.name}
          </Text>

          <Text style={styles.muted}>
            현재 보유한 재료만으로 만들 수 있는 레시피예요.
          </Text>

          <Button
            title="레시피 보기"
            onPress={() =>
              router.push(`/fridge/recipe/${best.id}`)
            }
          />
        </Card>
      ) : (
        <Card>
          <Text style={styles.label}>
            오늘의 추천 레시피
          </Text>

          <Text style={styles.muted}>
            현재 재료만으로 만들 수 있는 레시피가 없어요.
            재료를 추가하거나 레시피 검색에서
            부족한 재료를 확인해 보세요.
          </Text>

          <Button
            title="레시피 검색"
            onPress={() => router.push('/fridge/recipe')}
          />
        </Card>
      )}

      <ReferenceNotice />
    </Page>
  );
}
