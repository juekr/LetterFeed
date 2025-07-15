import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { EmptyState } from "../EmptyState"

describe("EmptyState", () => {
  it("renders the correct content", () => {
    render(<EmptyState onAddNewsletter={() => {}} />)

    expect(screen.getByText("No newsletters registered")).toBeInTheDocument()
    expect(screen.getByText("Get started by adding your first newsletter")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Add Your First Newsletter/i })).toBeInTheDocument()
  })

  it("calls onAddNewsletter when the button is clicked", () => {
    const handleAddNewsletter = jest.fn()
    render(<EmptyState onAddNewsletter={handleAddNewsletter} />)

    const addButton = screen.getByRole("button", { name: /Add Your First Newsletter/i })
    fireEvent.click(addButton)

    expect(handleAddNewsletter).toHaveBeenCalledTimes(1)
  })
})
