'use client';
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { addAsset, updateAsset, getTagDefaults } from '@/src/lib/store';
import { Asset, AssetEvent } from '@/src/lib/types';
import {
  Input,
  Textarea,
  Field,
  Card,
  Button,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from '@fluentui/react-components';
import { useRouter } from 'next/navigation';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';

export type AssetFormHandle = { submit: () => void; isValid: boolean };

interface Props {
  asset?: Asset;
  onSaved?: (saved: Asset) => void;
  onCancel?: () => void;
  onValidityChange?: (valid: boolean) => void;
}

export default forwardRef<AssetFormHandle, Props>(function AssetForm(
  { asset, onSaved, onCancel, onValidityChange }: Props,
  ref,
) {
  const router = useRouter();
  const isEdit = !!asset;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [purchaseValue, setPurchaseValue] = useState<number>(0);
  const [expectedLifeWeeks, setExpectedLifeWeeks] = useState<number>(52);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [tags, setTags] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [terminalPrice, setTerminalPrice] = useState<number>(0);
  const [events, setEvents] = useState<AssetEvent[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(
    fields?: Partial<{
      name: string;
      purchaseValue: number;
      expectedLifeWeeks: number;
      purchaseDate: string;
    }>,
  ) {
    const n = fields?.name ?? name;
    const pv = fields?.purchaseValue ?? purchaseValue;
    const el = fields?.expectedLifeWeeks ?? expectedLifeWeeks;
    const pd = fields?.purchaseDate ?? purchaseDate;
    const today = new Date().toISOString().slice(0, 10);
    const newErrors: Record<string, string> = {};
    if (!n.trim()) newErrors.name = 'Name is required.';
    if (pv <= 0)
      newErrors.purchaseValue = 'Purchase value must be greater than 0.';
    if (el <= 0)
      newErrors.expectedLifeWeeks =
        'Expected life (weeks) must be greater than 0.';
    if (pd > today)
      newErrors.purchaseDate = 'Purchase date cannot be in the future.';
    setErrors(newErrors);
    const valid = Object.keys(newErrors).length === 0;
    onValidityChange?.(valid);
    return valid;
  }

  // Initialize form with asset data when editing
  useEffect(() => {
    if (asset) {
      setName(asset.name);
      setDescription(asset.description || '');
      setPurchaseValue(asset.purchaseValue);
      setExpectedLifeWeeks(asset.expectedLifeWeeks);
      setPurchaseDate(asset.purchaseDate);
      setTags(asset.tags.join(', '));
      setPhotoDataUrl(asset.photoDataUrl);
      setTerminalPrice(asset.terminalPrice ?? 0);
      setEvents(asset.events || []);
      // Ensure validation runs after asset data is populated
      validate({
        name: asset.name,
        purchaseValue: asset.purchaseValue,
        expectedLifeWeeks: asset.expectedLifeWeeks,
        purchaseDate: asset.purchaseDate,
      });
    } else {
      // For new assets, validate initial state
      validate();
    }
  }, [asset]);

  // Auto-fill expected life based on tags for new assets
  useEffect(() => {
    if (isEdit) return; // Only auto-fill for new assets

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    if (tagList.length === 0) return;

    const defaults = getTagDefaults();
    const matchingTag = tagList.find((tag) => defaults[tag]);

    if (matchingTag && expectedLifeWeeks === 52) {
      // Only auto-fill if still at default
      setExpectedLifeWeeks(defaults[matchingTag]);
    }
  }, [tags, isEdit, expectedLifeWeeks]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  function submit() {
    if (!validate()) return;

    const assetData = {
      name: name.trim(),
      description: description.trim() || undefined,
      purchaseValue: Number(purchaseValue),
      expectedLifeWeeks: Number(expectedLifeWeeks),
      purchaseDate,
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      photoDataUrl,
      terminalPrice: terminalPrice > 0 ? terminalPrice : undefined,
      events: events.length > 0 ? events : undefined,
    };

    try {
      let saved: Asset;
      if (isEdit && asset) {
        saved = { ...asset, ...assetData };
        updateAsset(saved);
      } else {
        saved = addAsset(assetData);
      }

      if (onSaved) {
        onSaved(saved);
      } else {
        router.push('/dashboard');
      }
    } catch (e) {
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert(
          'Failed to save asset: Storage quota exceeded. Please remove some photos or assets to free up space.',
        );
      } else {
        alert('Failed to save asset. Please try again.');
      }
    }
  }

  useImperativeHandle(
    ref,
    () => ({ submit, isValid: Object.keys(errors).length === 0 }),
    [errors, submit],
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <Field
        label="Name"
        required
        validationMessage={errors.name}
        validationState={errors.name ? 'error' : 'none'}
      >
        <Input
          value={name}
          onChange={(_, d) => {
            setName(d.value);
            validate({ name: d.value });
          }}
        />
      </Field>
      <Field label="Description">
        <Textarea
          value={description}
          onChange={(_, d) => setDescription(d.value)}
        />
      </Field>
      <Field
        label="Purchase Value"
        required
        validationMessage={errors.purchaseValue}
        validationState={errors.purchaseValue ? 'error' : 'none'}
      >
        <Input
          type="number"
          value={purchaseValue.toString()}
          onChange={(_, d) => {
            const v = Number(d.value);
            setPurchaseValue(v);
            validate({ purchaseValue: v });
          }}
        />
      </Field>
      <Field
        label="Expected Life (weeks)"
        required
        validationMessage={errors.expectedLifeWeeks}
        validationState={errors.expectedLifeWeeks ? 'error' : 'none'}
      >
        <Input
          type="number"
          value={expectedLifeWeeks.toString()}
          onChange={(_, d) => {
            const v = Number(d.value);
            setExpectedLifeWeeks(v);
            validate({ expectedLifeWeeks: v });
          }}
        />
      </Field>
      <Field
        label="Purchase Date"
        required
        validationMessage={errors.purchaseDate}
        validationState={errors.purchaseDate ? 'error' : 'none'}
      >
        <Input
          type="date"
          max={today}
          value={purchaseDate}
          onChange={(_, d) => {
            setPurchaseDate(d.value);
            validate({ purchaseDate: d.value });
          }}
        />
      </Field>
      <Field label="Tags (comma separated)">
        <Input
          value={tags}
          onChange={(_, d) => setTags(d.value)}
          placeholder="e.g. IT, Laptop"
        />
      </Field>
      <Field label="Terminal Price (optional)">
        <Input
          type="number"
          value={terminalPrice.toString()}
          onChange={(_, d) => setTerminalPrice(Number(d.value))}
          placeholder="Leave 0 for full depreciation"
        />
      </Field>
      <Field label="Events">
        <Card
          style={{
            padding: '16px',
            backgroundColor: 'var(--colorNeutralBackground2)',
          }}
        >
          <div style={{ marginBottom: '12px' }}>
            <Button
              icon={<Add24Regular />}
              onClick={() =>
                setEvents([
                  ...events,
                  {
                    date: new Date().toISOString().slice(0, 10),
                    amount: 0,
                    description: '',
                  },
                ])
              }
            >
              Add Event
            </Button>
          </div>
          {events.length > 0 && (
            <div
              style={{
                border: '1px solid var(--colorNeutralStroke1)',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <Table style={{ borderCollapse: 'collapse' }}>
                <TableHeader>
                  <TableRow
                    style={{
                      backgroundColor: 'var(--colorNeutralBackground2)',
                    }}
                  >
                    <TableHeaderCell
                      style={{
                        border: '1px solid var(--colorNeutralStroke1)',
                        padding: '8px',
                        fontWeight: '600',
                        width: '140px',
                      }}
                    >
                      Date
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{
                        border: '1px solid var(--colorNeutralStroke1)',
                        padding: '8px',
                        fontWeight: '600',
                        width: '100px',
                      }}
                    >
                      Amount
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{
                        border: '1px solid var(--colorNeutralStroke1)',
                        padding: '8px',
                        fontWeight: '600',
                      }}
                    >
                      Description
                    </TableHeaderCell>
                    <TableHeaderCell
                      style={{
                        border: '1px solid var(--colorNeutralStroke1)',
                        padding: '8px',
                        fontWeight: '600',
                        width: '80px',
                        textAlign: 'center',
                      }}
                    >
                      Actions
                    </TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((event, index) => (
                    <TableRow
                      key={index}
                      style={{
                        backgroundColor:
                          index % 2 === 0
                            ? 'var(--colorNeutralBackground1)'
                            : 'var(--colorNeutralBackground2)',
                      }}
                    >
                      <TableCell
                        style={{
                          border: '1px solid var(--colorNeutralStroke1)',
                          padding: '0',
                          margin: '0',
                        }}
                      >
                        <Input
                          type="date"
                          value={event.date}
                          onChange={(_, d) => {
                            const newEvents = [...events];
                            newEvents[index].date = d.value;
                            setEvents(newEvents);
                          }}
                          style={{
                            border: 'none',
                            borderRadius: '0',
                            backgroundColor: 'transparent',
                            padding: '8px',
                            width: '100%',
                            fontSize: '14px',
                            outline: 'none',
                            boxShadow: 'none',
                            color: 'var(--colorNeutralForeground1)',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          border: '1px solid var(--colorNeutralStroke1)',
                          padding: '0',
                          margin: '0',
                        }}
                      >
                        <Input
                          type="number"
                          value={event.amount.toString()}
                          onChange={(_, d) => {
                            const newEvents = [...events];
                            newEvents[index].amount = Number(d.value);
                            setEvents(newEvents);
                          }}
                          style={{
                            border: 'none',
                            borderRadius: '0',
                            backgroundColor: 'transparent',
                            padding: '8px',
                            width: '100%',
                            fontSize: '14px',
                            outline: 'none',
                            boxShadow: 'none',
                            textAlign: 'right',
                            color: 'var(--colorNeutralForeground1)',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          border: '1px solid var(--colorNeutralStroke1)',
                          padding: '0',
                          margin: '0',
                        }}
                      >
                        <Input
                          value={event.description || ''}
                          onChange={(_, d) => {
                            const newEvents = [...events];
                            newEvents[index].description = d.value;
                            setEvents(newEvents);
                          }}
                          placeholder="Optional description"
                          style={{
                            border: 'none',
                            borderRadius: '0',
                            backgroundColor: 'transparent',
                            padding: '8px',
                            width: '100%',
                            fontSize: '14px',
                            outline: 'none',
                            boxShadow: 'none',
                            color: 'var(--colorNeutralForeground1)',
                          }}
                        />
                      </TableCell>
                      <TableCell
                        style={{
                          border: '1px solid var(--colorNeutralStroke1)',
                          padding: '4px',
                          margin: '0',
                          textAlign: 'center',
                        }}
                      >
                        <Button
                          icon={<Delete24Regular />}
                          appearance="subtle"
                          size="small"
                          onClick={() => {
                            const newEvents = events.filter(
                              (_, i) => i !== index,
                            );
                            setEvents(newEvents);
                          }}
                          style={{
                            minWidth: 'auto',
                            padding: '4px',
                            border: 'none',
                            backgroundColor: 'transparent',
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          {events.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                color: 'var(--colorNeutralForeground3)',
                padding: '20px',
                border: '1px solid var(--colorNeutralStroke1)',
                borderRadius: '4px',
              }}
            >
              No events added yet. Click "Add Event" to add your first event.
            </div>
          )}
        </Card>
      </Field>
      <Field label="Photo">
        <input
          type="file"
          accept="image/*"
          onChange={handlePhoto}
          style={{ display: 'block' }}
        />
        {photoDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoDataUrl}
            alt="preview"
            style={{ marginTop: 8, maxWidth: '100%' }}
          />
        )}
      </Field>
    </div>
  );
});
