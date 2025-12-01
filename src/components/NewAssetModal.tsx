'use client';
import React from 'react';
import { useUI } from './UIContext';
import AssetForm from './AssetForm';
import { Button, Card, Text } from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';

export default function NewAssetModal() {
  const { isNewAssetModalOpen, closeNewAssetModal } = useUI();

  if (!isNewAssetModalOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 10000,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeNewAssetModal();
      }}
    >
      <Card
        style={{
          width: '90%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '24px',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '24px',
          }}
        >
          <Text as="h2" size={600} weight="semibold">
            Create New Asset
          </Text>
          <Button
            appearance="subtle"
            icon={<Dismiss24Regular />}
            onClick={closeNewAssetModal}
            aria-label="Close"
          />
        </div>
        <AssetForm
          onSaved={() => {
            closeNewAssetModal();
            // Optionally refresh data or show success message
          }}
          onCancel={closeNewAssetModal}
        />
      </Card>
    </div>
  );
}
