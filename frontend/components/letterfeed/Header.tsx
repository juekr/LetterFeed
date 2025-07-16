"use client"

import { Button } from "@/components/ui/button"
import { processEmails } from "@/lib/api"
import { Mail, Plus, Settings } from "lucide-react"
import Image from "next/image"
import { toast } from "sonner"

interface HeaderProps {
  onOpenAddNewsletter: () => void
  onOpenSettings: () => void
}

export function Header({ onOpenAddNewsletter, onOpenSettings }: HeaderProps) {
  const handleProcessEmails = async () => {
    try {
      await processEmails()
      toast.success("Email processing started successfully!")
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred."
      console.error(error)
      toast.error(message)
    }
  }

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <Image
          src="/logo.png"
          alt="LetterFeed Logo"
          width={48}
          height={48}
          className="rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">LetterFeed</h1>
          <p className="text-gray-600 mt-1">
            Read your newsletters as RSS feeds!
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={onOpenAddNewsletter}>
          <Plus className="w-4 h-4 mr-2" />
          Add Newsletter
        </Button>

        <Button variant="outline" onClick={handleProcessEmails}>
          <Mail className="w-4 h-4 mr-2" />
          Process Now
        </Button>

        <Button variant="outline" onClick={onOpenSettings}>
          <Settings className="w-4 h-4 mr-2" />
          Settings
        </Button>
      </div>
    </div>
  )
}
