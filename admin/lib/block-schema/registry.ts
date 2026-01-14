/**
 * Block Schema Registry
 *
 * Central registry for all block schemas used in the Block Composer.
 * Provides methods to access schemas by type, category, and other filters.
 */

import {
  BlockSchema,
  BlockSchemaRegistry,
  BlockCategory,
  BlockCategoryInfo,
  FieldGroup,
  BLOCK_CATEGORIES,
  DEFAULT_FIELD_GROUPS,
  BASE_BLOCK_FIELDS,
  BlockFieldSchema,
} from './types';
import { ALL_BLOCK_SCHEMAS } from './schemas';

// =============================================================================
// REGISTRY IMPLEMENTATION
// =============================================================================

class BlockSchemaRegistryImpl implements BlockSchemaRegistry {
  schemas: Map<string, BlockSchema> = new Map();
  categories: BlockCategoryInfo[] = BLOCK_CATEGORIES;
  fieldGroups: FieldGroup[] = DEFAULT_FIELD_GROUPS;

  constructor() {
    // Register all schemas
    ALL_BLOCK_SCHEMAS.forEach((schema) => {
      this.registerSchema(schema);
    });
  }

  private registerSchema(schema: BlockSchema): void {
    // Merge base fields if needed
    const mergedSchema = schema.includeBaseFields
      ? {
          ...schema,
          fields: [...schema.fields, ...BASE_BLOCK_FIELDS],
        }
      : schema;

    this.schemas.set(schema.type, mergedSchema);
  }

  getSchema(type: string): BlockSchema | undefined {
    return this.schemas.get(type);
  }

  getSchemasByCategory(category: BlockCategory): BlockSchema[] {
    return Array.from(this.schemas.values()).filter(
      (schema) => schema.category === category
    );
  }

  getAllSchemas(): BlockSchema[] {
    return Array.from(this.schemas.values());
  }

  getSchemasSortedByCategory(): { category: BlockCategoryInfo; schemas: BlockSchema[] }[] {
    return this.categories.map((category) => ({
      category,
      schemas: this.getSchemasByCategory(category.id),
    })).filter(({ schemas }) => schemas.length > 0);
  }

  getFieldsForBlock(type: string, variant?: string): BlockFieldSchema[] {
    const schema = this.getSchema(type);
    if (!schema) return [];

    let fields = [...schema.fields];

    // Apply variant-specific modifications
    if (variant && schema.variants) {
      const variantConfig = schema.variants.find((v) => v.id === variant);
      if (variantConfig) {
        // Add variant-specific fields
        if (variantConfig.additionalFields) {
          fields = [...fields, ...variantConfig.additionalFields];
        }
        // Remove hidden fields
        if (variantConfig.hiddenFields) {
          fields = fields.filter((f) => !variantConfig.hiddenFields!.includes(f.name));
        }
      }
    }

    return fields;
  }

  getDefaultConfig(type: string, variant?: string): Record<string, unknown> {
    const schema = this.getSchema(type);
    if (!schema) return {};

    const config: Record<string, unknown> = {
      id: `block-${Date.now()}`,
      type,
      enabled: true,
      ...schema.defaultConfig,
    };

    if (variant) {
      config.variant = variant;
    } else if (schema.defaultVariant) {
      config.variant = schema.defaultVariant;
    }

    return config;
  }

  validateBlockConfig(type: string, config: Record<string, unknown>): string[] {
    const schema = this.getSchema(type);
    if (!schema) return [`Unknown block type: ${type}`];

    const errors: string[] = [];
    const fields = this.getFieldsForBlock(type, config.variant as string);

    fields.forEach((field) => {
      const value = config[field.name];

      // Check required fields
      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field.label} is required`);
      }

      // Check validation rules
      if (value !== undefined && field.validation) {
        field.validation.forEach((rule) => {
          switch (rule.type) {
            case 'minLength':
              if (typeof value === 'string' && value.length < (rule.value as number)) {
                errors.push(rule.message);
              }
              break;
            case 'maxLength':
              if (typeof value === 'string' && value.length > (rule.value as number)) {
                errors.push(rule.message);
              }
              break;
            case 'min':
              if (typeof value === 'number' && value < (rule.value as number)) {
                errors.push(rule.message);
              }
              break;
            case 'max':
              if (typeof value === 'number' && value > (rule.value as number)) {
                errors.push(rule.message);
              }
              break;
            case 'pattern':
              if (typeof value === 'string' && !new RegExp(rule.value as string).test(value)) {
                errors.push(rule.message);
              }
              break;
            case 'url':
              if (typeof value === 'string' && value) {
                try {
                  new URL(value);
                } catch {
                  errors.push(rule.message);
                }
              }
              break;
            case 'email':
              if (typeof value === 'string' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                errors.push(rule.message);
              }
              break;
          }
        });
      }

      // Check array constraints
      if (field.type === 'array' && Array.isArray(value)) {
        if (field.minItems && value.length < field.minItems) {
          errors.push(`${field.label} requires at least ${field.minItems} items`);
        }
        if (field.maxItems && value.length > field.maxItems) {
          errors.push(`${field.label} can have at most ${field.maxItems} items`);
        }
      }
    });

    return errors;
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

export const blockSchemaRegistry = new BlockSchemaRegistryImpl();

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get block icon by type
 */
export function getBlockIcon(type: string): string {
  const schema = blockSchemaRegistry.getSchema(type);
  return schema?.icon || 'Box';
}

/**
 * Get block name by type
 */
export function getBlockName(type: string): string {
  const schema = blockSchemaRegistry.getSchema(type);
  return schema?.name || type;
}

/**
 * Get block category by type
 */
export function getBlockCategory(type: string): BlockCategory | undefined {
  const schema = blockSchemaRegistry.getSchema(type);
  return schema?.category;
}

/**
 * Get block variants
 */
export function getBlockVariants(type: string): { id: string; name: string; description?: string }[] {
  const schema = blockSchemaRegistry.getSchema(type);
  return schema?.variants || [];
}

/**
 * Check if block type exists
 */
export function isValidBlockType(type: string): boolean {
  return blockSchemaRegistry.schemas.has(type);
}

/**
 * Get all block types
 */
export function getAllBlockTypes(): string[] {
  return Array.from(blockSchemaRegistry.schemas.keys());
}

/**
 * Create a new block with default config
 */
export function createBlock(type: string, variant?: string, overrides?: Record<string, unknown>): Record<string, unknown> {
  const defaultConfig = blockSchemaRegistry.getDefaultConfig(type, variant);
  return {
    ...defaultConfig,
    ...overrides,
    id: overrides?.id || `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  };
}

/**
 * Duplicate a block with a new ID
 */
export function duplicateBlock(block: Record<string, unknown>): Record<string, unknown> {
  return {
    ...block,
    id: `block-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    adminLabel: block.adminLabel ? `${block.adminLabel} (Copy)` : undefined,
  };
}

// =============================================================================
// EXPORTS
// =============================================================================

export * from './types';
export * from './schemas';
