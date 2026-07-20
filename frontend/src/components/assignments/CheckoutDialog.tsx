import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface AvailableAsset {
  id: string;
  tag: string;
  brand: string;
  model: string;
}

interface EmployeeUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const checkoutSchema = z.object({
  assetId: z.string().uuid('Please select an asset'),
  userId: z.string().uuid('Please select an employee'),
  returnNotes: z.string().optional(),
});

type CheckoutFormValues = z.infer<typeof checkoutSchema>;

export const CheckoutDialog: React.FC<CheckoutDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [assets, setAssets] = useState<AvailableAsset[]>([]);
  const [employees, setEmployees] = useState<EmployeeUser[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      assetId: '',
      userId: '',
      returnNotes: '',
    },
  });

  // Fetch lists on open
  useEffect(() => {
    if (!isOpen) return;

    async function fetchLists() {
      setIsLoadingLists(true);
      try {
        const [assetsRes, usersRes] = await Promise.all([
          api.get<{ assets: AvailableAsset[] }>('/api/assets', {
            params: { status: 'AVAILABLE', limit: 100 },
          }),
          api.get<EmployeeUser[]>('/api/auth/users'),
        ]);
        setAssets(assetsRes.data.assets);
        setEmployees(usersRes.data);
      } catch (err) {
        console.error('Failed to load lists for checkout modal', err);
      } finally {
        setIsLoadingLists(false);
      }
    }

    fetchLists();
    reset({
      assetId: '',
      userId: '',
      returnNotes: '',
    });
  }, [isOpen, reset]);

  if (!isOpen) return null;

  const onSubmit = async (data: CheckoutFormValues) => {
    try {
      await api.post('/api/assignments/checkout', data);
      onSuccess();
      onClose();
    } catch (err) {
      let apiError = 'Failed to checkout asset';
      if (axios.isAxiosError(err) && err.response?.data) {
        const data = err.response.data as { error?: string };
        apiError = data.error || apiError;
      }
      alert(apiError);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-900">
          <h2 className="text-xl font-bold text-white">Checkout Device</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {isLoadingLists ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Select Available Asset
              </label>
              <select
                {...register('assetId')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose device...</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.tag} - {a.brand} {a.model}
                  </option>
                ))}
              </select>
              {errors.assetId && (
                <p className="mt-1 text-xs text-red-400">{errors.assetId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Assign to Employee
              </label>
              <select
                {...register('userId')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">Choose employee...</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} ({e.email})
                  </option>
                ))}
              </select>
              {errors.userId && (
                <p className="mt-1 text-xs text-red-400">{errors.userId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                Checkout Notes
              </label>
              <textarea
                rows={3}
                {...register('returnNotes')}
                className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
                placeholder="Assigning for remote work setup..."
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
                    Checking out...
                  </>
                ) : (
                  'Checkout Device'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
