import React, { useState } from 'react';
import CustomSelect from './CustomSelect';
import Input from './Input';
import Modal from './Modal';
import Button from './Button';

interface Option {
  label: string;
  value: string;
}

interface AddableSelectProps {
  label?: string;
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  onAdd?: (newValue: string) => Promise<void> | void;
  addNewLabel?: string;
  placeholder?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
}

const AddableSelect: React.FC<AddableSelectProps> = ({
  label,
  options,
  value,
  onChange,
  onAdd,
  addNewLabel = 'Add New',
  placeholder,
  error,
  required,
  disabled
}) => {
  const [showAddInput, setShowAddInput] = useState(false);
  const [newValue, setNewValue] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const handleSave = async () => {
    const trimmedValue = newValue.trim();
    if (!trimmedValue || !onAdd) return;

    setIsAdding(true);
    try {
      await onAdd(trimmedValue);
      setNewValue('');
      setShowAddInput(false);
    } catch (err) {
      console.error('Failed to add new option:', err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-4">
      <CustomSelect
        label={label}
        options={options}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        error={error}
        required={required}
        disabled={disabled || isAdding}
        onAddNew={onAdd ? () => setShowAddInput(true) : undefined}
        addNewLabel={addNewLabel}
      />

      <Modal 
        isOpen={showAddInput} 
        onClose={() => setShowAddInput(false)}
        title={addNewLabel}
      >
        <div className="space-y-6">
          <Input
            placeholder={`Enter new ${label?.toLowerCase() || 'option'} name...`}
            value={newValue}
            onChange={(e: any) => setNewValue(e.target.value)}
            autoFocus
            disabled={isAdding}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSave();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
          />
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={handleSave}
              disabled={isAdding || !newValue.trim()}
              className="flex-1 h-12"
            >
              {isAdding ? 'Adding...' : 'Save & Select'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowAddInput(false)}
              disabled={isAdding}
              className="px-6 h-12"
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddableSelect;

