import React, { useState } from 'react';
import { usePWAInstall } from './usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-teal-700 transition active:scale-95 cursor-pointer"
        title="Install FIRST STEP on your device"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 rounded-lg border border-teal-600/30 bg-teal-50 px-2.5 py-1.5 text-xs font-medium text-teal-800 hover:bg-teal-100 transition cursor-pointer"
          title="Install on iPhone / iPad"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>Install App</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl relative">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold">
                  FS
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Install FIRST STEP</h3>
                  <p className="text-xs text-slate-500">Add to iPhone / iPad Home Screen</p>
                </div>
              </div>
              <ol className="space-y-3 text-xs text-slate-600 mb-5 list-decimal list-inside">
                <li>Tap the <strong>Share</strong> button in Safari’s bottom bar.</li>
                <li>Scroll down and tap <strong>Add to Home Screen</strong>.</li>
                <li>Tap <strong>Add</strong> in the top right to access like a native app.</li>
              </ol>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full rounded-xl bg-teal-600 py-2.5 text-xs font-semibold text-white hover:bg-teal-700 transition"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
