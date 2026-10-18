// Invoices | Estimates — the phone has one "Bills" tab, so the two lists swap
// here. Desktop has both in the sidebar and does not render this.
import { useNavigate } from 'react-router'

import { SegmentedControl } from '@/components/ui/segmented-control'

export function BillsSwitch({ current }: { current: 'invoices' | 'estimates' }): React.JSX.Element {
  const navigate = useNavigate()
  return (
    <SegmentedControl
      id="bills-switch"
      aria-label="Bill type"
      value={current}
      onChange={(next) => void navigate(`/${next}`, { replace: true })}
      options={[
        { value: 'invoices', label: 'Invoices' },
        { value: 'estimates', label: 'Estimates' },
      ]}
    />
  )
}
