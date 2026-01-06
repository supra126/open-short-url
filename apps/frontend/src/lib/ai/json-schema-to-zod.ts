import { z } from 'zod';

/**
 * JSON Schema to Zod Converter
 * Converts MCP tool JSON Schema definitions to Zod schemas for Vercel AI SDK
 */

export type JSONSchema = {
  type?: string;
  properties?: Record<string, JSONSchema>;
  required?: string[];
  description?: string;
  enum?: string[];
  items?: JSONSchema;
  default?: string | number | boolean | null;
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
  let zodSchema: z.ZodTypeAny;

  switch (schema.type) {
    case 'string':
      zodSchema = schema.description
        ? z.string().describe(schema.description)
        : z.string();
      break;

    case 'number':
      zodSchema = schema.description
        ? z.number().describe(schema.description)
        : z.number();
      break;

    case 'integer':
      zodSchema = schema.description
        ? z.number().int().describe(schema.description)
        : z.number().int();
      break;

    case 'boolean':
      zodSchema = schema.description
        ? z.boolean().describe(schema.description)
        : z.boolean();
      break;

    case 'array':
      if (schema.items) {
        const itemSchema = convertProperty(schema.items, true);
        zodSchema = schema.description
          ? z.array(itemSchema).describe(schema.description)
          : z.array(itemSchema);
      } else {
        zodSchema = schema.description
          ? z.array(z.unknown()).describe(schema.description)
          : z.array(z.unknown());
      }
      break;

    case 'object':
      if (schema.properties) {
        const shape: Record<string, z.ZodTypeAny> = {};
        const required = schema.required || [];

        for (const [key, prop] of Object.entries(schema.properties)) {
          shape[key] = convertProperty(prop, required.includes(key));
        }

        zodSchema = schema.description
          ? z.object(shape).describe(schema.description)
          : z.object(shape);
      } else {
        zodSchema = schema.description
          ? z.record(z.string(), z.unknown()).describe(schema.description)
          : z.record(z.string(), z.unknown());
      }
      break;

    default:
      zodSchema = z.unknown();
  }

  // Add default value if present (using passthrough since we already handled descriptions)
  if (schema.default !== undefined) {
    zodSchema = zodSchema.default(schema.default);
  }

  // Make optional if not required
  if (!isRequired) {
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
