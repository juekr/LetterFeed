import {
  getNewsletters,
  createNewsletter,
  updateNewsletter,
  deleteNewsletter,
  getSettings,
  updateSettings,
  getImapFolders,
  testImapConnection,
  getFeedUrl,
  NewsletterCreate,
  NewsletterUpdate,
  SettingsCreate,
} from "../api"

// Mock the global fetch function
global.fetch = jest.fn()

const mockFetch = (data: any, ok = true) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok,
    json: () => Promise.resolve(data),
  })
}

const mockFetchError = (data: any = {}) => { // eslint-disable-line @typescript-eslint/no-explicit-any
  ;(fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: () => Promise.resolve(data),
  })
}

describe("API Functions", () => {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL

  beforeEach(() => {
    // Reset the mock before each test
    ;(fetch as jest.Mock).mockClear()
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
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/newsletters`)
    })

    it("should throw an error if fetching newsletters fails", async () => {
      mockFetchError()
      await expect(getNewsletters()).rejects.toThrow("Failed to fetch newsletters")
    })
  })

  describe("createNewsletter", () => {
    it("should create a newsletter successfully", async () => {
      const newNewsletter: NewsletterCreate = { name: "New Newsletter", sender_emails: ["test@example.com"] }
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
    })

    it("should throw an error if creating newsletter fails", async () => {
      const newNewsletter: NewsletterCreate = { name: "New Newsletter", sender_emails: [] }
      mockFetchError()
      await expect(createNewsletter(newNewsletter)).rejects.toThrow("Failed to create newsletter")
    })
  })

  describe("updateNewsletter", () => {
    it("should update a newsletter successfully", async () => {
      const updatedNewsletter: NewsletterUpdate = { name: "Updated Newsletter", sender_emails: ["updated@example.com"] }
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
    })

    it("should throw an error if updating newsletter fails", async () => {
      const updatedNewsletter: NewsletterUpdate = { name: "Updated Newsletter", sender_emails: [] }
      const newsletterId = 1
      mockFetchError()
      await expect(updateNewsletter(newsletterId, updatedNewsletter)).rejects.toThrow("Failed to update newsletter")
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
    })

    it("should throw an error if deleting newsletter fails", async () => {
      const newsletterId = 1
      mockFetchError()
      await expect(deleteNewsletter(newsletterId)).rejects.toThrow("Failed to delete newsletter")
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
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/settings`)
    })

    it("should throw an error if fetching settings fails", async () => {
      mockFetchError()
      await expect(getSettings()).rejects.toThrow("Failed to fetch settings")
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
    })

    it("should throw an error if updating settings fails", async () => {
      const newSettings: SettingsCreate = {
        imap_server: "new.imap.com",
        imap_username: "newuser@example.com",
        search_folder: "Archive",
        mark_as_read: false,
        email_check_interval: 120,
        auto_add_new_senders: true,
      }
      mockFetchError()
      await expect(updateSettings(newSettings)).rejects.toThrow("Failed to update settings")
    })
  })

  describe("getImapFolders", () => {
    it("should fetch IMAP folders successfully", async () => {
      const mockFolders = ["INBOX", "Sent", "Archive"]
      mockFetch(mockFolders)

      const folders = await getImapFolders()
      expect(folders).toEqual(mockFolders)
      expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/imap/folders`)
    })

    it("should return an empty array if fetching IMAP folders fails", async () => {
      mockFetchError()
      const folders = await getImapFolders()
      expect(folders).toEqual([])
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
    })

    it("should throw an error with detail if testing IMAP connection fails", async () => {
      const errorMessage = "Invalid credentials"
      mockFetchError({ detail: errorMessage })
      await expect(testImapConnection()).rejects.toThrow(errorMessage)
    })

    it("should throw a generic error if testing IMAP connection fails without detail", async () => {
      mockFetchError()
      await expect(testImapConnection()).rejects.toThrow("Failed to test IMAP connection")
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
