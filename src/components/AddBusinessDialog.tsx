import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, ImagePlus, Loader2 } from 'lucide-react';
import { type Pole, POLES } from '@/lib/types';
import { cn } from '@/lib/utils';
import { uploadBusinessLogo } from '@/lib/storage';

interface AddBusinessDialogProps {
  defaultPole?: Pole;
  onAdd: (name: string, pole: Pole, image?: string) => void;
}

export function AddBusinessDialog({ defaultPole, onAdd }: AddBusinessDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [pole, setPole] = useState<Pole>(defaultPole ?? POLES[0]);
  const [imagePreview, setImagePreview] = useState<string | undefined>();
  const [imageFile, setImageFile] = useState<File | undefined>();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setUploading(true);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadBusinessLogo(imageFile);
      }
      onAdd(name.trim(), pole, imageUrl);
      setName('');
      setPole(defaultPole ?? POLES[0]);
      setImagePreview(undefined);
      setImageFile(undefined);
      setOpen(false);
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setName('');
    setImagePreview(undefined);
    setImageFile(undefined);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors btn-press flex items-center gap-2 hover:bg-primary/90"
      >
        <Plus className="w-4 h-4" />
        Ajouter une entreprise
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="surface-card p-6 w-full max-w-md mx-4"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-foreground">Nouvelle entreprise</h3>
                <button onClick={handleClose} className="p-1 rounded-lg hover:bg-secondary transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Image upload */}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      'w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden transition-colors',
                      !imagePreview && 'bg-secondary flex items-center justify-center hover:bg-secondary/80'
                    )}
                  >
                    {imagePreview ? (
                      <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImagePlus className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <p className="text-xs text-muted-foreground">
                    {imagePreview ? 'Cliquez pour changer' : 'Ajouter un logo'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Nom de l'entreprise</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="input-field"
                    placeholder="Ex: Burgershot"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">Pôle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {POLES.map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPole(p)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-xs font-medium transition-colors border',
                          pole === p
                            ? 'bg-primary/10 border-primary/50 text-primary'
                            : 'border-border bg-secondary/30 text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground bg-secondary rounded-lg transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={!name.trim() || uploading}
                    className="px-4 py-2 text-sm font-medium text-primary-foreground bg-primary rounded-lg transition-colors btn-press hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    {uploading ? 'Upload…' : 'Ajouter'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
