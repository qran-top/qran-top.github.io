import React, { useState } from 'react';
import type { SavedItem } from '../../types';
import { TrashIcon, SearchIcon, BookOpenIcon, PencilIcon, CheckIcon } from '../icons';
import { timeAgo } from '../../utils/date';

interface SavedItemCardProps { 
    item: SavedItem, 
    onDelete: () => void,
    onUpdateNotes: (notes: string) => void,
}

const SavedItemCard: React.FC<SavedItemCardProps> = ({ item, onDelete, onUpdateNotes }) => {
    const [isEditingNotes, setIsEditingNotes] = useState(false);
    const [noteText, setNoteText] = useState(item.notes || '');
    
    const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault();
        window.location.hash = e.currentTarget.getAttribute('href')!;
    };
    
    const handleSaveNote = () => {
        onUpdateNotes(noteText.trim());
        setIsEditingNotes(false);
    };

    const handleCancelEdit = () => {
        setNoteText(item.notes || '');
        setIsEditingNotes(false);
    };
    
    return (
        <li className="bg-surface-subtle p-4 rounded-xl shadow-sm transition-shadow duration-200 hover:shadow-lg flex flex-col gap-3">
            <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-primary mt-1">
                    {item.type === 'ayah' ? <BookOpenIcon className="w-5 h-5"/> : <SearchIcon className="w-5 h-5"/>}
                </div>
                <div className="flex-grow">
                    {item.type === 'ayah' && (
                        <a href={`#/surah/${item.surah}?ayah=${item.ayah}`} onClick={handleClick} className="block hover:underline">
                            <p className="font-quran text-lg text-text-primary text-justify" style={{ textAlign: 'justify', textJustify: 'inter-word' }}>{item.text}</p>
                            <p className="text-sm font-bold text-primary-text mt-1 font-quran-title">سورة {item.surah} : الآية {item.ayah}</p>
                        </a>
                    )}
                    {item.type === 'search' && (
                         <a href={`#/search/${encodeURIComponent(item.query)}`} onClick={handleClick} className="block hover:underline">
                            <p className="font-semibold text-lg text-text-primary">بحث عن: "{item.query}"</p>
                        </a>
                    )}
                    <p className="text-xs text-text-subtle mt-2">{timeAgo(item.createdAt)}</p>
                </div>
                 <button 
                    onClick={onDelete} 
                    className="p-2 -m-2 rounded-full text-text-subtle hover:text-red-600 hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors flex-shrink-0"
                    title="حذف العنصر"
                >
                    <TrashIcon className="w-5 h-5" />
                </button>
            </div>
            
            {/* --- Tadabbur Notes Section --- */}
            <div className="border-t border-border-default pt-3">
                {isEditingNotes ? (
                    <div>
                        <textarea
                            id={`note-editor-${item.id}`}
                            name="noteText"
                            aria-label="اكتب تدبرك حول هذه الآية"
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="اكتب تدبرك هنا..."
                            className="w-full p-2 border border-border-default rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
                            rows={4}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2 mt-2">
                            <button onClick={handleCancelEdit} className="px-4 py-2 text-sm rounded-md bg-surface-subtle hover:bg-surface-hover transition-colors">
                                إلغاء
                            </button>
                            <button onClick={handleSaveNote} className="px-4 py-2 text-sm text-white rounded-md bg-primary hover:bg-primary-hover flex items-center gap-2">
                                <CheckIcon className="w-4 h-4" />
                                <span>حفظ التدبر</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex justify-between items-start gap-2">
                        {item.notes ? (
                            <blockquote className="text-text-secondary whitespace-pre-wrap flex-grow italic border-r-4 border-primary pr-4 py-1">
                                {item.notes}
                            </blockquote>
                        ) : (
                            <p className="text-sm text-text-muted flex-grow py-1">لا توجد ملاحظات.</p>
                        )}
                        <button 
                            onClick={() => setIsEditingNotes(true)} 
                            className="p-2 -m-2 rounded-full text-text-subtle hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex-shrink-0" 
                            title={item.notes ? "تعديل التدبر" : "إضافة تدبر"}
                        >
                            <PencilIcon className="w-5 h-5" />
                        </button>
                    </div>
                )}
            </div>
        </li>
    );
};

export default SavedItemCard;
