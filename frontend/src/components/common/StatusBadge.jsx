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

    case 'REFUNDED':
    case 'RESOLVED_REFUNDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EBF3FA] text-[#1E3A5F] border border-[#BFD4E8]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2A527A]" />
          <span>Refunded</span>
        </span>
      );

    case 'OPEN':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FFF7ED] text-[#9A3412] border border-[#FFEDD5]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#EA580C]" />
          <span>Open Dispute</span>
        </span>
      );

    case 'RECIPIENT_RESPONDED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#EFF6FF] text-[#1E40AF] border border-[#DBEAFE]">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Recipient Responded</span>
        </span>
      );

    case 'DISPUTED':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]">
          <AlertTriangle className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Disputed</span>
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
