import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion';
import { Check, Clock, FileText, Trash2, AlertTriangle, Pencil, GripVertical, Camera } from 'lucide-react';
import { type Business, type Report } from '@/lib/types';
import { cn } from '@/lib/utils';

interface BusinessListProps {
  businesses: Business[];
  reports: Report[];
  onSelect: (business: Business) => void;
  onDelete?: (business: Business) => void;
  onEdit?: (business: Business, newName: string, newImageFile?: File) => void;
  onReorder?: (reordered: Business[]) => void;
}

interface SortableBusinessRowProps {
  biz: Business;
  status?: Report['status'];
  onSelect: (business: Business) => void;
  onDelete?: (business: Business) => void;
  onOpenEdit?: (business: Business) => void;
  reorderEnabled: boolean;
  onDragEnd: () => void;
}

function SortableBusinessRow({
  biz,
  status,
  onSelect,
  onDelete,
  onOpenEdit,
  reorderEnabled,
  onDragEnd,
}: SortableBusinessRowProps) {
  const dragControls = useDragControls();

  return (
    <Reorder.Item
      value={biz}
      dragListener={false}
      dragControls={dragControls}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.01, zIndex: 20 }}
      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
      className="relative"
    >
      <motion.div
        layout
        transition={{ type: 'spring', stiffness: 400, damping: 32 }}
        className="w-full surface-card p-3 sm:p-4 flex items-center justify-between hover:bg-card/80 transition-colors gap-2"
      >
        <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
          {reorderEnabled && (
            <button
              type="button"
              onPointerDown={(e) => dragControls.start(e)}
              onClick={(e) => e.preventDefault()}
              className="cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors flex-shrink-0"
              style={{ touchAction: 'none' }}
              aria-label={`Déplacer ${biz.name}`}
              title="Déplacer"
            >
              <GripVertical className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => onSelect(biz)}
            className="flex items-center gap-2 sm:gap-3 flex-1 text-left btn-press cursor-pointer min-w-0"
          >
            {biz.image ? (
              <img src={biz.image} alt={biz.name} className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg object-cover flex-shrink-0" />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{biz.name}</p>
              <p className="text-xs text-muted-foreground">{biz.pole}</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {status === 'completed' ? (
            <span className="flex items-center gap-1.5 text-xs text-success whitespace-nowrap">
              <Check className="w-3.5 h-3.5" />
              Complété
            </span>
          ) : status === 'draft' ? (
            <span className="flex items-center gap-1.5 text-xs text-warning whitespace-nowrap">
              <Clock className="w-3.5 h-3.5" />
              Brouillon
            </span>
          ) : (
            <span className="text-xs text-muted-foreground whitespace-nowrap">En attente</span>
          )}

          {onOpenEdit && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenEdit(biz);
              }}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-primary hover:bg-primary/10 transition-colors"
              title="Modifier"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setTimeout(() => onDelete(biz), 0);
              }}
              className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-colors"
              title="Supprimer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </motion.div>
    </Reorder.Item>
  );
}

export function BusinessList({ businesses, reports, onSelect, onDelete, onEdit, onReorder }: BusinessListProps) {
  const [confirmDelete, setConfirmDelete] = useState<Business | undefined>();
  const [editingBiz, setEditingBiz] = useState<Business | undefined>();
  const [editName, setEditName] = useState('');
  const [editImagePreview, setEditImagePreview] = useState<string | undefined>();
  const [editImageFile, setEditImageFile] = useState<File | undefined>();
  const [localOrder, setLocalOrder] = useState<Business[]>(businesses);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalOrder(businesses);
  }, [businesses]);

  if (businesses.length === 0) {
    return (
      <div className="surface-card p-8 text-center">
        <p className="text-muted-foreground text-sm">Aucune entreprise dans ce pôle pour le moment.</p>
      </div>
    );
  }

  const openEditModal = (biz: Business) => {
    setEditingBiz(biz);
    setEditName(biz.name);
    setEditImagePreview(biz.image);
    setEditImageFile(undefined);
  };

  const closeEditModal = () => {
    setEditingBiz(undefined);
    setEditImagePreview(undefined);
    setEditImageFile(undefined);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = () => {
    if (!editingBiz || !editName.trim()) return;
    const nameChanged = editName.trim() !== editingBiz.name;
    const imageChanged = !!editImageFile;
    if (nameChanged || imageChanged) {
      onEdit?.(editingBiz, editName.trim(), editImageFile);
    }
    closeEditModal();
  };

  const handlePersistOrder = () => {
    if (!onReorder) return;

    const hasChanged =
      localOrder.length === businesses.length &&
      localOrder.some((business, index) => business.id !== businesses[index]?.id);

    if (hasChanged) {
      onReorder(localOrder);
    }
  };

  const hasChanges = editingBiz && (editName.trim() !== editingBiz.name || !!editImageFile);

  return (
    <>
      <Reorder.Group
        axis="y"
        values={localOrder}
        onReorder={onReorder ? setLocalOrder : () => {}}
        className="space-y-1"
      >
        {localOrder.map((biz) => {
          const report = reports.find((r) => r.businessId === biz.id);

          return (
            <SortableBusinessRow
              key={biz.id}
              biz={biz}
              status={report?.status}
              onSelect={onSelect}
              onDelete={onDelete ? (business) => setConfirmDelete(business) : undefined}
              onOpenEdit={onEdit ? openEditModal : undefined}
              reorderEnabled={!!onReorder}
              onDragEnd={handlePersistOrder}
            />
          );
        })}
      </Reorder.Group>

      <AnimatePresence>
        {editingBiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={closeEditModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-sm font-semibold text-foreground mb-4">Modifier l'entreprise</h3>

              <div className="flex justify-center mb-5">
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={cn(
                    'relative group w-20 h-20 rounded-xl overflow-hidden transition-colors',
                    editImagePreview
                      ? 'border-2 border-transparent hover:border-primary/50'
                      : 'bg-secondary border-2 border-dashed border-border hover:border-primary/50'
                  )}
                >
                  {editImagePreview ? (
                    <img src={editImagePreview} alt={editingBiz.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FileText className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                </button>
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </div>

              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="input-field w-full mb-5"
                placeholder="Nom de l'entreprise"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && hasChanges) {
                    handleSaveEdit();
                  }
                }}
              />
              <div className="flex justify-end gap-3">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={!hasChanges}
                  className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors hover:bg-primary/90 btn-press disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Enregistrer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setConfirmDelete(undefined)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="surface-card p-6 w-full max-w-sm mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Supprimer l'entreprise</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Cette action est irréversible</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-5">
                Voulez-vous vraiment supprimer <span className="text-foreground font-medium">{confirmDelete.name}</span> et tous ses récapitulatifs ?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmDelete(undefined)}
                  className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={() => {
                    onDelete?.(confirmDelete);
                    setConfirmDelete(undefined);
                  }}
                  className="px-4 py-2 text-sm font-medium text-destructive-foreground bg-destructive rounded-lg transition-colors hover:bg-destructive/90 btn-press"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
