'use client';

import React, { useCallback, useMemo } from 'react';
import { Plus, Trash2, GripVertical, ChevronDown, ChevronRight, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockFieldSchema, ConditionRule } from '@/lib/block-schema';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ColorPicker } from '@/components/storefront-builder/ColorPicker';
import { AssetUploader } from '@/components/storefront-builder/AssetUploader';

// =============================================================================
// TYPES
// =============================================================================

interface BlockFormRendererProps {
  fields: BlockFieldSchema[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  path?: string;
}

interface FieldRendererProps {
  field: BlockFieldSchema;
  value: unknown;
  onChange: (value: unknown) => void;
  error?: string;
  disabled?: boolean;
  path: string;
  allValues: Record<string, unknown>;
}

// =============================================================================
// FIELD VISIBILITY CHECKER
// =============================================================================

function checkCondition(
  condition: ConditionRule,
  values: Record<string, unknown>
): boolean {
  const fieldValue = getNestedValue(values, condition.field);

  switch (condition.operator) {
    case 'equals':
      return fieldValue === condition.value;
    case 'not_equals':
      return fieldValue !== condition.value;
    case 'in':
      return Array.isArray(condition.value) && condition.value.includes(fieldValue as string);
    case 'not_in':
      return Array.isArray(condition.value) && !condition.value.includes(fieldValue as string);
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
    case 'not_exists':
      return fieldValue === undefined || fieldValue === null || fieldValue === '';
    default:
      return true;
  }
}

function shouldShowField(
  field: BlockFieldSchema,
  values: Record<string, unknown>
): boolean {
  if (!field.showWhen) return true;

  if (Array.isArray(field.showWhen)) {
    return field.showWhen.every((condition) => checkCondition(condition, values));
  }

  return checkCondition(field.showWhen, values);
}

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((acc: unknown, part) => {
    if (acc && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  const parts = path.split('.');
  const result = { ...obj };

  let current: Record<string, unknown> = result;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    current[part] = { ...(current[part] as Record<string, unknown> || {}) };
    current = current[part] as Record<string, unknown>;
  }

  current[parts[parts.length - 1]] = value;
  return result;
}

// =============================================================================
// FIELD WIDTH CLASSES
// =============================================================================

function getWidthClass(width?: string): string {
  switch (width) {
    case 'quarter':
      return 'w-full sm:w-1/4';
    case 'third':
      return 'w-full sm:w-1/3';
    case 'half':
      return 'w-full sm:w-1/2';
    case 'full':
    default:
      return 'w-full';
  }
}

// =============================================================================
// INDIVIDUAL FIELD RENDERERS
// =============================================================================

function StringField({ field, value, onChange, error, disabled }: FieldRendererProps) {
  if (field.multiline) {
    return (
      <Textarea
        value={(value as string) || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        rows={field.rows || 3}
        maxLength={field.maxLength}
        className={cn(error && 'border-destructive')}
      />
    );
  }

  return (
    <Input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      maxLength={field.maxLength}
      className={cn(error && 'border-destructive')}
    />
  );
}

function NumberField({ field, value, onChange, error, disabled }: FieldRendererProps) {
  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        value={value !== undefined ? String(value) : ''}
        onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)}
        placeholder={field.placeholder}
        disabled={disabled}
        min={field.min}
        max={field.max}
        step={field.step}
        className={cn('flex-1', error && 'border-destructive')}
      />
      {field.unit && (
        <span className="text-sm text-muted-foreground">{field.unit}</span>
      )}
    </div>
  );
}

function BooleanField({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={!!value}
        onCheckedChange={onChange}
        disabled={disabled}
      />
      {field.description && (
        <span className="text-sm text-muted-foreground">{field.description}</span>
      )}
    </div>
  );
}

