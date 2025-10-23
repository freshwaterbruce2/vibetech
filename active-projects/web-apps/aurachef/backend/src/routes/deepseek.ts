import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import {
  generateMealPlan,
  replaceRecipe,
  generateShoppingList,
  comparePrices
} from '../services/deepseekService';

export const deepseekRouter = Router();

// Validation schemas
const MealPlanSettingsSchema = z.object({
  budget: z.number().positive(),
  people: z.number().int().positive(),
  days: z.number().int().positive().max(30),
  preferences: z.string(),
  mealTypes: z.array(z.enum(['Breakfast', 'Lunch', 'Dinner'])).min(1),
  wantsCrockpot: z.boolean(),
});

const ReplaceRecipeSchema = z.object({
  mealPlan: z.object({
    days: z.array(z.any()),
    total_estimated_cost: z.number(),
  }),
  settings: MealPlanSettingsSchema,
  day: z.string(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner']),
});

const ShoppingListSchema = z.object({
  mealPlan: z.object({
    days: z.array(z.any()),
    total_estimated_cost: z.number(),
  }),
});

const ComparePricesSchema = z.object({
  items: z.array(z.string()).min(1),
  zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP code'),
});

// POST /api/deepseek/generate-meal-plan
deepseekRouter.post('/generate-meal-plan', async (req: Request, res: Response) => {
  try {
    const settings = MealPlanSettingsSchema.parse(req.body);
    const mealPlan = await generateMealPlan(settings);
    res.json(mealPlan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Generate meal plan error:', error);
    res.status(500).json({ 
      error: 'Failed to generate meal plan',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/deepseek/replace-recipe
deepseekRouter.post('/replace-recipe', async (req: Request, res: Response) => {
  try {
    const data = ReplaceRecipeSchema.parse(req.body);
    const newRecipe = await replaceRecipe(
      data.mealPlan,
      data.settings,
      data.day,
      data.mealType
    );
    res.json(newRecipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Replace recipe error:', error);
    res.status(500).json({ 
      error: 'Failed to replace recipe',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/deepseek/generate-shopping-list
deepseekRouter.post('/generate-shopping-list', async (req: Request, res: Response) => {
  try {
    const data = ShoppingListSchema.parse(req.body);
    const shoppingList = await generateShoppingList(data.mealPlan);
    res.json({ shopping_list: shoppingList });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Generate shopping list error:', error);
    res.status(500).json({ 
      error: 'Failed to generate shopping list',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/deepseek/compare-prices
deepseekRouter.post('/compare-prices', async (req: Request, res: Response) => {
  try {
    const data = ComparePricesSchema.parse(req.body);
    const comparison = await comparePrices(data.items, data.zipCode);
    res.json(comparison);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Validation error', details: error.issues });
      return;
    }
    console.error('Compare prices error:', error);
    res.status(500).json({ 
      error: 'Failed to compare prices',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
