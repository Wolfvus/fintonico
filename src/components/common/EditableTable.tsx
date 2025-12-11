import React, { useState, useRef, useEffect } from 'react';
import { Trash2, Plus, Check, X } from 'lucide-react';

interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, isEditing: boolean, onChange: (value: string) => void) => React.ReactNode;
  editable?: boolean;
  type?: 'text' | 'number' | 'currency' | 'select';
  options?: { value: string; label: string }[];
  align?: 'left' | 'center' | 'right';
}

interface EditableTableProps<T extends { id: string }> {
  data: T[];
  columns: Column<T>[];
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete?: (id: string) => void;
  onAdd?: () => void;
  addButtonLabel?: string;
  emptyMessage?: string;
  className?: string;
}

interface EditableCellProps {
  value: string;
  isEditing: boolean;
  type?: 'text' | 'number' | 'currency';
  align?: 'left' | 'center' | 'right';
  onChange: (value: string) => void;
  onStartEdit: () => void;
  onEndEdit: () => void;
  className?: string;
}

const EditableCell: React.FC<EditableCellProps> = ({
  value,
  isEditing,
  type = 'text',
  align = 'left',
  onChange,
  onStartEdit,
  onEndEdit,
  className = '',
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onChange(localValue);
      onEndEdit();
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      onEndEdit();
    }
  };

  const handleBlur = () => {
    onChange(localValue);
    onEndEdit();
  };

  const alignClass = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  }[align];

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type={type === 'currency' || type === 'number' ? 'number' : 'text'}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        step={type === 'currency' ? '0.01' : undefined}
        className={`w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 border border-green-500 rounded outline-none focus:ring-2 focus:ring-green-500/30 ${alignClass} ${className}`}
      />
    );
  }

  return (
    <div
      onClick={onStartEdit}
      className={`px-2 py-1 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors min-h-[28px] ${alignClass} ${className}`}
    >
      {value || <span className="text-gray-400 italic">Empty</span>}
    </div>
  );
};

export function EditableTable<T extends { id: string }>({
  data,
  columns,
  onUpdate,
  onDelete,
  onAdd,
  addButtonLabel = 'Add new',
  emptyMessage = 'No data yet',
  className = '',
}: EditableTableProps<T>) {
  const [editingCell, setEditingCell] = useState<{ rowId: string; columnKey: string } | null>(null);
  const [pendingUpdates, setPendingUpdates] = useState<Record<string, Partial<T>>>({});

  const handleCellChange = (rowId: string, columnKey: string, value: string) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [columnKey]: value,
      },
    }));
  };

  const handleEndEdit = (rowId: string) => {
    if (pendingUpdates[rowId]) {
      onUpdate(rowId, pendingUpdates[rowId]);
      setPendingUpdates((prev) => {
        const { [rowId]: _, ...rest } = prev;
        return rest;
      });
    }
    setEditingCell(null);
  };

  const isEditing = (rowId: string, columnKey: string) =>
    editingCell?.rowId === rowId && editingCell?.columnKey === columnKey;

  const getValue = (item: T, key: string): string => {
    const keys = key.split('.');
    let value: unknown = item;
    for (const k of keys) {
      value = (value as Record<string, unknown>)?.[k];
    }
    return String(value ?? '');
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                }`}
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
            {onDelete && (
              <th className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">

              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length + (onDelete ? 1 : 0)}
                className="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item) => (
              <tr
                key={item.id}
                className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {columns.map((col) => (
                  <td
                    key={`${item.id}-${String(col.key)}`}
                    className="px-1 py-1"
                    style={{ width: col.width }}
                  >
                    {col.render ? (
                      col.render(
                        item,
                        isEditing(item.id, String(col.key)),
                        (value) => handleCellChange(item.id, String(col.key), value)
                      )
                    ) : col.editable !== false ? (
                      <EditableCell
                        value={getValue(item, String(col.key))}
                        isEditing={isEditing(item.id, String(col.key))}
                        type={col.type}
                        align={col.align}
                        onChange={(value) => handleCellChange(item.id, String(col.key), value)}
                        onStartEdit={() => setEditingCell({ rowId: item.id, columnKey: String(col.key) })}
                        onEndEdit={() => handleEndEdit(item.id)}
                      />
                    ) : (
                      <div className={`px-2 py-1 text-sm ${col.align === 'right' ? 'text-right' : ''}`}>
                        {getValue(item, String(col.key))}
                      </div>
                    )}
                  </td>
                ))}
                {onDelete && (
                  <td className="px-1 py-1 w-10">
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {onAdd && (
        <button
          onClick={onAdd}
          className="mt-2 flex items-center gap-2 px-3 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors w-full"
        >
          <Plus className="w-4 h-4" />
          {addButtonLabel}
        </button>
      )}
    </div>
  );
}

export type { Column };