function SelectField({ field, value, onChange, error, disabled }: FieldRendererProps) {
  return (
    <Select
      value={(value as string) || ''}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className={cn(error && 'border-destructive')}>
        <SelectValue placeholder={field.placeholder || 'Select...'} />
      </SelectTrigger>
      <SelectContent>
        {field.options?.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            <div className="flex items-center gap-2">
              {option.label}
              {option.description && (
                <span className="text-xs text-muted-foreground">
                  - {option.description}
                </span>
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MultiSelectField({ field, value, onChange, disabled }: FieldRendererProps) {
  const selectedValues = (value as string[]) || [];

  const toggleValue = (optionValue: string) => {
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter((v) => v !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleValue(option.value)}
          disabled={disabled || option.disabled}
          className={cn(
            'px-3 py-1.5 text-sm rounded-md border transition-colors',
            selectedValues.includes(option.value)
              ? 'bg-primary text-primary-foreground border-primary'
              : 'bg-background hover:bg-muted border-border'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ColorField({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <ColorPicker
      label=""
      value={(value as string) || '#000000'}
      onChange={(newColor: string) => onChange(newColor)}
      disabled={disabled}
    />
  );
}

function MediaField({ field, value, onChange, disabled }: FieldRendererProps) {
  // Map field aspectRatio to AssetUploader's allowed values
  const getAspectRatio = (): 'square' | '16:9' | '4:3' | 'banner' => {
    const ratio = field.aspectRatio;
    if (ratio === 'square' || ratio === '16:9' || ratio === '4:3' || ratio === 'banner') {
      return ratio;
    }
    return 'square'; // default
  };

  return (
    <AssetUploader
      type="logo" // Default type
      currentUrl={(value as string) || ''}
      onUpload={(url: string) => onChange(url)}
      onRemove={() => onChange('')}
      disabled={disabled}
      aspectRatio={getAspectRatio()}
      maxSizeMB={field.maxFileSize ? field.maxFileSize / (1024 * 1024) : 5}
    />
  );
}

function DateTimeField({ field, value, onChange, error, disabled }: FieldRendererProps) {
  const inputType = field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'datetime-local';

  return (
    <Input
      type={inputType}
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(error && 'border-destructive')}
    />
  );
}

function UrlField({ field, value, onChange, error, disabled }: FieldRendererProps) {
  return (
    <Input
      type="url"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || 'https://...'}
      disabled={disabled}
      className={cn(error && 'border-destructive')}
    />
  );
}

function CodeField({ field, value, onChange, disabled }: FieldRendererProps) {
  return (
    <Textarea
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      disabled={disabled}
      rows={field.rows || 8}
      className="font-mono text-sm"
    />
  );
}

function IconField({ field, value, onChange, disabled }: FieldRendererProps) {
  // Simple icon input - could be enhanced with icon picker
  return (
    <Input
      type="text"
      value={(value as string) || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder || 'Icon name (e.g., ShoppingCart)'}
      disabled={disabled}
    />
  );
}

// =============================================================================
// ARRAY FIELD
// =============================================================================

function ArrayField({ field, value, onChange, disabled, path, allValues }: FieldRendererProps) {
  const items = (value as unknown[]) || [];
  const canAdd = !field.maxItems || items.length < field.maxItems;
  const canRemove = !field.minItems || items.length > field.minItems;
  const itemSchema = field.itemSchema;

  const addItem = () => {
    const newItem = itemSchema?.type === 'object'
      ? {}
      : itemSchema?.default ?? '';
    onChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, newValue: unknown) => {
    const newItems = [...items];
    newItems[index] = newValue;
    onChange(newItems);
  };

  const moveItem = (from: number, to: number) => {
    const newItems = [...items];
    const [item] = newItems.splice(from, 1);
    newItems.splice(to, 0, item);
    onChange(newItems);
  };

  if (!itemSchema) return null;

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div
          key={index}
          className="flex gap-2 p-3 bg-muted/50 rounded-lg border"
        >
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => index > 0 && moveItem(index, index - 1)}
              disabled={disabled || index === 0}
              className="p-1 hover:bg-muted rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 -rotate-90" />
            </button>
            <button
              type="button"
              onClick={() => index < items.length - 1 && moveItem(index, index + 1)}
              disabled={disabled || index === items.length - 1}
              className="p-1 hover:bg-muted rounded disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4 rotate-90" />
            </button>
          </div>

          <div className="flex-1">
            {itemSchema.type === 'object' && itemSchema.fields ? (
              <BlockFormRenderer
                fields={itemSchema.fields}
                values={(item as Record<string, unknown>) || {}}
                onChange={(name, newValue) => {
                  const newItem = { ...(item as Record<string, unknown>), [name]: newValue };
                  updateItem(index, newItem);
                }}
                disabled={disabled}
                path={`${path}[${index}]`}
              />
            ) : (
              <FieldRenderer
                field={itemSchema}
                value={item}
                onChange={(newValue) => updateItem(index, newValue)}
                disabled={disabled}
                path={`${path}[${index}]`}
                allValues={allValues}
              />
            )}
          </div>

          {canRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              disabled={disabled}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      ))}

      {canAdd && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addItem}
          disabled={disabled}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {itemSchema.label || 'Item'}
        </Button>
      )}
    </div>
  );
}

// =============================================================================
// OBJECT FIELD
// =============================================================================

function ObjectField({ field, value, onChange, disabled, path, allValues }: FieldRendererProps) {
  const objectValue = (value as Record<string, unknown>) || {};

  const handleFieldChange = (name: string, newValue: unknown) => {
    onChange({ ...objectValue, [name]: newValue });
  };

  if (!field.fields) return null;

  if (field.collapsible) {
    return (
      <Collapsible defaultOpen={!field.collapsed}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium hover:text-primary">
          <ChevronRight className="w-4 h-4 transition-transform data-[state=open]:rotate-90" />
          {field.label}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="pl-4 border-l-2 border-muted">
            <BlockFormRenderer
              fields={field.fields}
              values={objectValue}
              onChange={handleFieldChange}
              disabled={disabled}
              path={path}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  }

  return (
    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
      <BlockFormRenderer
        fields={field.fields}
        values={objectValue}
        onChange={handleFieldChange}
        disabled={disabled}
        path={path}
      />
    </div>
  );
}

// =============================================================================
// FIELD RENDERER
// =============================================================================

function FieldRenderer({ field, value, onChange, error, disabled, path, allValues }: FieldRendererProps) {
  switch (field.type) {
    case 'string':
      return <StringField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'number':
      return <NumberField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'boolean':
      return <BooleanField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'select':
      return <SelectField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'multiselect':
      return <MultiSelectField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'color':
      return <ColorField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'media':
      return <MediaField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'datetime':
    case 'date':
    case 'time':
      return <DateTimeField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'url':
      return <UrlField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'code':
    case 'markdown':
      return <CodeField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'icon':
      return <IconField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'array':
      return <ArrayField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'object':
      return <ObjectField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'product':
    case 'category':
    case 'collection':
      // Placeholder for entity pickers - could be enhanced with actual pickers
      return <StringField field={{ ...field, placeholder: `Enter ${field.type} ID` }} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'richtext':
      return <CodeField field={{ ...field, rows: 6 }} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    case 'json':
      return <CodeField field={{ ...field, language: 'json', rows: 8 }} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
    default:
      return <StringField field={field} value={value} onChange={onChange} error={error} disabled={disabled} path={path} allValues={allValues} />;
  }
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function BlockFormRenderer({
  fields,
  values,
  onChange,
  errors = {},
  disabled = false,
  path = '',
}: BlockFormRendererProps) {
  const handleChange = useCallback(
    (name: string, value: unknown) => {
      onChange(name, value);
    },
    [onChange]
  );

  // Group fields by group property
  const groupedFields = useMemo(() => {
    const groups: Map<string, BlockFieldSchema[]> = new Map();
    const ungrouped: BlockFieldSchema[] = [];

    fields.forEach((field) => {
      if (!shouldShowField(field, values)) return;

      if (field.group) {
        if (!groups.has(field.group)) {
          groups.set(field.group, []);
        }
        groups.get(field.group)!.push(field);
      } else {
        ungrouped.push(field);
      }
    });

    return { groups, ungrouped };
  }, [fields, values]);

  const renderField = (field: BlockFieldSchema) => {
    const fieldPath = path ? `${path}.${field.name}` : field.name;
    const value = values[field.name];
    const error = errors[field.name];

    // Boolean fields render inline with label
    if (field.type === 'boolean') {
      return (
        <div key={field.name} className={cn('flex items-center gap-3', getWidthClass(field.width))}>
          <FieldRenderer
            field={field}
            value={value}
            onChange={(newValue) => handleChange(field.name, newValue)}
            error={error}
            disabled={disabled}
            path={fieldPath}
            allValues={values}
          />
          <Label className="font-normal">{field.label}</Label>
          {field.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{field.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      );
    }

    return (
      <div key={field.name} className={cn('space-y-2', getWidthClass(field.width))}>
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldPath}>
            {field.label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
          {field.helpText && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <HelpCircle className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="max-w-xs">{field.helpText}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {field.description && (
          <p className="text-sm text-muted-foreground">{field.description}</p>
        )}
        <FieldRenderer
          field={field}
          value={value}
          onChange={(newValue) => handleChange(field.name, newValue)}
          error={error}
          disabled={disabled}
          path={fieldPath}
          allValues={values}
        />
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Ungrouped fields */}
      {groupedFields.ungrouped.length > 0 && (
        <div className="flex flex-wrap gap-4">
          {groupedFields.ungrouped.map(renderField)}
        </div>
      )}

      {/* Grouped fields - could be enhanced with collapsible sections */}
      {Array.from(groupedFields.groups.entries()).map(([groupName, groupFields]) => (
        <div key={groupName} className="flex flex-wrap gap-4">
          {groupFields.map(renderField)}
        </div>
      ))}
    </div>
  );
}

export default BlockFormRenderer;
