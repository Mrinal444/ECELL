'use client';

import { useState } from 'react';
import { updateRubric } from '@/app/actions/organizer';
import { useFormStatus } from 'react-dom';

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="bg-vault-copper text-white px-4 py-2 rounded font-medium hover:bg-vault-copper-dark transition disabled:opacity-50 text-sm"
    >
      {pending ? 'Saving...' : 'Save Rubric'}
    </button>
  );
}

export default function RubricEditor({
  contestId,
  initialCriteria,
  isEditable
}: {
  contestId: string;
  initialCriteria: any[];
  isEditable: boolean
}) {
  const [criteria, setCriteria] = useState(
    initialCriteria.length > 0 ? initialCriteria : [
      { id: 'new-1', label: '', description: '', weight: 100 }
    ]
  );
  const [error, setError] = useState<string | null>(null);

  const totalWeight = criteria.reduce((sum, c) => sum + (Number(c.weight) || 0), 0);
  const isValid = totalWeight === 100;

  const updateItem = (index: number, field: string, value: string | number) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const addItem = () => {
    setCriteria([...criteria, { id: `new-${Date.now()}`, label: '', description: '', weight: 0 }]);
  };

  const removeItem = (index: number) => {
    if (criteria.length <= 1) return;
    const updated = [...criteria];
    updated.splice(index, 1);
    setCriteria(updated);
  };

  const handleSubmit = async (formData: FormData) => {
    if (!isValid) return;
    const result = await updateRubric(contestId, criteria);
    if (result?.error) {
      setError(result.error);
    } else {
      setError(null);
    }
  };

  return (
    <form action={handleSubmit}>
      <div className="space-y-4 mb-4">
        {criteria.map((c, i) => (
          <div key={c.id} className="flex gap-4 items-start">
            <div className="flex-1">
              <input
                type="text"
                value={c.label}
                onChange={(e) => updateItem(i, 'label', e.target.value)}
                placeholder="Criterion Label (e.g. Problem)"
                className="w-full px-3 py-2 border border-vault-border rounded font-medium text-sm mb-2"
                readOnly={!isEditable}
                required
              />
              <input
                type="text"
                value={c.description}
                onChange={(e) => updateItem(i, 'description', e.target.value)}
                placeholder="Description"
                className="w-full px-3 py-2 border border-vault-border rounded text-sm text-vault-muted"
                readOnly={!isEditable}
                required
              />
            </div>
            <div className="w-24 text-right">
              <div className="relative">
                <input
                  type="number"
                  value={c.weight}
                  onChange={(e) => updateItem(i, 'weight', parseInt(e.target.value) || 0)}
                  min="1" max="100"
                  className="w-full px-3 py-2 border border-vault-border rounded text-sm pr-6 text-right"
                  readOnly={!isEditable}
                  required
                />
                <span className="absolute right-3 top-2 text-sm text-vault-muted">%</span>
              </div>
            </div>
            {isEditable && (
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="p-2 text-vault-muted hover:text-vault-ruby transition mt-1"
                disabled={criteria.length <= 1}
              >
                &times;
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-vault-border pt-4">
        <div className="flex items-center gap-4">
          <div className={`font-mono text-sm px-3 py-1 rounded border ${isValid ? 'bg-vault-emerald-faint text-vault-emerald border-vault-emerald/20' : 'bg-vault-ruby-faint text-vault-ruby border-vault-ruby/20'}`}>
            Sum: {totalWeight}%
          </div>
          {!isValid && <span className="text-xs text-vault-ruby">Must equal 100%</span>}
        </div>

        {isEditable && (
          <div className="flex gap-3">
            <button
              type="button"
              onClick={addItem}
              className="px-4 py-2 text-sm font-medium text-vault-ink border border-vault-border rounded hover:bg-vault-card transition"
            >
              + Add
            </button>
            <SubmitButton disabled={!isValid} />
          </div>
        )}
      </div>

      {error && <div className="mt-4 p-3 bg-vault-ruby-faint text-vault-ruby text-sm rounded border border-vault-ruby/20">{error}</div>}
    </form>
  );
}
