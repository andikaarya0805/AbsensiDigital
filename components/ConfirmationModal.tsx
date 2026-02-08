'use client';

import { X, AlertTriangle, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    isLoading?: boolean;
}

export default function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Konfirmasi',
    cancelText = 'Batal',
    variant = 'danger',
    isLoading = false
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    const colors = {
        danger: {
            bg: 'bg-red-50 dark:bg-red-900/20',
            text: 'text-red-600 dark:text-red-400',
            border: 'border-red-100 dark:border-red-900/50',
            button: 'bg-red-600 hover:bg-red-700 text-white shadow-red-200',
            icon: AlertTriangle
        },
        warning: {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            text: 'text-amber-600 dark:text-amber-400',
            border: 'border-amber-100 dark:border-amber-900/50',
            button: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200',
            icon: AlertTriangle
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            text: 'text-blue-600 dark:text-blue-400',
            border: 'border-blue-100 dark:border-blue-900/50',
            button: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-200',
            icon: AlertTriangle
        }
    };

    const style = colors[variant];
    const Icon = style.icon;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
                <div className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto ${style.bg} ${style.text} rounded-2xl flex items-center justify-center mb-6 border ${style.border}`}>
                        <Icon className="h-8 w-8" />
                    </div>

                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
                        {title}
                    </h3>

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                        {message}
                    </p>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 ${style.button}`}
                        >
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
