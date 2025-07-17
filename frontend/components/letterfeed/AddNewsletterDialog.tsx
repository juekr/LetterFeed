import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus } from "lucide-react"
import { createNewsletter } from "@/lib/api"
import { Checkbox } from "@/components/ui/checkbox"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface AddNewsletterDialogProps {
  isOpen: boolean
  folderOptions: string[]
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
}

export function AddNewsletterDialog({ isOpen, folderOptions, onOpenChange, onSuccess }: AddNewsletterDialogProps) {
  const [newNewsletter, setNewNewsletter] = useState({
    name: "",
    emails: [""],
    move_to_folder: "",
    extract_content: false,
  })

  const handleAddEmail = () => {
    setNewNewsletter((prev) => ({
      ...prev,
      emails: [...prev.emails, ""],
    }))
  }

  const handleRemoveEmail = (index: number) => {
    setNewNewsletter((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }))
  }

  const handleEmailChange = (index: number, value: string) => {
    setNewNewsletter((prev) => ({
      ...prev,
      emails: prev.emails.map((email, i) => (i === index ? value : email)),
    }))
  }

  const handleSubmit = async () => {
    if (newNewsletter.name && newNewsletter.emails.some((email) => email.trim())) {
      try {
        await createNewsletter({
          name: newNewsletter.name,
          sender_emails: newNewsletter.emails.filter((email) => email.trim()),
          move_to_folder: newNewsletter.move_to_folder,
          extract_content: newNewsletter.extract_content,
        })
        setNewNewsletter({ name: "", emails: [""], move_to_folder: "", extract_content: false })
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        console.error("Failed to create newsletter:", error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Register New Newsletter</DialogTitle>
          <DialogDescription>Add a new newsletter.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Newsletter Name</Label>
            <Input
              id="name"
              value={newNewsletter.name}
              onChange={(e) => setNewNewsletter((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter newsletter name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="move_to_folder">Move To Folder</Label>
            <Select
              value={newNewsletter.move_to_folder || "None"}
              onValueChange={(value) =>
                setNewNewsletter((prev) => ({ ...prev, move_to_folder: value === "None" ? "" : value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select folder or leave empty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="None">Default (use global setting)</SelectItem>
                {folderOptions.map((folder) => (
                  <SelectItem key={folder} value={folder}>
                    {folder}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {newNewsletter.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => handleEmailChange(index, e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                />
                {newNewsletter.emails.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => handleRemoveEmail(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddEmail} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Email
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="extract-content"
              checked={newNewsletter.extract_content}
              onCheckedChange={(checked) =>
                setNewNewsletter((prev) => ({ ...prev, extract_content: !!checked }))
              }
            />
            <Label htmlFor="extract-content">Extract main content from emails</Label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Register Newsletter</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
