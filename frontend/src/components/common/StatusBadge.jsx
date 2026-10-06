import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'APPROVED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EAF3EF] text-[#1E473B] border border-[#C8DCD2]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#285C4D]" />
          <span>Approved</span>
        </span>
      );

    case 'CUSTOMER_VERIFICATION_REQUIRED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#C89445]" />
          <span>Verification Required</span>
        </span>
      );

    case 'FLAGGED_FOR_REVIEW':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FAF4EB] text-[#946625] border border-[#EAD7BA]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#C89445]" />
          <span>Held for Review</span>
        </span>
      );

    case 'BLOCKED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FBF0EF] text-[#8C3E3A] border border-[#E6BFBD]">
          <XCircle className="w-3.5 h-3.5 text-[#B65D59]" />
          <span>Blocked</span>
        </span>
      );

    case 'REJECTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FBF0EF] text-[#8C3E3A] border border-[#E6BFBD]">
          <XCircle className="w-3.5 h-3.5 text-[#B65D59]" />
          <span>Rejected</span>
        </span>
      );

    case 'PENDING':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EDF6F1] text-[#4A5B53] border border-[#D4E2DC]">
          <Clock className="w-3.5 h-3.5 text-[#5A6E65]" />
          <span>Pending</span>
        </span>
      );
  }
};

export default StatusBadge;
