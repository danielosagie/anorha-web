import { existsSync, readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
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
        if (!existsSync(this.storePath)) return {};
        try {
            const raw = readFileSync(this.storePath, 'utf-8');
            const parsed = JSON.parse(raw) as Record<string, BrowserRecipe>;
            return parsed || {};
        } catch (error) {
            // Surface read/parse failures instead of silently returning {},
            // which would cause the next save to overwrite existing recipes.
            throw new Error(`[RecipeStore] Failed to load store at ${this.storePath}: ${(error as Error).message}`);
        }
    }

    private saveStore(store: Record<string, BrowserRecipe>) {
        const dir = dirname(this.storePath);
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true });
        }
        // Write atomically: write to a temp file then rename, so a crash or
        // failure mid-write cannot leave a truncated/corrupt store behind.
        const tmpPath = `${this.storePath}.${process.pid}.tmp`;
        writeFileSync(tmpPath, JSON.stringify(store, null, 2));
        renameSync(tmpPath, this.storePath);
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
