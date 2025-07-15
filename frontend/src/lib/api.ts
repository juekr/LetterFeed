// frontend/src/lib/api.ts

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export interface Sender {
    id: number;
    email: string;
    newsletter_id: number;
}

export interface Newsletter {
  id: number
  name: string
  is_active: boolean
  senders: { id: number; email: string }[]
  entries_count: number
}

export interface NewsletterCreate {
    name: string;
    sender_emails: string[];
}

export interface NewsletterUpdate {
    name: string;
    sender_emails: string[];
}

export interface Settings {
    id: number;
    imap_server: string;
    imap_username: string;
    search_folder: string;
    move_to_folder?: string | null;
    mark_as_read: boolean;
    email_check_interval: number;
    auto_add_new_senders: boolean;
    locked_fields: string[];
}

export interface SettingsCreate {
    imap_server: string;
    imap_username: string;
    imap_password?: string;
    search_folder: string;
    move_to_folder?: string | null;
    mark_as_read: boolean;
    email_check_interval: number;
    auto_add_new_senders: boolean;
}


export async function getNewsletters(): Promise<Newsletter[]> {
    const response = await fetch(`${API_BASE_URL}/newsletters`);
    if (!response.ok) {
        throw new Error("Failed to fetch newsletters");
    }
    return response.json();
}

export async function createNewsletter(newsletter: NewsletterCreate): Promise<Newsletter> {
    const response = await fetch(`${API_BASE_URL}/newsletters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletter),
    });
    if (!response.ok) {
        throw new Error("Failed to create newsletter");
    }
    return response.json();
}

export async function updateNewsletter(id: number, newsletter: NewsletterUpdate): Promise<Newsletter> {
    const response = await fetch(`${API_BASE_URL}/newsletters/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletter),
    });
    if (!response.ok) {
        throw new Error("Failed to update newsletter");
    }
    return response.json();
}

export async function deleteNewsletter(id: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/newsletters/${id}`, {
        method: 'DELETE',
    });
    if (!response.ok) {
        throw new Error("Failed to delete newsletter");
    }
}

export async function getSettings(): Promise<Settings> {
    const response = await fetch(`${API_BASE_URL}/imap/settings`);
    if (!response.ok) {
        throw new Error("Failed to fetch settings");
    }
    return response.json();
}

export async function updateSettings(settings: SettingsCreate): Promise<Settings> {
    const response = await fetch(`${API_BASE_URL}/imap/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    });
    if (!response.ok) {
        throw new Error("Failed to update settings");
    }
    return response.json();
}

export async function getImapFolders(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/imap/folders`);
    // If it fails, it's probably because settings are not configured. Return empty array.
    if (!response.ok) {
        return [];
    }
    return response.json();
}

export async function testImapConnection(): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/imap/test`, {
        method: 'POST',
    });
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Failed to test IMAP connection");
    }
    return response.json();
}

export function getFeedUrl(newsletterId: number): string {
    return `${API_BASE_URL}/feeds/${newsletterId}`;
}
