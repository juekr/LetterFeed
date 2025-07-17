import {
  getNewsletters,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  getSettings,
  updateSettings,
  getImapFolders,
  testImapConnection,
  processEmails,
  getFeedUrl,
  NewsletterCreate,
  NewsletterUpdate,
  SettingsCreate,
} from "../api"
import { toast } from "sonner"

// Mock the global fetch function
global.fetch = jest.fn()

// Mock the toast object
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}))

const mockFetch = (data: any, ok = true, statusText = "OK") => { // eslint-disable-line @typescript-eslint/no-explicit-any
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(data),
    statusText,
  })
}

const mockFetchError = (data: any = {}, statusText = "Bad Request") => { // eslint-disable-line @typescript-eslint/no-explicit-any
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve(data),
    statusText,
  })
}

describe("API Functions", () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    // Reset the mock before each test
    ;(fetch as jest.Mock).mockClear()
    ;(toast.error as jest.Mock).mockClear()
  })

  describe("getNewsletters", () => {
    it("should fetch newsletters successfully", async () => {
      const mockNewsletters = [
        { id: 1, name: "Newsletter 1", is_active: true, senders: [], entries_count: 5 },
        { id: 2, name: "Newsletter 2", is_active: false, senders: [], entries_count: 10 },
      ]
      mockFetch(mockNewsletters)

      const newsletters = await getNewsletters()
      expect(newsletters).toEqual(mockNewsletters)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/newsletters`, {})
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if fetching newsletters fails with HTTP error", async () => {
      mockFetchError({}, "Not Found")
      await expect(getNewsletters()).rejects.toThrow("Failed to fetch newsletters: Not Found")
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch newsletters: Not Found")
    })

    it("should throw an error and show toast if fetching newsletters fails with network error", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(getNewsletters()).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("createNewsletter", () => {
    it("should create a newsletter successfully", async () => {
      const newNewsletter: NewsletterCreate = { name: "New Newsletter", sender_emails: ["test@example.com"], extract_content: false }
      const createdNewsletter = {
        id: 3,
        ...newNewsletter,
        is_active: true,
        senders: [{ id: 1, email: "test@example.com", newsletter_id: 3 }],
        entries_count: 0,
      }
      mockFetch(createdNewsletter)

      const result = await createNewsletter(newNewsletter)
      expect(result).toEqual(createdNewsletter)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/newsletters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNewsletter),
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if creating newsletter fails with HTTP error", async () => {
      const newNewsletter: NewsletterCreate = { name: "New Newsletter", sender_emails: [], extract_content: false }
      mockFetchError({}, "Conflict")
      await expect(createNewsletter(newNewsletter)).rejects.toThrow("Failed to create newsletter: Conflict")
      expect(toast.error).toHaveBeenCalledWith("Failed to create newsletter: Conflict")
    })

    it("should throw an error and show toast if creating newsletter fails with network error", async () => {
      const newNewsletter: NewsletterCreate = { name: "New Newsletter", sender_emails: [], extract_content: false }
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(createNewsletter(newNewsletter)).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("updateNewsletter", () => {
    it("should update a newsletter successfully", async () => {
      const updatedNewsletter: NewsletterUpdate = { name: "Updated Newsletter", sender_emails: ["updated@example.com"], extract_content: true }
      const newsletterId = 1
      const returnedNewsletter = {
        id: newsletterId,
        ...updatedNewsletter,
        is_active: true,
        senders: [{ id: 1, email: "updated@example.com", newsletter_id: newsletterId }],
        entries_count: 12,
      }
      mockFetch(returnedNewsletter)

      const result = await updateNewsletter(newsletterId, updatedNewsletter)
      expect(result).toEqual(returnedNewsletter)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/newsletters/${newsletterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedNewsletter),
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if updating newsletter fails with HTTP error", async () => {
      const updatedNewsletter: NewsletterUpdate = { name: "Updated Newsletter", sender_emails: [], extract_content: true }
      const newsletterId = 1
      mockFetchError({}, "Bad Request")
      await expect(updateNewsletter(newsletterId, updatedNewsletter)).rejects.toThrow("Failed to update newsletter: Bad Request")
      expect(toast.error).toHaveBeenCalledWith("Failed to update newsletter: Bad Request")
    })

    it("should throw an error and show toast if updating newsletter fails with network error", async () => {
      const updatedNewsletter: NewsletterUpdate = { name: "Updated Newsletter", sender_emails: [], extract_content: true }
      const newsletterId = 1
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(updateNewsletter(newsletterId, updatedNewsletter)).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("deleteNewsletter", () => {
    it("should delete a newsletter successfully", async () => {
      const newsletterId = 1
      mockFetch({}, true) // Successful deletion might not have a body

      await deleteNewsletter(newsletterId)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/newsletters/${newsletterId}`, {
        method: "DELETE",
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if deleting newsletter fails with HTTP error", async () => {
      const newsletterId = 1
      mockFetchError({}, "Forbidden")
      await expect(deleteNewsletter(newsletterId)).rejects.toThrow("Failed to delete newsletter: Forbidden")
      expect(toast.error).toHaveBeenCalledWith("Failed to delete newsletter: Forbidden")
    })

    it("should throw an error and show toast if deleting newsletter fails with network error", async () => {
      const newsletterId = 1
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(deleteNewsletter(newsletterId)).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("getSettings", () => {
    it("should fetch settings successfully", async () => {
      const mockSettings = {
        id: 1,
        imap_server: "imap.example.com",
        imap_username: "user@example.com",
        search_folder: "INBOX",
        move_to_folder: null,
        mark_as_read: true,
        email_check_interval: 60,
        auto_add_new_senders: false,
        locked_fields: [],
      }
      mockFetch(mockSettings)

      const settings = await getSettings()
      expect(settings).toEqual(mockSettings)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/settings`, {})
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if fetching settings fails with HTTP error", async () => {
      mockFetchError({}, "Unauthorized")
      await expect(getSettings()).rejects.toThrow("Failed to fetch settings: Unauthorized")
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch settings: Unauthorized")
    })

    it("should throw an error and show toast if fetching settings fails with network error", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(getSettings()).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("updateSettings", () => {
    it("should update settings successfully", async () => {
      const newSettings: SettingsCreate = {
        imap_server: "new.imap.com",
        imap_username: "newuser@example.com",
        imap_password: "password",
        search_folder: "Archive",
        move_to_folder: "Processed",
        mark_as_read: false,
        email_check_interval: 120,
        auto_add_new_senders: true,
      }
      const updatedSettings = { id: 1, ...newSettings, locked_fields: [] }
      mockFetch(updatedSettings)

      const result = await updateSettings(newSettings)
      expect(result).toEqual(updatedSettings)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSettings),
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error and show toast if updating settings fails with HTTP error", async () => {
      const newSettings: SettingsCreate = {
        imap_server: "new.imap.com",
        imap_username: "newuser@example.com",
        search_folder: "Archive",
        mark_as_read: false,
        email_check_interval: 120,
        auto_add_new_senders: true,
      }
      mockFetchError({}, "Internal Server Error")
      await expect(updateSettings(newSettings)).rejects.toThrow("Failed to update settings: Internal Server Error")
      expect(toast.error).toHaveBeenCalledWith("Failed to update settings: Internal Server Error")
    })

    it("should throw an error and show toast if updating settings fails with network error", async () => {
      const newSettings: SettingsCreate = {
        imap_server: "new.imap.com",
        imap_username: "newuser@example.com",
        search_folder: "Archive",
        mark_as_read: false,
        email_check_interval: 120,
        auto_add_new_senders: true,
      }
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(updateSettings(newSettings)).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("getImapFolders", () => {
    it("should fetch IMAP folders successfully", async () => {
      const mockFolders = ["INBOX", "Sent", "Archive"]
      mockFetch(mockFolders)

      const folders = await getImapFolders()
      expect(folders).toEqual(mockFolders)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/folders`, {})
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should return an empty array and show toast if fetching IMAP folders fails with HTTP error", async () => {
      mockFetchError({}, "Forbidden")
      const folders = await getImapFolders()
      expect(folders).toEqual([])
      expect(toast.error).toHaveBeenCalledWith("Failed to fetch IMAP folders: Forbidden")
    })

    it("should return an empty array and show toast if fetching IMAP folders fails with network error", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      const folders = await getImapFolders()
      expect(folders).toEqual([])
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("testImapConnection", () => {
    it("should test IMAP connection successfully", async () => {
      const mockResponse = { message: "Connection successful" }
      mockFetch(mockResponse)

      const result = await testImapConnection()
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/test`, {
        method: "POST",
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error with detail and show toast if testing IMAP connection fails with HTTP error", async () => {
      const errorMessage = "Invalid credentials"
      mockFetchError({ detail: errorMessage }, "Unauthorized")
      await expect(testImapConnection()).rejects.toThrow(errorMessage)
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })

    it("should throw a generic error and show toast if testing IMAP connection fails without detail with HTTP error", async () => {
      mockFetchError({}, "Bad Gateway")
      await expect(testImapConnection()).rejects.toThrow("Failed to test IMAP connection: Bad Gateway")
      expect(toast.error).toHaveBeenCalledWith("Failed to test IMAP connection: Bad Gateway")
    })

    it("should throw an error and show toast if testing IMAP connection fails with network error", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(testImapConnection()).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("processEmails", () => {
    it("should process emails successfully", async () => {
      const mockResponse = { message: "Emails processed" }
      mockFetch(mockResponse)

      const result = await processEmails()
      expect(result).toEqual(mockResponse)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/process`, {
        method: "POST",
      })
      expect(toast.error).not.toHaveBeenCalled()
    })

    it("should throw an error with detail and show toast if processing emails fails with HTTP error", async () => {
      const errorMessage = "IMAP not configured"
      mockFetchError({ detail: errorMessage }, "Bad Request")
      await expect(processEmails()).rejects.toThrow(errorMessage)
      expect(toast.error).toHaveBeenCalledWith(errorMessage)
    })

    it("should throw a generic error and show toast if processing emails fails without detail with HTTP error", async () => {
      mockFetchError({}, "Service Unavailable")
      await expect(processEmails()).rejects.toThrow("Failed to process emails: Service Unavailable")
      expect(toast.error).toHaveBeenCalledWith("Failed to process emails: Service Unavailable")
    })

    it("should throw an error and show toast if processing emails fails with network error", async () => {
      ;(fetch as jest.Mock).mockRejectedValueOnce(new TypeError("Network request failed"))
      await expect(processEmails()).rejects.toThrow("Network request failed")
      expect(toast.error).toHaveBeenCalledWith("Network error: Could not connect to the backend.")
    })
  })

  describe("getFeedUrl", () => {
    it("should return the correct feed URL", () => {
      const newsletterId = 123
      const expectedUrl = `${API_BASE_URL}/feeds/${newsletterId}`
      const url = getFeedUrl(newsletterId)
      expect(url).toBe(expectedUrl)
    })

    it("should handle newsletterId being 0", () => {
      const newsletterId = 0
      const expectedUrl = `${API_BASE_URL}/feeds/0`
      const url = getFeedUrl(newsletterId)
      expect(url).toBe(expectedUrl)
    })
  })
})
