import React from 'react';
import {useLocalSearchParams} from 'expo-router';
import {Text} from 'react-native';
import InventoryForm from '../../components/InventoryForm';
import {Page} from '../../components/UI';
import {useApp} from '../../state/AppProvider';
export default function New(){
 const {shoppingId}=useLocalSearchParams(),{state}=useApp();
 const shopping=state.shopping.find(i=>i.id===shoppingId);
 if(shoppingId&&(!shopping||shopping.inventoryId))return <Page title="재고 등록"><Text>이미 등록했거나 삭제된 장보기 품목이에요.</Text></Page>;
 return <InventoryForm shopping={shopping}/>;
}
