import React from "react"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { LoadingSpinner } from "../LoadingSpinner"

describe("LoadingSpinner", () => {
  it("renders the spinner with the correct animation class", () => {
    render(<LoadingSpinner />)
    const spinner = screen.getByTestId("loading-spinner")
    expect(spinner).toBeInTheDocument()
    expect(spinner).toHaveClass("animate-spin")
  })
})
