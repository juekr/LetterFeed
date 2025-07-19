import { Button } from "@/components/ui/button"
import { Plus, Rss } from "lucide-react"

interface EmptyStateProps {
  onAddNewsletter: () => void
}

export function EmptyState({ onAddNewsletter }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <Rss className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No newsletters registered</h3>
      <p className="text-gray-600 mb-4">Get started by adding your first newsletter</p>
      <Button onClick={onAddNewsletter}>
        <Plus className="w-4 h-4 mr-2" />
        Add Your First Newsletter
      </Button>
    </div>
  )
}
