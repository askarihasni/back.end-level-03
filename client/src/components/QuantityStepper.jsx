import { Minus, Plus } from 'lucide-react';

export default function QuantityStepper({
  value,
  onChange,
  max = 999,
  min = 1,
  disabled = false,
  label = 'Quantity',
}) {
  const upper = Math.max(min, Math.min(max || min, 999));
  return (
    <div className="quantity-stepper" role="group" aria-label={label}>
      <button
        type="button"
        className="quantity-stepper__button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus size={15} />
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="quantity-stepper__input"
        value={value}
        min={min}
        max={upper}
        disabled={disabled}
        aria-label={label}
        onChange={(event) => {
          const next = Number.parseInt(event.target.value, 10);
          if (Number.isFinite(next)) onChange(Math.max(min, Math.min(upper, next)));
        }}
      />
      <button
        type="button"
        className="quantity-stepper__button"
        onClick={() => onChange(Math.min(upper, value + 1))}
        disabled={disabled || value >= upper}
        aria-label="Increase quantity"
      >
        <Plus size={15} />
      </button>
    </div>
  );
}
