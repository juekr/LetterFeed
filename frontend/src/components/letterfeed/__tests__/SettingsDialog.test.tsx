import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { SettingsDialog } from "../SettingsDialog"
import { Settings } from "@/lib/api"
import * as api from "@/lib/api"
import { toast } from "sonner"

// Mock the API module
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  updateSettings: jest.fn(),
  testImapConnection: jest.fn(),
}))

// Mock the toast module
jest.mock("sonner", () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}))

const mockedApi = api as jest.Mocked<typeof api>

const mockSettings: Settings = {
  id: 1,
  imap_server: "imap.example.com",
  imap_username: "user@example.com",
  search_folder: "INBOX",
  move_to_folder: "Archive",
  mark_as_read: true,
  email_check_interval: 30,
  auto_add_new_senders: false,
  locked_fields: ["imap_server"], // Mock a locked field
}

const mockFolderOptions = ["INBOX", "Sent", "Archive", "Spam"]

describe("SettingsDialog", () => {
  const handleOpenChange = jest.fn()
  const handleSuccess = jest.fn()
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
    consoleError.mockClear()
  })

  afterAll(() => {
    consoleError.mockRestore()
  })

  it("renders settings and respects locked fields", () => {
    render(
      <SettingsDialog
        settings={mockSettings}
        folderOptions={mockFolderOptions}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    // Check that a locked field is disabled
    expect(screen.getByLabelText(/IMAP Server/i)).toBeDisabled()
    // Check that a non-locked field is enabled
    expect(screen.getByLabelText(/IMAP Username/i)).toBeEnabled()

    // Check that values are set correctly
    expect(screen.getByLabelText(/IMAP Username/i)).toHaveValue(
      mockSettings.imap_username
    )
    expect(screen.getByLabelText(/Mark emails as read/i)).toBeChecked()
  })

  it("allows updating and saving settings, showing success toast", async () => {
    mockedApi.updateSettings.mockResolvedValueOnce(mockSettings)

    render(
      <SettingsDialog
        settings={mockSettings}
        folderOptions={mockFolderOptions}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    // Change a setting
    fireEvent.change(screen.getByLabelText(/IMAP Username/i), {
      target: { value: "new.user@example.com" },
    })

    // Save
    fireEvent.click(screen.getByRole("button", { name: /Save Settings/i }))

    await waitFor(() => {
      expect(mockedApi.updateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          imap_username: "new.user@example.com",
        })
      )
      expect(toast.success).toHaveBeenCalledWith("Settings saved successfully!")
      expect(handleSuccess).toHaveBeenCalledTimes(1)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("shows an error toast if saving settings fails", async () => {
    mockedApi.updateSettings.mockRejectedValueOnce(new Error("Failed to save"))

    render(
      <SettingsDialog
        settings={mockSettings}
        folderOptions={mockFolderOptions}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Save Settings/i }))

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Failed to save settings.")
      expect(handleSuccess).not.toHaveBeenCalled()
    })
  })

  it("handles successful connection test", async () => {
    mockedApi.testImapConnection.mockResolvedValueOnce({
      message: "Connection successful!",
    })

    render(
      <SettingsDialog
        settings={mockSettings}
        folderOptions={mockFolderOptions}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Test Connection/i }))

    await waitFor(() => {
      expect(screen.getByText("Connection successful!")).toBeInTheDocument()
      expect(screen.getByTestId("connection-status")).toHaveClass(
        "text-green-600"
      )
    })
  })

  it("handles failed connection test", async () => {
    mockedApi.testImapConnection.mockRejectedValueOnce(
      new Error("Authentication failed")
    )

    render(
      <SettingsDialog
        settings={mockSettings}
        folderOptions={mockFolderOptions}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Test Connection/i }))

    await waitFor(() => {
      expect(screen.getByText("Authentication failed")).toBeInTheDocument()
      expect(screen.getByTestId("connection-status")).toHaveClass("text-red-600")
    })
  })
})
