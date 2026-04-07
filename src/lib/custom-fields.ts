/**
 * Custom Fields System
 * Allows defining custom fields on conversations, tickets, and customers.
 */

export type FieldType = "text" | "number" | "boolean" | "date" | "select" | "multiselect" | "url" | "email";
export type EntityType = "conversation" | "ticket" | "customer";

export interface CustomFieldDefinition {
  id: string;
  name: string;
  label: string;
  type: FieldType;
  entityType: EntityType;
  required: boolean;
  options?: string[]; // For select/multiselect
  defaultValue?: string;
  sortOrder: number;
}

/**
 * Validate a custom field value against its definition.
 */
export function validateFieldValue(
  definition: CustomFieldDefinition,
  value: unknown
): { valid: boolean; error?: string } {
  if (definition.required && (value === null || value === undefined || value === "")) {
    return { valid: false, error: `${definition.label} is required` };
  }

  if (value === null || value === undefined || value === "") {
    return { valid: true };
  }

  switch (definition.type) {
    case "text":
    case "url":
    case "email":
      if (typeof value !== "string") return { valid: false, error: `${definition.label} must be text` };
      if (definition.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        return { valid: false, error: `${definition.label} must be a valid email` };
      }
      if (definition.type === "url" && !/^https?:\/\/.+/.test(value)) {
        return { valid: false, error: `${definition.label} must be a valid URL` };
      }
      return { valid: true };

    case "number":
      if (typeof value !== "number" && isNaN(Number(value))) {
        return { valid: false, error: `${definition.label} must be a number` };
      }
      return { valid: true };

    case "boolean":
      if (typeof value !== "boolean") {
        return { valid: false, error: `${definition.label} must be true or false` };
      }
      return { valid: true };

    case "date":
      if (isNaN(Date.parse(String(value)))) {
        return { valid: false, error: `${definition.label} must be a valid date` };
      }
      return { valid: true };

    case "select":
      if (definition.options && !definition.options.includes(String(value))) {
        return { valid: false, error: `${definition.label} must be one of: ${definition.options.join(", ")}` };
      }
      return { valid: true };

    case "multiselect": {
      const values = Array.isArray(value) ? value : [value];
      if (definition.options) {
        const invalid = values.filter((v) => !definition.options!.includes(String(v)));
        if (invalid.length > 0) {
          return { valid: false, error: `Invalid options for ${definition.label}: ${invalid.join(", ")}` };
        }
      }
      return { valid: true };
    }

    default:
      return { valid: true };
  }
}

/**
 * Validate all custom field values for an entity.
 */
export function validateCustomFields(
  definitions: CustomFieldDefinition[],
  values: Record<string, unknown>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (const def of definitions) {
    const result = validateFieldValue(def, values[def.name]);
    if (!result.valid && result.error) {
      errors.push(result.error);
    }
  }

  return { valid: errors.length === 0, errors };
}
