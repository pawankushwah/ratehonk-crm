import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  List, 
  Trash2, 
  Edit3, 
  Loader2, 
  X, 
  Check, 
  ChevronLeft 
} from 'lucide-react';
import { useLocation } from 'wouter';
import Button from '@/components/products/Button';
import GlassCard from '@/components/products/GlassCard';
import Drawer from '@/components/products/Drawer';
import Input from '@/components/products/Input';
import { useSnackbar } from '@/components/products/SnackbarContext';
import { 
  getDropdowns, 
  createDropdown, 
  updateDropdown, 
  deleteDropdown, 
} from '@/lib/dropdowns';
import type { Dropdown } from '@/lib/dropdowns';
import { Layout } from '@/components/layout/layout';

const DropdownsPage = () => {
  const [, setLocation] = useLocation();
  const [dropdowns, setDropdowns] = useState<Dropdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingDropdown, setEditingDropdown] = useState<Dropdown | null>(null);
  const [options, setOptions] = useState<any[]>([]);
  const [dropdownName, setDropdownName] = useState('');
  const [newOption, setNewOption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { showSnackbar } = useSnackbar();


  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = await getDropdowns();
      setDropdowns(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Failed to fetch dropdowns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDrawer = (dropdown?: Dropdown) => {
    if (dropdown) {
      setEditingDropdown(dropdown);
      setDropdownName(dropdown.name);
      setOptions(dropdown.options || []);
    } else {
      setEditingDropdown(null);
      setDropdownName('');
      setOptions([]);
    }
    setIsDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!dropdownName.trim()) return showSnackbar('Please enter a name', 'warning');
    if (options.length === 0) return showSnackbar('Please add at least one option', 'warning');

    setIsSaving(true);
    try {
      if (editingDropdown) {
        // Send values as strings or objects as expected by backend
        const optionValues = options.map(o => typeof o === 'string' ? o : o.value);
        await updateDropdown(editingDropdown.id, { name: dropdownName, options: optionValues });
      } else {
        const optionValues = options.map(o => typeof o === 'string' ? o : o.value);
        await createDropdown({ name: dropdownName, options: optionValues });
      }
      setIsDrawerOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save dropdown:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure?')) return;
    try {
      await deleteDropdown(id);
      fetchData();
    } catch (error) {
      console.error('Failed to delete dropdown:', error);
    }
  };

  return (
    <Layout>
      <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline"
              size="sm"
              icon={ChevronLeft} 
              onClick={() => setLocation('/dashboard/forms')}
              className="bg-white border-slate-200 hover:bg-slate-50"
            >
              Back to Forms
            </Button>
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-text-main">Library Dropdowns</h1>
              <p className="text-text-muted text-sm italic">Manage sets of options to reuse across multiple form templates</p>
            </div>
          </div>
          <Button icon={Plus} onClick={() => handleOpenDrawer()} className="shadow-xl shadow-primary/20">
            Create New Dropdown
          </Button>
        </div>

        {isLoading ? (
          <div className="flex h-[40vh] items-center justify-center">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {dropdowns.map((dropdown) => (
              <div 
                key={dropdown.id} 
                onClick={() => handleOpenDrawer(dropdown)}
                className="cursor-pointer group"
              >
                <GlassCard className="p-0 overflow-hidden group-hover:border-primary/30 transition-all h-full">
                  <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center">
                      <List size={24} />
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleOpenDrawer(dropdown); }}
                        className="p-2 text-text-muted hover:text-primary transition-colors hover:bg-slate-50 rounded-lg"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(dropdown.id, e)}
                        className="p-2 text-text-muted hover:text-red-500 transition-colors hover:bg-slate-50 rounded-lg"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold text-text-main mb-1 truncate">{dropdown.name}</h3>
                    <p className="text-xs text-text-muted font-medium opacity-60 italic">{(dropdown.options?.length || 0)} Predefined Options</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {dropdown.options?.slice(0, 5).map((opt: any) => (
                      <span key={opt.id || (typeof opt === 'string' ? opt : opt.value)} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-text-muted">
                        {typeof opt === 'string' ? opt : opt.label}
                      </span>
                    ))}
                    {(dropdown.options?.length || 0) > 5 && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-primary">
                        +{(dropdown.options?.length || 0) - 5} more
                      </span>
                    )}
                  </div>
                    </div>
                  </GlassCard>
                </div>
              ))}
            </div>
        )}

        {!isLoading && dropdowns.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-3xl animate-in fade-in zoom-in-95 duration-500 shadow-sm">
            <div className="w-20 h-20 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mb-6">
              <List size={40} />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">No library dropdowns yet</h3>
            <p className="text-text-muted text-center max-w-sm mb-8 italic">
              Create standard sets of options once and reuse them in any form template across the platform.
            </p>
            <Button icon={Plus} onClick={() => handleOpenDrawer()}>Create First Dropdown</Button>
          </div>
        )}

        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={editingDropdown ? 'Edit Dropdown' : 'New Reusable Dropdown'}
          widthClassName="max-w-3xl"
        >
          <div className="p-6 space-y-8 flex flex-col h-full overflow-hidden">
            <div className="space-y-4">
              <Input 
                label="Dropdown Name" 
                placeholder="e.g., Country List, Work Status..." 
                value={dropdownName}
                onChange={(e: any) => setDropdownName(e.target.value)}
              />
            </div>

            <div className="flex-1 min-h-0 flex flex-col space-y-1.5">
              <label className="text-[12px] font-bold text-slate-700 dark:text-slate-300 tracking-tight px-0.5">Manage Options</label>
              
              <div className="flex gap-2">
                <Input 
                  placeholder="Add new option..." 
                  value={newOption}
                  onChange={(e: any) => setNewOption(e.target.value)}
                  onKeyPress={(e: any) => {
                    if (e.key === 'Enter' && newOption.trim()) {
                      const val = newOption.trim();
                      if (!options.some(o => (typeof o === 'string' ? o : o.value) === val)) {
                        setOptions([...options, { id: `temp_${Date.now()}`, value: val, label: val }]);
                      }
                      setNewOption('');
                    }
                  }}
                  className="flex-1! h-11!"
                />
                <Button 
                  onClick={() => {
                    if (newOption.trim()) {
                      const val = newOption.trim();
                      if (!options.some(o => (typeof o === 'string' ? o : o.value) === val)) {
                        setOptions([...options, { id: `temp_${Date.now()}`, value: val, label: val }]);
                      }
                      setNewOption('');
                    }
                  }}
                  className="px-6"
                >
                  Add
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar min-h-0">
                {options.map((opt, idx) => {
                  const label = typeof opt === 'string' ? opt : opt.label;
                  const id = typeof opt === 'string' ? opt : opt.id || idx;
                  return (
                    <div key={id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 group/opt">
                      <span className="text-sm font-bold text-text-main">{label}</span>
                      <button 
                        onClick={() => setOptions(options.filter((_, i) => i !== idx))}
                        className="p-1 text-text-muted hover:text-red-500 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
                {options.length === 0 && (
                  <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl opacity-40 italic text-sm">
                    No options added yet
                  </div>
                )}
              </div>
            </div>

            <Button 
              className="w-full h-14 shadow-xl shadow-primary/20 mt-auto"
              icon={isSaving ? Loader2 : Check}
              disabled={isSaving}
              onClick={handleSave}
            >
              {isSaving ? 'Saving...' : editingDropdown ? 'Update Dropdown' : 'Create Dropdown'}
            </Button>
          </div>
        </Drawer>
      </div>
    </Layout>
  );
};

export default DropdownsPage;
