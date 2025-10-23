import { z } from 'zod';

/**
 * JSON Schema to Zod Converter
 * Converts MCP tool JSON Schema definitions to Zod schemas for Vercel AI SDK
 */

type JSONSchema = {
  type?: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  enum?: any[];
  items?: JSONSchema;
  default?: any;
};

/**
 * Convert a JSON Schema property to a Zod schema
 */
function convertProperty(schema: JSONSchema, isRequired: boolean): z.ZodTypeAny {
  // Handle enum first
  if (schema.enum) {
    let enumSchema = z.enum(schema.enum as [string, ...string[]]);
    if (schema.description) {
      enumSchema = enumSchema.describe(schema.description);
    }
    return isRequired ? enumSchema : enumSchema.optional();
  }

  // Handle type
  let zodSchema: any;

  switch (schema.type) {
    case 'string':
      zodSchema = z.string();
      break;

    case 'number':
    case 'integer':
      zodSchema = z.number();
      if (schema.type === 'integer') {
        zodSchema = zodSchema.int();
      }
      break;

    case 'boolean':
      zodSchema = z.boolean();
      break;

    case 'array':
      if (schema.items) {
        const itemSchema = convertProperty(schema.items, true);
        zodSchema = z.array(itemSchema);
      } else {
        zodSchema = z.array(z.any());
      }
      break;

    case 'object':
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = schema.required || [];

        for (const [key, prop] of Object.entries(schema.properties)) {
          shape[key] = convertProperty(prop, required.includes(key));
        }

        zodSchema = z.object(shape);
      } else {
        zodSchema = z.record(z.any());
      }
      break;

    default:
      zodSchema = z.any();
  }

  // Add description if present
  if (schema.description && 'describe' in zodSchema) {
    zodSchema = zodSchema.describe(schema.description);
  }

  // Add default value if present
  if (schema.default !== undefined && 'default' in zodSchema) {
    zodSchema = zodSchema.default(schema.default);
  }

  // Make optional if not required
  if (!isRequired && 'optional' in zodSchema) {
    zodSchema = zodSchema.optional();
  }

  return zodSchema;
}

/**
 * Convert a JSON Schema to a Zod schema
 * @param jsonSchema - The JSON Schema to convert
 * @returns A Zod schema
 */
export function jsonSchemaToZod(jsonSchema: JSONSchema): z.ZodTypeAny {
  if (!jsonSchema.type || jsonSchema.type !== 'object') {
    throw new Error('Root schema must be an object type');
  }

  if (!jsonSchema.properties) {
    return z.object({});
  }

  const shape: Record<string, z.ZodTypeAny> = {};
  const required = jsonSchema.required || [];

  for (const [key, prop] of Object.entries(jsonSchema.properties)) {
    shape[key] = convertProperty(prop, required.includes(key));
  }

  return z.object(shape);
}
