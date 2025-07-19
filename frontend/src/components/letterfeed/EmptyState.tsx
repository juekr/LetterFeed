import { Button } from "@/components/ui/button"
import { Plus, Rss } from "lucide-react"

interface EmptyStateProps {
  onAddNewsletter: () => void
}

export function EmptyState({ onAddNewsletter }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Rss className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-medium text-foreground mb-2">No newsletters registered</h3>
      <p className="text-muted-foreground mb-4">Get started by adding your first newsletter</p>
      <Button onClick={onAddNewsletter}>
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Newsletter
      </Button>
    </div>
  )
}
