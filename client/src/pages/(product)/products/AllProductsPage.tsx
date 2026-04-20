import { useState } from 'react';
import ProductBasePage from './ProductBasePage';

const AllProductsPage = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'inventory' | 'non-inventory' | 'bundle' | 'service'>('all');

  const tabs = [
    { id: 'all' as const, label: 'All Products' },
    { id: 'inventory' as const, label: 'Inventory' },
    { id: 'non-inventory' as const, label: 'Non-inventory' },
    { id: 'bundle' as const, label: 'Bundles' },
    { id: 'service' as const, label: 'Services' },
  ];

  const filterToggle = (
    <div className="flex items-center p-1 bg-slate-100/80 border border-slate-200 rounded-xl w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`
            px-5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all duration-200
            ${activeTab === tab.id 
              ? 'bg-white text-slate-900 shadow-sm' 
              : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'
            }
          `}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <ProductBasePage 
      title={tabs.find(t => t.id === activeTab)?.label || "Products"} 
      activeTab={activeTab}
      allTypes={activeTab === 'all'}
      templateName={activeTab === 'all' ? undefined : activeTab}
      extraHeader={filterToggle}
    />
  );
};

export default AllProductsPage;
