import React, { useState, useEffect, useCallback } from 'react';
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
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[#17211D]">
          System Audit Trail
        </h1>
        <p className="text-xs sm:text-sm text-[#5A6E65] mt-0.5">
          Forensic append-only audit trail capturing administrative interventions, evaluations, and security events.
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
    </div>
  );
};

export default AuditLogsPage;
