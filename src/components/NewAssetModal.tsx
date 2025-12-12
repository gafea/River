'use client';
import { useUI } from './UIContext';
import AssetForm, { AssetFormHandle } from './AssetForm';
import {
  Button,
  Dialog,
  DialogSurface,
  DialogBody,
  DialogTitle,
  DialogContent,
} from '@fluentui/react-components';
import { Save24Filled, Dismiss24Filled } from '@fluentui/react-icons';
import { useRef, useState } from 'react';

export default function NewAssetModal() {
  const { isNewAssetModalOpen, closeNewAssetModal } = useUI();
  const formRef = useRef<AssetFormHandle>(null);
  const [newValid, setNewValid] = useState(false);

  return (
    <Dialog
      open={isNewAssetModalOpen}
      onOpenChange={(event, data) => {
        if (!data.open) closeNewAssetModal();
      }}
    >
      <DialogSurface
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
        }}
      >
        <DialogBody>
          <DialogTitle>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              <span>Create New Asset</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  aria-label="Save"
                  icon={<Save24Filled />}
                  appearance="primary"
                  size="large"
                  onClick={() => formRef.current?.submit()}
                  disabled={!newValid}
                />
                <Button
                  aria-label="Close"
                  icon={<Dismiss24Filled />}
                  appearance="subtle"
                  size="large"
                  onClick={closeNewAssetModal}
                />
              </div>
            </div>
          </DialogTitle>
          <DialogContent>
            {isNewAssetModalOpen && (
              <AssetForm
                ref={formRef}
                onSaved={() => {
                  closeNewAssetModal();
                }}
                onCancel={closeNewAssetModal}
                onValidityChange={setNewValid}
              />
            )}
          </DialogContent>
        </DialogBody>
      </DialogSurface>
    </Dialog>
  );
}
