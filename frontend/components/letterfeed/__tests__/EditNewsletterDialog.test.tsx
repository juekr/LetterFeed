import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { EditNewsletterDialog } from "../EditNewsletterDialog"
import { Newsletter } from "@/lib/api"
import * as api from "@/lib/api"

// Mock the API module
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  updateNewsletter: jest.fn(),
  deleteNewsletter: jest.fn(),
}))

const mockedApi = api as jest.Mocked<typeof api>

const mockNewsletter: Newsletter = {
  id: 1,
  name: "Existing Newsletter",
  is_active: true,
  senders: [{ id: 1, email: "current@example.com", newsletter_id: 1 }],
  entries_count: 5,
}

describe("EditNewsletterDialog", () => {
  const handleOpenChange = jest.fn()
  const handleSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    // Mock window.confirm for the delete action
    window.confirm = jest.fn(() => true)
  })

  it("renders with initial newsletter data and allows updates", async () => {
    mockedApi.updateNewsletter.mockResolvedValueOnce({ ...mockNewsletter, name: "Updated Name" })

    render(
      <EditNewsletterDialog
        newsletter={mockNewsletter}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    // Check that initial data is present
    const nameInput = screen.getByLabelText(/Newsletter Name/i)
    expect(nameInput).toHaveValue("Existing Newsletter")
    expect(screen.getByDisplayValue("current@example.com")).toBeInTheDocument()

    // Update the name
    fireEvent.change(nameInput, { target: { value: "Updated Name" } })

    // Submit
    fireEvent.click(screen.getByRole("button", { name: /Save Changes/i }))

    await waitFor(() => {
      expect(mockedApi.updateNewsletter).toHaveBeenCalledWith(1, {
        name: "Updated Name",
        sender_emails: ["current@example.com"],
      })
      expect(handleSuccess).toHaveBeenCalledTimes(1)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("calls deleteNewsletter when delete button is clicked and confirmed", async () => {
    mockedApi.deleteNewsletter.mockResolvedValueOnce()

    render(
      <EditNewsletterDialog
        newsletter={mockNewsletter}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Delete Newsletter/i }))

    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete the "Existing Newsletter" newsletter?')

    await waitFor(() => {
      expect(mockedApi.deleteNewsletter).toHaveBeenCalledWith(1)
      expect(handleSuccess).toHaveBeenCalledTimes(1)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("does not call deleteNewsletter when delete is not confirmed", () => {
    window.confirm = jest.fn(() => false) // User clicks "Cancel"

    render(
      <EditNewsletterDialog
        newsletter={mockNewsletter}
        isOpen={true}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    )

    fireEvent.click(screen.getByRole("button", { name: /Delete Newsletter/i }))

    expect(mockedApi.deleteNewsletter).not.toHaveBeenCalled()
    expect(handleSuccess).not.toHaveBeenCalled()
  })
})
