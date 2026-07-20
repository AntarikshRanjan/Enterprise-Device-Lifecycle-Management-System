import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface Category {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  tag: string;
  serialNumber: string;
  brand: string;
  model: string;
  cost: string;
  status: string;
  purchaseDate: string;
  warrantyExpiry?: string | null;
  categoryId: string;
  imageUrl?: string | null;
}

interface AssetFormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assetToEdit?: Asset | null;
  categories: Category[];
}

const assetSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  categoryId: z.string().uuid('Please select a valid category'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
  cost: z.number().min(0, 'Cost must be a positive number'),
  warrantyExpiry: z.string().optional().nullable(),
  status: z.string().optional(),
  imageUrl: z.string().optional().nullable(),
});

type AssetFormValues = z.infer<typeof assetSchema>;

export const AssetFormDialog: React.FC<AssetFormDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  assetToEdit,
  categories,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      serialNumber: '',
      brand: '',
      model: '',
      categoryId: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      cost: 0,
      warrantyExpiry: '',
      status: 'AVAILABLE',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (assetToEdit) {
      reset({
        serialNumber: assetToEdit.serialNumber,
        brand: assetToEdit.brand,
        model: assetToEdit.model,
        categoryId: assetToEdit.categoryId,
        purchaseDate: new Date(assetToEdit.purchaseDate).toISOString().split('T')[0],
        cost: parseFloat(assetToEdit.cost),
        warrantyExpiry: assetToEdit.warrantyExpiry
          ? new Date(assetToEdit.warrantyExpiry).toISOString().split('T')[0]
          : '',
        status: assetToEdit.status,
        imageUrl: assetToEdit.imageUrl || '',
      });
    } else {
      reset({
        serialNumber: '',
        brand: '',
        model: '',
        categoryId: '',
        purchaseDate: new Date().toISOString().split('T')[0],
        cost: 0,
        warrantyExpiry: '',
        status: 'AVAILABLE',
        imageUrl: '',
      });
    }
  }, [assetToEdit, reset, isOpen]);

  if (!isOpen) return null;

  const onSubmit = async (data: AssetFormValues) => {
    try {
      const payload = {
        ...data,
        warrantyExpiry: data.warrantyExpiry || null,
        imageUrl: data.imageUrl || null,
      };

      if (assetToEdit) {
        await api.put(`/api/assets/${assetToEdit.id}`, payload);
      } else {
        await api.post('/api/assets', payload);
      }
      onSuccess();
      onClose();
    } catch (err) {
      let apiError = 'Failed to save asset';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { error?: string };
        apiError = data.error || apiError;
      }
      alert(apiError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <h2 className="text-xl font-bold text-white">
            {assetToEdit ? `Edit Asset: ${assetToEdit.tag}` : 'Add New Asset'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Brand
              </label>
              <input
                type="text"
                {...register('brand')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="Apple, Dell, LG"
              />
              {errors.brand && <p className="mt-1 text-xs text-red-400">{errors.brand.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Model
              </label>
              <input
                type="text"
                {...register('model')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                placeholder="MacBook Pro, XPS 15"
              />
              {errors.model && <p className="mt-1 text-xs text-red-400">{errors.model.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Serial Number
            </label>
            <input
              type="text"
              {...register('serialNumber')}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Unique manufacturer identifier"
            />
            {errors.serialNumber && (
              <p className="mt-1 text-xs text-red-400">{errors.serialNumber.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Category
              </label>
              <select
                {...register('categoryId')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              {errors.categoryId && (
                <p className="mt-1 text-xs text-red-400">{errors.categoryId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Cost ($)
              </label>
              <input
                type="number"
                step="0.01"
                {...register('cost', { valueAsNumber: true })}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.cost && <p className="mt-1 text-xs text-red-400">{errors.cost.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Purchase Date
              </label>
              <input
                type="date"
                {...register('purchaseDate')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-xs text-red-400">{errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Warranty Expiry
              </label>
              <input
                type="date"
                {...register('warrantyExpiry')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {assetToEdit && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                {...register('status')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="AVAILABLE">Available</option>
                <option value="ASSIGNED">Assigned</option>
                <option value="MAINTENANCE">Maintenance</option>
                <option value="RETURNED">Returned</option>
                <option value="RETIRED">Retired</option>
                <option value="DISPOSED">Disposed</option>
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Image URL
            </label>
            <input
              type="text"
              {...register('imageUrl')}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="https://example.com/image.png (Optional)"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-900 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-primary/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Asset'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
