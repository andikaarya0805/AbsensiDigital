'use client';

import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Scan } from 'lucide-react';

interface ScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onScanError?: (error: string) => void;
}

export default function Scanner({ onScanSuccess, onScanError }: ScannerProps) {
    const scannerRef = useRef<Html5QrcodeScanner | null>(null);

    useEffect(() => {
        // Standard setup for html5-qrcode
        scannerRef.current = new Html5QrcodeScanner(
            "qr-reader",
            {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
                // Request back camera but don't force 'exact' for better compatibility
                videoConstraints: {
                    facingMode: "environment"
                }
            },
      /* verbose= */ false
        );

        scannerRef.current.render(
            (decodedText) => {
                // Stop scanning immediately to prevent loops
                scannerRef.current?.pause(true);
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                if (onScanError) onScanError(errorMessage);
            }
        );

        return () => {
            scannerRef.current?.clear();
        };
    }, [onScanSuccess, onScanError]);

    return (
        <div className="w-full max-w-md mx-auto overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center gap-2">
                <Scan className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-slate-800 text-sm">Attendance Scanner</span>
            </div>
            <div id="qr-reader" className="w-full" />
        </div>
    );
}
