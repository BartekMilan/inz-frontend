"use client"

import { useState, useEffect } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Mail, Loader2, AlertCircle } from "lucide-react"
import { useLogin, useGoogleLogin } from "@/hooks/use-auth"
import { useAuth } from "@/contexts/AuthContext"
import { Role } from "@/lib/roles"

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated, userRole } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  const loginMutation = useLogin()
  const googleLoginMutation = useGoogleLogin()

  // Redirect if already authenticated
  // Note: For registrars, redirect is handled in useLogin hook to ensure
  // project context is initialized before navigation
  useEffect(() => {
    if (isAuthenticated) {
      // Only redirect if not already redirected by useLogin hook
      // Check if we're still on login page (means useLogin didn't redirect)
      if (window.location.pathname === '/login') {
        // Get redirect path based on role
        const defaultPath = userRole === Role.ADMIN ? '/users' : '/participants'
        const from = location.state?.from?.pathname || defaultPath
        navigate(from, { replace: true })
      }
    }
  }, [isAuthenticated, userRole, navigate, location])

  // Check for OAuth error in location state
  useEffect(() => {
    if (location.state?.error) {
      setError(location.state.error)
    }
  }, [location.state])

  const handleSignIn = (e) => {
    e.preventDefault()
    setError("")
    loginMutation.mutate({ email, password })
  }

  const handleGoogleSignIn = () => {
    setError("")
    googleLoginMutation.mutate()
  }

  // Handle error messages from mutations
  useEffect(() => {
    if (loginMutation.error) {
      const errorResponse = loginMutation.error.response
      if (errorResponse?.status === 403) {
        const errorCode = errorResponse.data?.code
        if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
          setError("Twoje konto zostało utworzone, ale oczekuje na zatwierdzenie przez administratora. Skontaktuj się z organizatorem wydarzenia.")
        } else if (errorCode === 'NO_PROJECT_ASSIGNED') {
          setError("Twoje konto nie ma przypisanego projektu. Skontaktuj się z organizatorem wydarzenia.")
        } else {
          setError(errorResponse.data?.message || "Brak dostępu do konta. Skontaktuj się z organizatorem wydarzenia.")
        }
      } else {
        setError(loginMutation.error.response?.data?.message || "Nieprawidłowy email lub hasło")
      }
    }
  }, [loginMutation.error])

  useEffect(() => {
    if (googleLoginMutation.error) {
      const errorResponse = googleLoginMutation.error.response
      if (errorResponse?.status === 403) {
        const errorCode = errorResponse.data?.code
        if (errorCode === 'ACCOUNT_PENDING_APPROVAL') {
          setError("Twoje konto zostało utworzone, ale oczekuje na zatwierdzenie przez administratora. Skontaktuj się z organizatorem wydarzenia.")
        } else if (errorCode === 'NO_PROJECT_ASSIGNED') {
          setError("Twoje konto nie ma przypisanego projektu. Skontaktuj się z organizatorem wydarzenia.")
        } else {
          setError(errorResponse.data?.message || "Brak dostępu do konta. Skontaktuj się z organizatorem wydarzenia.")
        }
      } else {
        setError(googleLoginMutation.error.response?.data?.message || "Nie udało się zalogować")
      }
    }
  }, [googleLoginMutation.error])

  const isLoading = loginMutation.isPending || googleLoginMutation.isPending

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">EventSync</CardTitle>
          <CardDescription className="text-base">Witaj ponownie. Zaloguj się do swojego konta.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* TEMPORARILY COMMENTED OUT FOR DOCUMENTATION SCREENSHOTS */}
          {/* <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="imie.nazwisko@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="flex justify-end">
              <Link
                to="/password-reset"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Nie pamiętasz hasła?
              </Link>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logowanie...
                </>
              ) : (
                "Zaloguj się"
              )}
            </Button>
          </form> */}

          {/* TEMPORARILY COMMENTED OUT FOR DOCUMENTATION SCREENSHOTS */}
          {/* <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Lub</span>
            </div>
          </div> */}

          <div className="flex justify-center py-4">
            <Button 
              type="button" 
              variant="outline" 
              className="w-full bg-transparent" 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              {googleLoginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Zaloguj przez Google
                </>
              )}
            </Button>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center text-sm">
          <span className="text-muted-foreground">Nie masz jeszcze konta? </span>
          <Link to="/register" className="ml-1 text-primary font-medium hover:underline">
            Zarejestruj się
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}
