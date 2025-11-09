"use client"
import { Card, CardHeader, CardPreview, Button, Text, Dialog, DialogTrigger, DialogSurface, DialogTitle, DialogBody, DialogActions, DialogContent } from '@fluentui/react-components'
import { Asset } from '@/src/lib/types'
import { formatCurrency } from '@/src/lib/utils'
import { deleteAsset } from '@/src/lib/store'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Edit24Regular, Delete24Regular } from '@fluentui/react-icons'

export default function AssetCard({ asset, currentValue, onDelete, onEdit }: { asset: Asset; currentValue: number; onDelete?: () => void; onEdit?: (id: string) => void }) {
  const router = useRouter()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(asset.id)
    } else {
      router.push(`/assets/edit/${asset.id}` as any)
    }
  }

  const handleDelete = () => {
    deleteAsset(asset.id)
    setDeleteDialogOpen(false)
    if (onDelete) onDelete()
    router.refresh()
  }

  return (
    <Card
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '12px 16px',
        overflow: 'hidden',
        ...(asset.photoDataUrl && {
          backgroundImage: `url(${asset.photoDataUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        })
      }}
    >
      {asset.photoDataUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backdropFilter: 'blur(20px)',
            backgroundColor: 'rgba(255, 255, 255, 0.85)',
            zIndex: 0
          }}
        />
      )}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <CardHeader
          header={
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
              <Text weight="semibold">{asset.name}</Text>
              <div style={{ display: 'flex', gap: 4 }}>
                <Button
                  aria-label="Edit"
                  icon={<Edit24Regular />}
                  appearance="subtle"
                  size="medium"
                  onClick={handleEdit}
                />
                <Dialog open={deleteDialogOpen} onOpenChange={(_, data) => setDeleteDialogOpen(data.open)}>
                  <DialogTrigger disableButtonEnhancement>
                    <Button
                      aria-label="Delete"
                      icon={<Delete24Regular />}
                      appearance="subtle"
                      size="medium"
                    />
                  </DialogTrigger>
                  <DialogSurface>
                    <DialogBody>
                      <DialogTitle>Delete Asset?</DialogTitle>
                      <DialogContent>
                        Are you sure you want to delete <strong>{asset.name}</strong>? This action cannot be undone.
                      </DialogContent>
                      <DialogActions>
                        <DialogTrigger disableButtonEnhancement>
                          <Button appearance="secondary">Cancel</Button>
                        </DialogTrigger>
                        <Button appearance="primary" onClick={handleDelete}>Delete</Button>
                      </DialogActions>
                    </DialogBody>
                  </DialogSurface>
                </Dialog>
              </div>
            </div>
          }
          description={asset.tags.length ? asset.tags.join(', ') : undefined}
        />
        {asset.photoDataUrl && (
          <CardPreview>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={asset.photoDataUrl} alt={asset.name} style={{ width: '100%', objectFit: 'cover', maxHeight: 200, borderRadius: 8, margin: '8px 0' }} />
          </CardPreview>
        )}
        <div style={{ padding: 8 }}>
          <Text size={300}>{asset.description}</Text>
          <div style={{ marginTop: 8 }}>
            <Text size={200}>Purchase: {formatCurrency(asset.purchaseValue)}</Text>
            <br />
            <Text size={200}>Current: {formatCurrency(currentValue)}</Text>
          </div>
        </div>
      </div>
    </Card>
  )
}
