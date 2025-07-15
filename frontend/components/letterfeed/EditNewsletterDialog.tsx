import { useState, useEffect } from "react"
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
import { Newsletter, updateNewsletter, deleteNewsletter } from "@/lib/api"

interface EditNewsletterDialogProps {
  newsletter: Newsletter | null
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSuccess: () => void
}

export function EditNewsletterDialog({ newsletter, isOpen, onOpenChange, onSuccess }: EditNewsletterDialogProps) {
  const [editedDetails, setEditedDetails] = useState<{ name: string; emails: string[] }>({
    name: "",
    emails: [],
  })

  useEffect(() => {
    if (newsletter) {
      setEditedDetails({
        name: newsletter.name,
        emails: newsletter.senders.map((s) => s.email),
      })
    }
  }, [newsletter])

  if (!newsletter) return null

  const handleUpdateEmailChange = (index: number, value: string) => {
    setEditedDetails((prev) => ({
      ...prev,
      emails: prev.emails.map((email, i) => (i === index ? value : email)),
    }))
  }

  const handleAddEmailToEdit = () => {
    setEditedDetails((prev) => ({
      ...prev,
      emails: [...prev.emails, ""],
    }))
  }

  const handleRemoveEmailFromEdit = (index: number) => {
    setEditedDetails((prev) => ({
      ...prev,
      emails: prev.emails.filter((_, i) => i !== index),
    }))
  }

  const handleUpdate = async () => {
    try {
      await updateNewsletter(newsletter.id, {
        name: editedDetails.name,
        sender_emails: editedDetails.emails.filter((email) => email.trim()),
      })
      onOpenChange(false)
      onSuccess()
    } catch (error) {
      console.error("Failed to update newsletter:", error)
    }
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete the "${newsletter.name}" newsletter?`)) {
      try {
        await deleteNewsletter(newsletter.id)
        onOpenChange(false)
        onSuccess()
      } catch (error) {
        console.error("Failed to delete newsletter:", error)
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Newsletter</DialogTitle>
          <DialogDescription>Update the details for {newsletter.name}.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Newsletter Name</Label>
            <Input
              id="edit-name"
              value={editedDetails.name}
              onChange={(e) => setEditedDetails((prev) => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Email Addresses</Label>
            {editedDetails.emails.map((email, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={email}
                  onChange={(e) => handleUpdateEmailChange(index, e.target.value)}
                  placeholder="Enter email address"
                  type="email"
                />
                {editedDetails.emails.length > 1 && (
                  <Button variant="outline" size="sm" onClick={() => handleRemoveEmailFromEdit(index)}>
                    Remove
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddEmailToEdit} className="w-full bg-transparent">
              <Plus className="w-4 h-4 mr-2" />
              Add Another Email
            </Button>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" onClick={handleDelete}>
            Delete Newsletter
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
