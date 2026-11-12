import { askLlm } from "./llm";
import { buildRecipeSystem, parseRecipes, RECIPE_USER_MESSAGE } from "./recipeRules";
import { InventoryItem, Recipe, RecipeContext } from "./types";

const MAX_ATTEMPTS = 2;

// 성공하면 검증된 레시피 목록, 실패하면 null (호출 측에서 안내 문구)
export async function generateRecipes(apiKey: string, ctx: RecipeContext, items: InventoryItem[]): Promise<Recipe[] | null> {
  const system = buildRecipeSystem(ctx);
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const text = await askLlm(apiKey, system, [{ role: "user", content: RECIPE_USER_MESSAGE }], 1500);
      const recipes = parseRecipes(text, ctx, items);
      if (recipes) return recipes;
      console.warn(`recipe validation failed (attempt ${attempt})`);
    } catch (err) {
      console.error(`recipe LLM call failed (attempt ${attempt})`, err);
    }
  }
  return null;
}
