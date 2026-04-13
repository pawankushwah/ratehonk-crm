import { useState, useEffect, memo, useTransition } from 'react';
import { Search, Check, Loader2 } from 'lucide-react';
import Input from './Input';
import Icon from './Icon';

interface IconPickerProps {
  onSelect: (iconName: string) => void;
  currentIcon?: string;
}

const IconItem = memo(({ 
  iconName, 
  isSelected, 
  onSelect 
}: { 
  iconName: string; 
  isSelected: boolean; 
  onSelect: (name: string) => void;
}) => {
  const displayName = iconName.includes(':') ? iconName.split(':')[1] : iconName;

  return (
    <button
      type="button"
      onClick={() => onSelect(iconName)}
      className={`
        flex flex-col items-center p-3 rounded-xl border transition-all gap-2 group relative h-[84px] justify-center
        ${isSelected 
          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-[0.98]' 
          : 'bg-white/5 border-glass-border hover:bg-white/10 hover:border-primary/40 text-text-muted hover:text-text-main hover:scale-105'
        }
      `}
      title={iconName}
    >
      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-white/5 group-hover:bg-primary/10'}`}>
        <Icon icon={iconName} size={20} className={isSelected ? 'text-white' : 'text-text-muted group-hover:text-primary'} />
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter truncate w-full text-center leading-tight ${isSelected ? 'text-white' : 'text-text-muted group-hover:text-text-main'}`}>
        {displayName.replace(/-/g, ' ')}
      </span>
      {isSelected && (
        <div className="absolute top-1 right-1 bg-white rounded-full p-0.5 text-primary shadow-sm animate-in zoom-in duration-200">
          <Check size={8} strokeWidth={4} />
        </div>
      )}
    </button>
  );
});

const IconPicker = ({ onSelect, currentIcon }: IconPickerProps) => {
  const [icons, setIcons] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSearching, startTransition] = useTransition();

  // Initial fetch (Lucide collection)
  useEffect(() => {
    const fetchDefaultIcons = async () => {
      try {
        const res = await fetch('https://api.iconify.design/collection?prefix=lucide&limit=25');
        const data = await res.json();
        const allIcons = Object.values(data.categories).flat() as string[];
        const uniqueIcons = Array.from(new Set(allIcons)).map(name => `lucide:${name}`).sort();
        setIcons(uniqueIcons);
      } catch (err) {
        console.error('Failed to fetch default icons', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDefaultIcons();
  }, []);

  // Debounced search for all types of icons
  useEffect(() => {
    if (!search.trim()) return;

    const handler = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`https://api.iconify.design/search?query=${encodeURIComponent(search)}&limit=25`);
        const data = await res.json();
        
        // Use transition to keep the input responsive
        startTransition(() => {
          if (data && data.icons) {
            setIcons(data.icons);
          } else {
            setIcons([]);
          }
        });
      } catch (err) {
        console.error('Search failed', err);
        setError('Failed to search icons');
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [search]);

  return (
    <div className="flex flex-col h-full space-y-4 max-h-[500px]">
      <div className="sticky top-0 bg-transparent backdrop-blur-sm pb-2 z-10">
        <Input 
          icon={Search}
          placeholder="Search all 150,000+ icons (e.g. 'home', 'mdi:user')..."
          value={search}
          onChange={(e: any) => setSearch(e.target.value)}
          className="!mb-0"
        />
      </div>

      {(loading || isSearching) ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-2 py-10">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-xs font-bold uppercase tracking-widest animate-pulse">
            {search ? 'Searching Registry...' : 'Loading Library...'}
          </span>
        </div>
      ) : error ? (
        <div className="flex-1 flex flex-col items-center justify-center text-red-400 gap-2 py-10">
          <span className="text-xs font-bold uppercase tracking-widest">{error}</span>
          <button 
            onClick={() => setSearch(search)} 
            className="text-[10px] underline underline-offset-4 hover:text-primary transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar flex-1 pb-4">
          {icons.length === 0 ? (
            <div className="col-span-full py-10 text-center text-text-muted italic text-xs">
              No icons found for "{search}"
            </div>
          ) : (
            icons.map((iconName) => (
              <IconItem 
                key={iconName}
                iconName={iconName}
                isSelected={currentIcon === iconName}
                onSelect={onSelect}
              />
            ))
          )}
        </div>
      )}
      {!loading && !search && icons.length > 0 && (
        <p className="text-[10px] text-text-muted text-center italic opacity-60">Showing featured icons. Search to explore all sets.</p>
      )}
    </div>
  );
};

export default IconPicker;
