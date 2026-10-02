import React, { useState, useEffect } from 'react';
import { AuditLog } from '../../types';
import { api } from '../../services/api';
import { Shield, Clock, FileText } from 'lucide-react';

export const AdminAuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.adminGetAuditLogs().then(data => {
      setLogs(data);
      setLoading(false);
    }).catch(console.error);
  }, []);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Security &amp; Operational Audit Trail</h3>
          <p className="text-xs text-slate-500">
            Immutable log of all administrative actions, payment approvals, and credential modifications
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {logs.length === 0 ? (
          <p className="text-xs text-slate-400">No audit records logged yet.</p>
        ) : (
          logs.map(log => (
            <div
              key={log.id}
              className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{log.action}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                    {log.adminName}
                  </span>
                </div>
                <p className="text-slate-600 text-xs">{log.details}</p>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px] shrink-0">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(log.timestamp).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
