import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Rss, Mail, ExternalLink, Edit } from "lucide-react"
import { Newsletter, getFeedUrl } from "@/lib/api"

interface NewsletterCardProps {
  newsletter: Newsletter
  onEdit: (newsletter: Newsletter) => void
}

export function NewsletterCard({ newsletter, onEdit }: NewsletterCardProps) {
  const feedUrl = getFeedUrl(newsletter)

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Rss className="w-5 h-5 text-orange-500" />
              {newsletter.name}
            </CardTitle>
            <CardDescription>
              {newsletter.entries_count} entr{newsletter.entries_count !== 1 ? "ies" : "y"}
            </CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(newsletter)} aria-label="Edit Newsletter">
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-grow">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
            <Mail className="w-4 h-4" />
            Email Addresses
          </h4>
          <div className="flex flex-wrap gap-1">
            {newsletter.senders.map((sender) => (
              <Badge key={sender.id} variant="secondary" className="text-xs">
                {sender.email}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">RSS Feed</h4>
          <a
            href={feedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            <ExternalLink className="w-3 h-3" />
            {feedUrl}
          </a>
        </div>
      </CardContent>
    </Card>
  )
}
