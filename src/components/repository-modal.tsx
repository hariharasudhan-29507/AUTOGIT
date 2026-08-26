import { useState } from 'react'
import { FolderPlus, Download, Lock, Globe, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import type { RepositorySummary } from '@/types'

interface RepositoryModalProps {
  isOpen: boolean
  onClose: () => void
  onAddRepository: (repo: RepositorySummary) => void
}

export function RepositoryModal({ isOpen, onClose, onAddRepository }: RepositoryModalProps) {
  const [tab, setTab] = useState<'create' | 'import'>('create')

  // Create state
  const [name, setName] = useState('')
  const [owner, setOwner] = useState('autogit')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState('TypeScript')
  const [isPrivate, setIsPrivate] = useState(true)
  const [template, setTemplate] = useState('blank')

  // Import state
  const [importUrl, setImportUrl] = useState('')

  if (!isOpen) return null

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      toast.error('Repository name is required')
      return
    }

    const newRepo: RepositorySummary = {
      id: Date.now(),
      name: name.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-'),
      owner: owner.trim() || 'autogit',
      language,
      lastCommit: new Date().toISOString(),
      stars: 1,
      forks: 0,
      openIssues: 0,
      healthScore: 100,
      synced: true,
      isPrivate,
    }

    onAddRepository(newRepo)
    toast.success(`Repository ${newRepo.owner}/${newRepo.name} created!`)
    onClose()
  }

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault()
    if (!importUrl.trim()) {
      toast.error('Please enter a GitHub repository URL or slug (owner/repo)')
      return
    }

    let parsedOwner = 'imported'
    let parsedName = 'repository'

    const clean = importUrl.replace(/https?:\/\/github\.com\//, '').replace(/\.git$/, '')
    const parts = clean.split('/')
    if (parts.length >= 2) {
      parsedOwner = parts[0]
      parsedName = parts[1]
    } else if (parts[0]) {
      parsedName = parts[0]
    }

    const importedRepo: RepositorySummary = {
      id: Date.now(),
      name: parsedName,
      owner: parsedOwner,
      language: 'TypeScript',
      lastCommit: new Date().toISOString(),
      stars: Math.floor(Math.random() * 50) + 5,
      forks: Math.floor(Math.random() * 10),
      openIssues: 0,
      healthScore: 95,
      synced: true,
      isPrivate: false,
    }

    onAddRepository(importedRepo)
    toast.success(`Imported ${importedRepo.owner}/${importedRepo.name} to workspace`)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in-50">
      <Card className="w-full max-w-lg overflow-hidden shadow-2xl border-border">
        <div className="flex items-center justify-between border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex items-center gap-2">
            {tab === 'create' ? <FolderPlus className="size-5 text-primary" /> : <Download className="size-5 text-primary" />}
            <h2 className="font-display font-semibold text-base">Add New Repository</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-border bg-muted/20 px-6 pt-2">
          <button
            onClick={() => setTab('create')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'create' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Blank or Template
          </button>
          <button
            onClick={() => setTab('import')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              tab === 'import' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Import from GitHub
          </button>
        </div>

        {tab === 'create' ? (
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="repo-owner" className="text-xs">Owner</Label>
                <Input id="repo-owner" className="mt-1 h-9 text-xs" value={owner} onChange={(e) => setOwner(e.target.value)} />
              </div>
              <div className="col-span-2">
                <Label htmlFor="repo-name" className="text-xs">Repository Name *</Label>
                <Input
                  id="repo-name"
                  className="mt-1 h-9 text-xs"
                  placeholder="e.g. acme-web-service"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="repo-desc" className="text-xs">Description (optional)</Label>
              <Textarea
                id="repo-desc"
                className="mt-1 min-h-16 text-xs resize-none"
                placeholder="Brief summary of repository purpose..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="repo-lang" className="text-xs">Primary Language</Label>
                <Select value={language} onValueChange={(val) => val && setLanguage(val)}>
                  <SelectTrigger id="repo-lang" className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TypeScript">TypeScript</SelectItem>
                    <SelectItem value="JavaScript">JavaScript</SelectItem>
                    <SelectItem value="Python">Python</SelectItem>
                    <SelectItem value="Go">Go</SelectItem>
                    <SelectItem value="Rust">Rust</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="repo-template" className="text-xs">Starter Template</Label>
                <Select value={template} onValueChange={(val) => val && setTemplate(val)}>
                  <SelectTrigger id="repo-template" className="mt-1 h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Blank Repository</SelectItem>
                    <SelectItem value="react-vite">React + Vite + Tailwind</SelectItem>
                    <SelectItem value="node-hono">Node.js Hono API</SelectItem>
                    <SelectItem value="nextjs">Next.js App Router</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Visibility</Label>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setIsPrivate(true)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                    isPrivate ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Lock className="size-4 text-primary shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Private</p>
                    <p className="text-[11px] text-muted-foreground">Only workspace members can see this repo.</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setIsPrivate(false)}
                  className={`flex items-center gap-2 rounded-lg border p-3 text-left transition-all ${
                    !isPrivate ? 'border-primary bg-primary/5 ring-1 ring-primary/30' : 'border-border hover:bg-muted/50'
                  }`}
                >
                  <Globe className="size-4 text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold">Public</p>
                    <p className="text-[11px] text-muted-foreground">Anyone on the internet can inspect.</p>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Sparkles className="size-3.5 mr-1" /> Create Repository
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleImport} className="p-6 space-y-4">
            <div>
              <Label htmlFor="import-url" className="text-xs">GitHub Repository URL or Slug *</Label>
              <Input
                id="import-url"
                className="mt-1.5 h-9 text-xs"
                placeholder="e.g. facebook/react or https://github.com/vercel/next.js"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                required
              />
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                AutoGit will synchronize commit metadata, health score parameters, and AST security audit routines.
              </p>
            </div>

            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
              <p className="font-semibold text-primary">Automatic Telemetry Discovery</p>
              <p className="mt-1 text-muted-foreground text-[11px]">
                Imported repositories will automatically receive AST secret scanning and conventional commit brief generation triggers.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Download className="size-3.5 mr-1" /> Import Repository
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  )
}
