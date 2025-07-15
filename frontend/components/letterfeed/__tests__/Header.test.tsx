import React from "react"
import { render, screen, fireEvent } from "@testing-library/react"
import "@testing-library/jest-dom"
import { Header } from "../Header"

describe("Header", () => {
  it("renders the title and description", () => {
    render(<Header onOpenAddNewsletter={() => {}} onOpenSettings={() => {}} />)
    expect(screen.getByText("LetterFeed")).toBeInTheDocument()
    expect(screen.getByText("Read your newsletters as RSS feeds!")).toBeInTheDocument()
  })

  it('calls onOpenAddNewsletter when "Add Newsletter" button is clicked', () => {
    const handleOpenAdd = jest.fn()
    render(<Header onOpenAddNewsletter={handleOpenAdd} onOpenSettings={() => {}} />)

    const addButton = screen.getByRole("button", { name: /Add Newsletter/i })
    fireEvent.click(addButton)
    expect(handleOpenAdd).toHaveBeenCalledTimes(1)
  })

  it('calls onOpenSettings when "Settings" button is clicked', () => {
    const handleOpenSettings = jest.fn()
    render(<Header onOpenAddNewsletter={() => {}} onOpenSettings={handleOpenSettings} />)

    const settingsButton = screen.getByRole("button", { name: /Settings/i })
    fireEvent.click(settingsButton)
    expect(handleOpenSettings).toHaveBeenCalledTimes(1)
  })
})
