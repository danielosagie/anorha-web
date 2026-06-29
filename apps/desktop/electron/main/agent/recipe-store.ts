import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { app } from 'electron';

export type RecipeStep =
    | { action: 'goto'; url: string }
    | { action: 'click'; selector: string }
    | { action: 'fill'; selector: string; value: string }
    | { action: 'press'; selector: string; key: string }
    | { action: 'wait_for'; selector: string; timeoutMs?: number }
    | { action: 'expect_text'; text: string; selector?: string }
    | { action: 'upload'; selector: string; path: string };

export type BrowserRecipe = {
    id: string;
    site?: string;
    inputs?: Record<string, string | number | boolean>;
    steps: RecipeStep[];
    expectedChecks?: Array<{ type: 'url_contains' | 'text'; value: string; selector?: string }>;
    requiresAuth?: boolean;
    storageStateRef?: string;
    createdAt: number;
};

const STORE_FILE = 'recipes.json';

export class RecipeStore {
    private storePath: string;

    constructor() {
        this.storePath = join(app.getPath('userData'), STORE_FILE);
    }

    private loadStore(): Record<string, BrowserRecipe> {
        try {
            if (!existsSync(this.storePath)) return {};
            const raw = readFileSync(this.storePath, 'utf-8');
            const parsed = JSON.parse(raw) as Record<string, BrowserRecipe>;
            return parsed || {};
        } catch (error) {
            console.warn('[RecipeStore] Failed to load store:', error);
            return {};
        }
    }

    private saveStore(store: Record<string, BrowserRecipe>) {
        try {
            const dir = dirname(this.storePath);
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
            writeFileSync(this.storePath, JSON.stringify(store, null, 2));
        } catch (error) {
            console.warn('[RecipeStore] Failed to save store:', error);
        }
    }

    save(recipe: BrowserRecipe) {
        const store = this.loadStore();
        store[recipe.id] = recipe;
        this.saveStore(store);
    }

    get(recipeId: string): BrowserRecipe | null {
        const store = this.loadStore();
        return store[recipeId] || null;
    }

    list(): BrowserRecipe[] {
        const store = this.loadStore();
        return Object.values(store);
    }
}

export const recipeStore = new RecipeStore();
