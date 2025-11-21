'use client';
import {
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
  useRef,
} from 'react';
import {
  addAsset,
  updateAsset,
  getTagDefaults,
  getAllAssets,
} from '@/lib/store';
import { Asset, AssetEvent } from '@/lib/types';
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
  Combobox,
  Option,
} from '@fluentui/react-components';
import { useRouter } from 'next/navigation';
import { Add24Regular, Delete24Regular } from '@fluentui/react-icons';

export type AssetFormHandle = { submit: () => Promise<void>; isValid: boolean };

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
  const [tag, setTag] = useState<string>('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(
    undefined,
  );
  const [terminalPrice, setTerminalPrice] = useState<number>(0);
  const [events, setEvents] = useState<AssetEvent[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const creationInFlightRef = useRef(false);
  const debounceRef = useRef<number | undefined>(undefined);
  const [savedAsset, setSavedAsset] = useState<Asset | undefined>(asset);

  useEffect(() => {
    const loadTags = async () => {
      const assets = await getAllAssets();
      const tags = Array.from(
        new Set(assets.map((a) => a.tag).filter(Boolean)),
      ).sort();
      setExistingTags(tags);
    };
    loadTags();
  }, []);

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
      setTag(asset.tag || '');
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

  // Auto-fill expected life based on tag
  useEffect(() => {
    if (!tag) return;
    // If editing and tag hasn't changed from original, don't overwrite
    if (isEdit && asset?.tag === tag) return;

    const defaults = getTagDefaults();
    if (defaults[tag]) {
      setExpectedLifeWeeks(defaults[tag]);
      validate({ expectedLifeWeeks: defaults[tag] });
    }
  }, [tag, isEdit, asset]);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPhotoDataUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function submit() {
    if (!validate()) return;

    const assetData = {
      name: name.trim(),
      description: description.trim() || undefined,
      purchaseValue: Number(purchaseValue),
      expectedLifeWeeks: Number(expectedLifeWeeks),
      purchaseDate,
      tag: tag.trim(),
      photoDataUrl,
      terminalPrice: terminalPrice > 0 ? terminalPrice : undefined,
      events: events.length > 0 ? events : undefined,
    };

    try {
      let saved: Asset;
      if (savedAsset) {
        saved = { ...savedAsset, ...assetData };
        await updateAsset(saved);
        setSavedAsset(saved);
      } else {
        saved = await addAsset(assetData);
        setSavedAsset(saved);
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
  // Autosave when editing or after initial creation
  useEffect(() => {
    const valid = Object.keys(errors).length === 0;
    if (!valid) return;
    // Build assetData
    const assetData = {
      name: name.trim(),
      description: description.trim() || undefined,
      purchaseValue: Number(purchaseValue),
      expectedLifeWeeks: Number(expectedLifeWeeks),
      purchaseDate,
      tag: tag.trim(),
      photoDataUrl,
      terminalPrice: terminalPrice > 0 ? terminalPrice : undefined,
      events: events.length > 0 ? events : undefined,
    };

    // Debounce saves to avoid excessive network traffic
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      try {
        setSaving(true);
        if (savedAsset) {
          const updated: Asset = { ...savedAsset, ...assetData };
          await updateAsset(updated);
          setSavedAsset(updated);
        } else if (
          !creationInFlightRef.current &&
          assetData.name &&
          assetData.purchaseValue > 0 &&
          assetData.expectedLifeWeeks > 0
        ) {
          // Create new asset once minimal required fields are valid
          creationInFlightRef.current = true;
          try {
            const created = await addAsset(assetData);
            setSavedAsset(created);
            onSaved?.(created);
          } finally {
            creationInFlightRef.current = false;
          }
        }
      } catch (e) {
        // Swallow autosave errors; manual submit will surface
      } finally {
        setSaving(false);
      }
    }, 800);

    return () => window.clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    name,
    description,
    purchaseValue,
    expectedLifeWeeks,
    purchaseDate,
    tag,
    photoDataUrl,
    terminalPrice,
    events,
    errors,
  ]);

  useImperativeHandle(
    ref,
    () => ({ submit, isValid: Object.keys(errors).length === 0 }),
    [errors],
  );

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      {saving && (
        <div
          style={{
            fontSize: 12,
            color: 'var(--colorNeutralForeground3)',
            marginBottom: 8,
          }}
        >
          Autosaving...
        </div>
      )}
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
      <Field label="Tag">
        <Combobox
          freeform
          value={tag}
          onOptionSelect={(_, data) => setTag(data.optionValue || '')}
          onChange={(e) => setTag(e.target.value)}
          placeholder="Select or type a tag"
        >
          {existingTags.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Combobox>
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
