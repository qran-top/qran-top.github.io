import React, { useState, useMemo } from 'react';
// FIX: Import Collection type to be used in type assertions.
import type { SavedItem, Collections, Collection } from '../types';
import { BookmarkIcon, ClearIcon, PlusIcon } from './icons';

interface SaveItemModalProps {
    item: SavedItem;
    collections: Collections;
    onClose: () => void;
    onSave: (collectionId: string, newCollectionName?: string) => void;
}

const SaveItemModal: React.FC<SaveItemModalProps> = ({ item, collections, onClose, onSave }) => {
    const [newCollectionName, setNewCollectionName] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const collectionList = useMemo(() => {
        // FIX: Add explicit types to sort callback parameters to fix 'property does not exist on type unknown' error.
        return Object.values(collections).sort((a: Collection, b: Collection) => b.createdAt - a.createdAt);
    }, [collections]);

    const handleCreateAndSave = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCollectionName.trim();
        if (trimmedName) {
            onSave('', trimmedName);
        }
    };

    const handleSaveToExisting = (collectionId: string) => {
        onSave(collectionId);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-item-title"
        >
            <div 
                className="bg-surface rounded-lg shadow-xl w-full max-w-md mx-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-5 border-b border-border-default flex justify-between items-center">
                    <h2 id="save-item-title" className="text-xl font-bold text-text-primary flex items-center gap-2">
                        <BookmarkIcon className="w-6 h-6 text-primary" />
                        حفظ في دفتر التدبر
                    </h2>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-hover">
                        <ClearIcon className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-5">
                    <div className="mb-4 p-3 bg-surface-subtle rounded-md border border-border-default">
                        <p className="font-semibold text-text-secondary">العنصر المراد حفظه:</p>
                        {item.type === 'ayah' && (
                            <p className="text-sm text-text-muted truncate">
                                <strong>آية:</strong> {item.text} <span className="font-mono opacity-80">({item.surah}:{item.ayah})</span>
                            </p>
                        )}
                        {item.type === 'search' && (
                            <p className="text-sm text-text-muted">
                                <strong>بحث:</strong> "{item.query}"
                            </p>
                        )}
                    </div>

                    {collectionList.length > 0 && !isCreating && (
                        <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                            <h3 className="text-md font-semibold text-text-secondary mb-2">اختر مجموعة:</h3>
                            {collectionList.map(collection => (
                                <button 
                                    key={collection.id}
                                    onClick={() => handleSaveToExisting(collection.id)}
                                    className="w-full text-right p-3 bg-surface-subtle rounded-md hover:bg-surface-active transition-colors"
                                >
                                    {collection.name}
                                </button>
                            ))}
                        </div>
                    )}
                    
                    <div className="mt-4 pt-4 border-t border-border-default">
                        {isCreating ? (
                             <form onSubmit={handleCreateAndSave}>
                                <label htmlFor="newCollection" className="block text-md font-semibold text-text-secondary mb-2">
                                    اسم المجموعة الجديدة:
                                </label>
                                <input
                                    id="newCollection"
                                    name="newCollection"
                                    aria-label="اسم المجموعة الجديدة"
                                    type="text"
                                    value={newCollectionName}
                                    onChange={(e) => setNewCollectionName(e.target.value)}
                                    placeholder="مثال: آيات الصبر"
                                    className="w-full p-2 border border-border-default rounded-md bg-surface focus:outline-none focus:ring-2 focus:ring-primary"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2 mt-3">
                                    <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2 text-sm rounded-md bg-surface-subtle hover:bg-surface-hover">
                                        إلغاء
                                    </button>
                                    <button type="submit" className="px-4 py-2 text-sm text-white rounded-md bg-primary hover:bg-primary-hover" disabled={!newCollectionName.trim()}>
                                        إنشاء وحفظ
                                    </button>
                                </div>
                            </form>
                        ) : (
                             <button 
                                onClick={() => setIsCreating(true)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors"
                             >
                                <PlusIcon className="w-5 h-5" />
                                <span>إنشاء مجموعة جديدة</span>
                             </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SaveItemModal;