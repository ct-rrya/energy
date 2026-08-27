import { CustomDropdown, type DropdownOption } from './CustomDropdown';

interface MonthDropdownProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

const MONTHS: DropdownOption[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
];

/**
 * Month Dropdown Component
 * Specialized dropdown for month selection (1-12) with full month names
 * Prevents invalid entries like "13" by using a dropdown instead of number input
 */
export function MonthDropdown({
  value,
  onChange,
  className = '',
}: MonthDropdownProps) {
  return (
    <CustomDropdown
      value={value.toString()}
      onChange={(val) => onChange(parseInt(val, 10))}
      options={MONTHS}
      className={className}
    />
  );
}
