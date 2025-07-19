import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import LoginPage from "@/app/login/page"
import { useAuth } from "@/hooks/useAuth"
import { toast } from "sonner"

jest.mock("@/hooks/useAuth")
jest.mock("sonner", () => ({
  toast: {
    error: jest.fn(),
  },
}))

const mockedUseAuth = useAuth as jest.Mock
const mockedToast = toast as jest.Mocked<typeof toast>

describe("LoginPage", () => {
  const login = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockedUseAuth.mockReturnValue({ login })
  })

  it("renders the login page", () => {
    render(<LoginPage />)
    expect(screen.getByText("LetterFeed")).toBeInTheDocument()
    expect(screen.getByLabelText("Username")).toBeInTheDocument()
    expect(screen.getByLabelText("Password")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument()
  })

  it("allows typing in the username and password fields", () => {
    render(<LoginPage />)
    const usernameInput = screen.getByLabelText("Username")
    const passwordInput = screen.getByLabelText("Password")
    fireEvent.change(usernameInput, { target: { value: "test-user" } })
    fireEvent.change(passwordInput, { target: { value: "test-password" } })
    expect(usernameInput).toHaveValue("test-user")
    expect(passwordInput).toHaveValue("test-password")
  })

  it("calls login on form submission with username and password", async () => {
    render(<LoginPage />)
    const usernameInput = screen.getByLabelText("Username")
    const passwordInput = screen.getByLabelText("Password")
    fireEvent.change(usernameInput, { target: { value: "test-user" } })
    fireEvent.change(passwordInput, { target: { value: "test-password" } })
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }))
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith("test-user", "test-password")
    })
  })

  it("does not show an error if login fails, as it is handled by the api layer", async () => {
    login.mockRejectedValue(new Error("Invalid username or password"))
    render(<LoginPage />)
    const usernameInput = screen.getByLabelText("Username")
    const passwordInput = screen.getByLabelText("Password")
    fireEvent.change(usernameInput, { target: { value: "wrong-user" } })
    fireEvent.change(passwordInput, { target: { value: "wrong-password" } })
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }))
    await waitFor(() => {
      expect(login).toHaveBeenCalled()
      expect(mockedToast.error).not.toHaveBeenCalled()
    })
  })

  it("shows an error if username is not provided", async () => {
    render(<LoginPage />)
    const passwordInput = screen.getByLabelText("Password")
    fireEvent.change(passwordInput, { target: { value: "test-password" } })
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }))
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Please fill in all fields")
    })
  })

  it("shows an error if password is not provided", async () => {
    render(<LoginPage />)
    const usernameInput = screen.getByLabelText("Username")
    fireEvent.change(usernameInput, { target: { value: "test-user" } })
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }))
    await waitFor(() => {
      expect(mockedToast.error).toHaveBeenCalledWith("Please fill in all fields")
    })
  })
})
