import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../lib/api';
import { X, Loader2 } from 'lucide-react';
import axios from 'axios';

interface ResolveTicketDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ticketId: string | null;
  assetTag?: string;
}

const resolveSchema = z.object({
  cost: z.number().min(0, 'Cost must be a positive number'),
  assetStatus: z.enum(['AVAILABLE', 'RETIRED', 'DISPOSED']),
  notes: z.string().optional(),
});

type ResolveFormValues = z.infer<typeof resolveSchema>;

export const ResolveTicketDialog: React.FC<ResolveTicketDialogProps> = ({
  isOpen,
  onClose,
  onSuccess,
  ticketId,
  assetTag,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResolveFormValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: {
      cost: 0,
      assetStatus: 'AVAILABLE',
      notes: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        cost: 0,
        assetStatus: 'AVAILABLE',
        notes: '',
      });
    }
  }, [isOpen, reset]);

  if (!isOpen || !ticketId) return null;

  const onSubmit = async (data: ResolveFormValues) => {
    try {
      await api.post(`/api/maintenance/${ticketId}/resolve`, data);
      onSuccess();
      onClose();
    } catch (err) {
      let apiError = 'Failed to resolve ticket';
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
          <h2 className="text-xl font-bold text-white">
            Resolve Ticket {assetTag ? `for ${assetTag}` : ''}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-900 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Repair Cost ($)
            </label>
            <input
              type="number"
              step="0.01"
              {...register('cost', { valueAsNumber: true })}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
            {errors.cost && <p className="mt-1 text-xs text-red-400">{errors.cost.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Final Device Status
            </label>
            <select
              {...register('assetStatus')}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-slate-200 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="AVAILABLE">Available (Repaired)</option>
              <option value="RETIRED">Retired</option>
              <option value="DISPOSED">Disposed</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
              Resolution Notes
            </label>
            <textarea
              rows={4}
              {...register('notes')}
              className="w-full rounded-xl border border-slate-800 bg-slate-900 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary resize-none"
              placeholder="Replaced screen panel, power supply block repaired..."
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
                  Resolving...
                </>
              ) : (
                'Resolve Ticket'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
