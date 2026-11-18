import {available,daysLeft} from '../module3/domain/inventory.mjs';
export function presentRecipe(recipe,inventory){
 const ingredients=recipe.ingredients.map(i=>{const stock=inventory.find(s=>s.name===i.name&&s.unit===i.unit&&daysLeft(s.expiresAt)>=0);const held=available(inventory,i);return {...i,held,shortage:Math.max(0,Math.round((i.quantity-held)*1000000)/1000000),unitMismatch:inventory.some(s=>s.name===i.name&&s.unit!==i.unit&&s.quantity>0),amount:`${i.quantity}${i.unit}`,fridgeItem:available(inventory,i)>=i.quantity?{...stock,daysLeft:stock?daysLeft(stock.expiresAt):Infinity}:null};});
 return {recipe:{...recipe,title:recipe.name,servings:1,difficulty:'간단',icon:'chef-hat'},ingredients,owned:ingredients.filter(i=>i.fridgeItem),missing:ingredients.filter(i=>!i.fridgeItem),urgent:ingredients.filter(i=>i.fridgeItem&&i.fridgeItem.daysLeft<=3)};
}
