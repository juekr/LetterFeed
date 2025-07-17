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
  extract_content: boolean
  senders: { id: number; email: string }[]
  entries_count: number
}

export interface NewsletterCreate {
    name: string;
    sender_emails: string[];
    extract_content: boolean;
}

export interface NewsletterUpdate {
    name: string;
    sender_emails: string[];
    extract_content: boolean;
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


import { toast } from "sonner";

async function fetcher<T>(
    url: string,
    options: RequestInit = {},
    errorMessagePrefix: string,
    returnEmptyArrayOnFailure: boolean = false
): Promise<T> {
    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            let errorText = `${errorMessagePrefix}: ${response.statusText}`;
            try {
                const errorData = await response.json();
                if (errorData.detail) {
                    errorText = errorData.detail;
                }
            } catch (e) { // eslint-disable-line @typescript-eslint/no-unused-vars
                // ignore error if response is not JSON
            }
            toast.error(errorText);
            if (returnEmptyArrayOnFailure) {
                return [] as T;
            }
            throw new Error(errorText);
        }
        return response.json();
    } catch (error) {
        if (error instanceof TypeError) {
            toast.error("Network error: Could not connect to the backend.");
        }
        if (returnEmptyArrayOnFailure) {
            return [] as T;
        }
        throw error;
    }
}

export async function getNewsletters(): Promise<Newsletter[]> {
    return fetcher<Newsletter[]>(`${API_BASE_URL}/newsletters`, {}, "Failed to fetch newsletters");
}

export async function createNewsletter(newsletter: NewsletterCreate): Promise<Newsletter> {
    return fetcher<Newsletter>(`${API_BASE_URL}/newsletters`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletter),
    }, "Failed to create newsletter");
}

export async function updateNewsletter(id: number, newsletter: NewsletterUpdate): Promise<Newsletter> {
    return fetcher<Newsletter>(`${API_BASE_URL}/newsletters/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(newsletter),
    }, "Failed to update newsletter");
}

export async function deleteNewsletter(id: number): Promise<void> {
    await fetcher<void>(`${API_BASE_URL}/newsletters/${id}`, {
        method: 'DELETE',
    }, "Failed to delete newsletter");
}

export async function getSettings(): Promise<Settings> {
    return fetcher<Settings>(`${API_BASE_URL}/imap/settings`, {}, "Failed to fetch settings");
}

export async function updateSettings(settings: SettingsCreate): Promise<Settings> {
    return fetcher<Settings>(`${API_BASE_URL}/imap/settings`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
    }, "Failed to update settings");
}

export async function getImapFolders(): Promise<string[]> {
    return fetcher<string[]>(`${API_BASE_URL}/imap/folders`, {}, "Failed to fetch IMAP folders", true);
}

export async function testImapConnection(): Promise<{ message: string }> {
    return fetcher<{ message: string }>(`${API_BASE_URL}/imap/test`, {
        method: 'POST',
    }, "Failed to test IMAP connection");
}

export async function processEmails(): Promise<{ message: string }> {
    return fetcher<{ message: string }>(`${API_BASE_URL}/imap/process`, {
        method: 'POST',
    }, "Failed to process emails");
}

export function getFeedUrl(newsletterId: number): string {
    return `${API_BASE_URL}/feeds/${newsletterId}`;
}
