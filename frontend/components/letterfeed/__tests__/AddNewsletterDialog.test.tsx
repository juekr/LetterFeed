import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { AddNewsletterDialog } from "../AddNewsletterDialog"
import * as api from "@/lib/api"

// Mock the API module
jest.mock("@/lib/api", () => ({
  ...jest.requireActual("@/lib/api"),
  createNewsletter: jest.fn(),
}))

const mockedApi = api as jest.Mocked<typeof api>

describe("AddNewsletterDialog", () => {
  const handleOpenChange = jest.fn()
  const handleSuccess = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("allows user to fill out the form and submit", async () => {
    mockedApi.createNewsletter.mockResolvedValueOnce({
      id: 1,
      name: "My New Newsletter",
      is_active: true,
      extract_content: false,
      senders: [{ id: 1, email: "test@example.com", newsletter_id: 1 }],
      entries_count: 0,
    })

    render(<AddNewsletterDialog isOpen={true} onOpenChange={handleOpenChange} onSuccess={handleSuccess} />)

    // Fill out the form
    fireEvent.change(screen.getByLabelText(/Newsletter Name/i), { target: { value: "My New Newsletter" } })
    fireEvent.change(screen.getByPlaceholderText(/Enter email address/i), { target: { value: "test@example.com" } })

    // Submit the form
    fireEvent.click(screen.getByRole("button", { name: /Register Newsletter/i }))

    // Wait for the async operation to complete
    await waitFor(() => {
      expect(mockedApi.createNewsletter).toHaveBeenCalledWith({
        name: "My New Newsletter",
        sender_emails: ["test@example.com"],
        extract_content: false,
      })
      expect(handleSuccess).toHaveBeenCalledTimes(1)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it("allows adding and removing email fields", () => {
    render(<AddNewsletterDialog isOpen={true} onOpenChange={() => {}} onSuccess={() => {}} />)

    // Initial state
    expect(screen.getAllByPlaceholderText(/Enter email address/i)).toHaveLength(1)

    // Add another email
    fireEvent.click(screen.getByRole("button", { name: /Add Another Email/i }))
    expect(screen.getAllByPlaceholderText(/Enter email address/i)).toHaveLength(2)

    // Remove the first email
    fireEvent.click(screen.getAllByRole("button", { name: /Remove/i })[0])
    expect(screen.getAllByPlaceholderText(/Enter email address/i)).toHaveLength(1)
  })

  it("closes the dialog when cancel is clicked", () => {
    render(<AddNewsletterDialog isOpen={true} onOpenChange={handleOpenChange} onSuccess={handleSuccess} />)

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
    expect(handleSuccess).not.toHaveBeenCalled()
  })
})
