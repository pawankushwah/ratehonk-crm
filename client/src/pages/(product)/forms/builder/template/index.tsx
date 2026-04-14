import React from 'react';
import CardRenderer from '@/components/products/CardRenderer';
import { VERTICAL_TEMPLATES, HORIZONTAL_TEMPLATES, DETAIL_TEMPLATES } from '../templates';
import { Brush } from 'lucide-react';

export default function TemplatesListPage(){
    return (
        <div className="min-h-screen bg-slate-50 p-8 pt-20">
            <div className="max-w-7xl mx-auto space-y-16">
              
              <div className="space-y-4">
                  <h1 className="text-4xl font-black tracking-tight text-slate-900">Template Gallery</h1>
                  <p className="text-slate-500 font-medium">Browse and preview all available dynamic card and detail templates.</p>
              </div>

              {[
                { title: 'Vertical Card Templates', collection: VERTICAL_TEMPLATES, mode: 'card' as const },
                { title: 'Horizontal List Templates', collection: HORIZONTAL_TEMPLATES, mode: 'card' as const },
                { title: 'Detail Page Templates', collection: DETAIL_TEMPLATES, mode: 'view' as const },
              ].map((group, idx) => (
                <div key={idx} className="space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-200 pb-4">
                        <Brush className="text-indigo-500" />
                        <h2 className="text-2xl font-bold text-slate-800">{group.title}</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {group.collection.map((tmpl) => (
                            <div key={tmpl.id} className="flex flex-col gap-4">
                               <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm h-[400px] overflow-hidden flex items-center justify-center relative group">
                                    <div className={`transition-all duration-500 origin-center ${group.mode === 'view' ? 'scale-[0.22] hover:scale-[0.25] h-full w-[1200px]' : 'scale-[0.7] hover:scale-[0.75]'}`}>
                                        <CardRenderer
                                            mode={group.mode}
                                            data={tmpl.mockData || {}}
                                            design={{ 
                                                templateId: tmpl.id, 
                                                viewTemplateId: tmpl.id, 
                                                theme: 'light', 
                                                styles: { borderRadius: 'lg', shadow: 'none', padding: 'md', fontFamily: 'plus-jakarta', primaryColor: '#6366f1' } 
                                            }}
                                            isPreview={true}
                                        />
                                    </div>
                               </div>
                               <div>
                                   <div className="flex items-center justify-between">
                                      <h3 className="font-black text-slate-900">{tmpl.name}</h3>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 border border-slate-200 px-2 py-0.5 rounded-full">{tmpl.id}</span>
                                   </div>
                                   <p className="text-xs text-slate-500 mt-1 line-clamp-2">{tmpl.description || "Dynamic mapped retail template."}</p>
                               </div>
                            </div>
                        ))}
                    </div>
                </div>
              ))}
            </div>
        </div>
    )
}