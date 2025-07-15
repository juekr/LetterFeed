import { Loader2 } from "lucide-react"

export function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-gray-400 animate-spin" data-testid="loading-spinner" />
    </div>
  )
}
