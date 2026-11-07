export interface SchemaProperty {
  type?: string | string[];
  description?: string;
  enum?: unknown[];
  default?: unknown;
  title?: string;
}

export interface ToolSchema {
  type?: string;
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export interface Tool {
  name: string;
  title: string;
  description: string;
  inputSchema: ToolSchema;
}

export interface ToolField {
  name: string;
  label: string;
  description: string;
  kind: 'text' | 'number' | 'boolean' | 'choice' | 'json';
  required: boolean;
  choices: string[];
  initial: string;
}

export interface ToolResult {
  isError: boolean;
  texts: string[];
  raw: unknown;
  seconds: number;
}

function typeOf(property: SchemaProperty): string {
  const type = Array.isArray(property.type)
    ? property.type.find((t) => t !== 'null')
    : property.type;
  return type ?? 'string';
}

export function toolFields(schema: ToolSchema): ToolField[] {
  const required = new Set(schema.required ?? []);
  return Object.entries(schema.properties ?? {}).map(([name, property]) => {
    const type = typeOf(property);
    const kind: ToolField['kind'] = property.enum
      ? 'choice'
      : type === 'boolean'
        ? 'boolean'
        : type === 'number' || type === 'integer'
          ? 'number'
          : type === 'string'
            ? 'text'
            : 'json';
    const initial =
      property.default === undefined
        ? kind === 'json'
          ? type === 'array'
            ? '[]'
            : '{}'
          : ''
        : typeof property.default === 'string'
          ? property.default
          : JSON.stringify(property.default);
    return {
      name,
      label: property.title ?? name,
      description: property.description ?? '',
      kind,
      required: required.has(name),
      choices: (property.enum ?? []).map(String),
      initial,
    };
  });
}

export function toolArguments(
  fields: readonly ToolField[],
  values: Record<string, string>,
): Record<string, unknown> {
  const args: Record<string, unknown> = {};
  for (const field of fields) {
    const value = values[field.name] ?? '';
    if (value === '' && !field.required) continue;
    switch (field.kind) {
      case 'number':
        args[field.name] = Number(value);
        break;
      case 'boolean':
        args[field.name] = value === 'true';
        break;
      case 'json':
        args[field.name] = JSON.parse(value || 'null');
        break;
      default:
        args[field.name] = value;
    }
  }
  return args;
}
