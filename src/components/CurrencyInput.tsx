import React from 'react';

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  prefix?: string;
  className?: string;
}

/**
 * Format angka menjadi format ribuan dengan titik Indonesia (contoh: 1.000.000)
 */
export const formatNumberWithDots = (val: number | string): string => {
  if (val === '' || val === null || val === undefined) return '';
  const num = typeof val === 'number' ? val : parseInt(String(val).replace(/\D/g, ''), 10);
  if (isNaN(num)) return '';
  return new Intl.NumberFormat('id-ID').format(num);
};

/**
 * Mengubah string format bertitik menjadi angka murni
 */
export const parseNumberFromDots = (val: string): number => {
  if (!val) return 0;
  const cleaned = val.replace(/\D/g, '');
  return cleaned ? parseInt(cleaned, 10) : 0;
};

export const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(({
  value,
  onChange,
  prefix = 'Rp',
  className = '',
  placeholder = '0',
  required = false,
  disabled = false,
  ...props
}, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    const numericVal = parseNumberFromDots(rawVal);
    onChange(numericVal);
  };

  const displayString = value === 0 ? (props.min !== undefined && Number(props.min) > 0 ? '' : '0') : formatNumberWithDots(value);

  return (
    <div className="relative flex items-center w-full">
      {prefix && (
        <span className="absolute left-2.5 sm:left-3 text-xs font-bold text-slate-400 select-none pointer-events-none z-10">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        value={displayString}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className={`${prefix ? 'pl-8 sm:pl-9' : 'px-3'} ${className}`}
        {...props}
      />
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';
