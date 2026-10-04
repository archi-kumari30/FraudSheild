import React, { useState, useEffect, useCallback } from 'react';
import AdminNavbar from '../../components/admin/AdminNavbar';
import AuditLogTable from '../../components/admin/AuditLogTable';
import axiosClient from '../../api/axiosClient';

const AuditLogsPage = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [eventType, setEventType] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (eventType) params.eventType = eventType;

      const res = await axiosClient.get('/admin/audit-logs', { params });
      if (res.success && res.data) {
        setLogs(res.data.logs || []);
        setPagination(res.data.pagination || {});
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err.message);
    } finally {
      setLoading(false);
    }
  }, [page, eventType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleEventTypeChange = (newType) => {
    setEventType(newType);
    setPage(1); // Reset to first page
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <AdminNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            System Audit Trail
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Forensic append-only audit trail capturing administrative interventions and critical events.
          </p>
        </div>

        <AuditLogTable
          logs={logs}
          pagination={pagination}
          selectedEventType={eventType}
          onSelectEventType={handleEventTypeChange}
          onPageChange={setPage}
          loading={loading}
        />
      </main>
    </div>
  );
};

export default AuditLogsPage;
