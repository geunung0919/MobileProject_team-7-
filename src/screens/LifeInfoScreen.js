import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScreenHeader from '../components/ScreenHeader';
import FeatureCard from '../components/FeatureCard';
import SectionTitle from '../components/SectionTitle';
import MenuRow from '../components/MenuRow';
import { TAB_BAR_HEIGHT } from '../components/TabBar';
import { lifeInfoData } from '../data/lifeInfo/lifeInfo';
import { colors, spacing } from '../theme';

export default function LifeInfoScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { subtitle, aiManager, survivalMap, sectionTitle, menus } = lifeInfoData;

  // 메뉴를 눌렀을 때 이동. 아직 화면이 없는 메뉴는 비워 둡니다.
  const handleMenuPress = (id) => {
    if (id === 'todo') navigation.navigate('Todo');
    if (id === 'routine') navigation.navigate('Routine');
    if (id === 'emergency') navigation.navigate('Emergency');
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 14,
          paddingBottom: TAB_BAR_HEIGHT + insets.bottom + 40,
          paddingHorizontal: spacing.screenX,
        }}
      >
        <ScreenHeader title="생활정보" subtitle={subtitle} />

        <FeatureCard variant="mint" {...aiManager} onPress={() => navigation.navigate('AiManager')} />
        <View style={styles.cardGap} />
        <FeatureCard
          variant="gray"
          {...survivalMap}
          onPress={() => navigation.navigate('SurvivalMap')}
        />

        <SectionTitle style={styles.sectionTitle}>{sectionTitle}</SectionTitle>

        <View>
          {menus.map((menu) => (
            <MenuRow key={menu.id} {...menu} vertical={25} onPress={() => handleMenuPress(menu.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  cardGap: {
    height: 16,
  },
  sectionTitle: {
    marginTop: 28,
    marginBottom: 12,
  },
});
