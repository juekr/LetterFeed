import { Newsletter } from "@/lib/api"
import { NewsletterCard } from "./NewsletterCard"

interface NewsletterListProps {
  newsletters: Newsletter[]
  onEditNewsletter: (newsletter: Newsletter) => void
}

export function NewsletterList({ newsletters, onEditNewsletter }: NewsletterListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {newsletters.map((newsletter) => (
        <NewsletterCard key={newsletter.id} newsletter={newsletter} onEdit={onEditNewsletter} />
      ))}
    </div>
  )
}
