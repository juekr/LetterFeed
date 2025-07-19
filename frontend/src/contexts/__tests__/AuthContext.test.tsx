import React from "react"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"
import "@testing-library/jest-dom"
import { AuthProvider, AuthContext } from "@/contexts/AuthContext"
import * as api from "@/lib/api"
import { useRouter } from "next/navigation"

jest.mock("@/lib/api")
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}))

const mockedApi = api as jest.Mocked<typeof api>
const mockedUseRouter = useRouter as jest.Mock

describe("AuthContext", () => {
  const push = jest.fn()
  const consoleError = jest.spyOn(console, "error").mockImplementation(() => {})

  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockedUseRouter.mockReturnValue({ push })
    consoleError.mockClear()
  })

  afterAll(() => {
    consoleError.mockRestore()
  })

  it("authenticates and sets auth enabled to false if auth is not enabled on server", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: false })
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <div>
              <span>
                Is Authenticated: {value?.isAuthenticated.toString()}
              </span>
              <span>
                Is Auth Enabled: {value?.isAuthEnabled.toString()}
              </span>
            </div>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: true")).toBeInTheDocument()
      expect(screen.getByText("Is Auth Enabled: false")).toBeInTheDocument()
    })
  })

  it("authenticates if auth is enabled and token is valid", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: true })
    mockedApi.getSettings.mockResolvedValue({} as api.Settings) // Mock a successful protected call
    localStorage.setItem("authToken", "valid-token")
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <div>
              <span>
                Is Authenticated: {value?.isAuthenticated.toString()}
              </span>
              <span>
                Is Auth Enabled: {value?.isAuthEnabled.toString()}
              </span>
            </div>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: true")).toBeInTheDocument()
      expect(screen.getByText("Is Auth Enabled: true")).toBeInTheDocument()
    })
  })

  it("does not authenticate if auth is enabled and no token", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: true })
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <span>
              Is Authenticated: {value?.isAuthenticated.toString()}
            </span>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: false")).toBeInTheDocument()
    })
  })

  it("does not authenticate if token is invalid", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: true })
    mockedApi.getSettings.mockRejectedValue(new Error("Invalid token")) // Mock a failed protected call
    localStorage.setItem("authToken", "invalid-token")
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <span>
              Is Authenticated: {value?.isAuthenticated.toString()}
            </span>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: false")).toBeInTheDocument()
    })
  })

  it("login works correctly", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: true })
    mockedApi.login.mockResolvedValue()
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <>
              <span>
                Is Authenticated: {value?.isAuthenticated.toString()}
              </span>
              <button onClick={() => value?.login("testuser", "password")}>Login</button>
            </>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: false")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("Login"))
    await waitFor(() => {
      expect(mockedApi.login).toHaveBeenCalledWith("testuser", "password")
      expect(screen.getByText("Is Authenticated: true")).toBeInTheDocument()
      expect(push).toHaveBeenCalledWith("/")
    })
  })

  it("logout works correctly", async () => {
    mockedApi.getAuthStatus.mockResolvedValue({ auth_enabled: true })
    mockedApi.getSettings.mockResolvedValue({} as api.Settings)
    localStorage.setItem("authToken", "valid-token")
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => (
            <>
              <span>
                Is Authenticated: {value?.isAuthenticated.toString()}
              </span>
              <button onClick={() => value?.logout()}>Logout</button>
            </>
          )}
        </AuthContext.Consumer>
      </AuthProvider>
    )
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: true")).toBeInTheDocument()
    })
    fireEvent.click(screen.getByText("Logout"))
    await waitFor(() => {
      expect(screen.getByText("Is Authenticated: false")).toBeInTheDocument()
      expect(push).toHaveBeenCalledWith("/login")
      expect(localStorage.getItem("authToken")).toBeNull()
    })
  })
})
