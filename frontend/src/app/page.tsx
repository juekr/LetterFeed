"use client"

import { useState, useEffect, useCallback } from "react"
import {
  getNewsletters,
  getSettings,
  getImapFolders,
  Newsletter,
  Settings as AppSettings,
} from "@/lib/api"
import { LoadingSpinner } from "@/components/letterfeed/LoadingSpinner"
import { Header } from "@/components/letterfeed/Header"
import { NewsletterList } from "@/components/letterfeed/NewsletterList"
import { EmptyState } from "@/components/letterfeed/EmptyState"
import { AddNewsletterDialog } from "@/components/letterfeed/AddNewsletterDialog"
import { EditNewsletterDialog } from "@/components/letterfeed/EditNewsletterDialog"
import { SettingsDialog } from "@/components/letterfeed/SettingsDialog"

export default function LetterFeedApp() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [folderOptions, setFolderOptions] = useState<string[]>([])

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState<Newsletter | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [newslettersData, settingsData, foldersData] = await Promise.all([
        getNewsletters(),
        getSettings(),
        getImapFolders(),
      ])
      setNewsletters(newslettersData)
      setSettings(settingsData)
      setFolderOptions(foldersData)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const openEditDialog = (newsletter: Newsletter) => {
    setEditingNewsletter(newsletter)
    setIsEditDialogOpen(true)
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Header
          onOpenAddNewsletter={() => setIsAddDialogOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {newsletters.length > 0 ? (
          <NewsletterList newsletters={newsletters} onEditNewsletter={openEditDialog} />
        ) : (
          <EmptyState onAddNewsletter={() => setIsAddDialogOpen(true)} />
        )}

        <AddNewsletterDialog
          isOpen={isAddDialogOpen}
          onOpenChange={setIsAddDialogOpen}
          onSuccess={fetchData}
        />

        {editingNewsletter && (
          <EditNewsletterDialog
            newsletter={editingNewsletter}
            isOpen={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSuccess={() => {
              setEditingNewsletter(null)
              fetchData()
            }}
          />
        )}

        {settings && (
          <SettingsDialog
            settings={settings}
            folderOptions={folderOptions}
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            onSuccess={fetchData}
          />
        )}
      </div>
    </div>
  )
}
