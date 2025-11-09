"use client"
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { Button, Text } from '@fluentui/react-components'
import { Add24Regular, Tag24Regular, Home24Regular } from '@fluentui/react-icons'
import { getAllAssets } from '@/src/lib/store'
import { groupAssetsByTag } from '@/src/lib/utils'

export default function Navigation() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const activeTag = searchParams.get('tag')
  const assets = getAllAssets()
  const grouped = groupAssetsByTag(assets)
  const tags = Object.keys(grouped).sort()

  const isActivePath = (path: string) => pathname === path

  return (
    <nav
      style={{
        width: 240,
        minHeight: '100vh',
        backgroundColor: 'var(--colorNeutralBackground2)',
        padding: 16,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        borderRight: '1px solid var(--colorNeutralStroke2)'
      }}
    >
      <Text weight="semibold" size={500} style={{ marginBottom: 8 }}>
        Asset Manager
      </Text>

      <Button
        appearance="primary"
        icon={<Add24Regular />}
        onClick={() => router.push('/dashboard?new=1')}
        style={{ marginBottom: 16 }}
      >
        New Asset
      </Button>

      <Button
        appearance="subtle"
        icon={<Home24Regular />}
        onClick={() => router.push('/dashboard')}
        style={{
          justifyContent: 'flex-start',
          backgroundColor: isActivePath('/dashboard') && !activeTag ? 'rgba(15, 111, 255, 0.15)' : undefined,
          color: isActivePath('/dashboard') && !activeTag ? 'rgb(15, 111, 255)' : undefined,
        }}
      >
        All Assets
      </Button>

      <div style={{ marginTop: 16, marginBottom: 8 }}>
        <Text weight="semibold" size={300} style={{ color: 'var(--colorNeutralForeground3)' }}>
          TAGS
        </Text>
      </div>

      {tags.map((tag) => (
        <Button
          key={tag}
          appearance="subtle"
          icon={<Tag24Regular />}
          onClick={() => router.push(`/dashboard?tag=${encodeURIComponent(tag)}`)}
          style={{
            justifyContent: 'flex-start',
            backgroundColor: activeTag === tag ? 'rgba(15, 111, 255, 0.15)' : undefined,
            color: activeTag === tag ? 'rgb(15, 111, 255)' : undefined,
          }}
        >
          {tag} ({grouped[tag].length})
        </Button>
      ))}

      {tags.length === 0 && (
        <Text size={200} style={{ color: 'var(--colorNeutralForeground3)', fontStyle: 'italic' }}>
          No tags yet
        </Text>
      )}
    </nav>
  )
}
