import type { ApplicationStatus } from '@david-agency/shared'

const variants = {
  raw: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  ready: 'bg-[#FEF3C7] text-[#92400E] border-[#FDE68A]',
  submitted: 'bg-[#DBEAFE] text-[#1E40AF] border-[#BFDBFE]',
  done: 'bg-[#DCFCE7] text-[#166534] border-[#BBF7D0]',
}

const labels = {
  raw: 'Raw',
  ready: 'Ready',
  submitted: 'Submitted',
  done: 'Done',
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  const variantClass = variants[status] || 'bg-gray-100 text-gray-500 border-gray-200'
  const label = labels[status] || status || 'Unknown'

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${variantClass}`}>
      {label}
    </span>
  )
}
