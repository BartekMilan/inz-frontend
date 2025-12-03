"use client"

import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Chrome, Loader2, AlertCircle } from "lucide-react"
import { useRegister, useGoogleLogin } from "@/hooks/use-auth"
import { useAuth } from "@/contexts/AuthContext"

export default function RegisterPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    acceptTerms: false,
  })

  const registerMutation = useRegister()
  const googleLoginMutation = useGoogleLogin()

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/participants', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Hasła nie są takie same")
      return
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError("Hasło musi mieć minimum 6 znaków")
      return
    }

    // Validate terms accepted
    if (!formData.acceptTerms) {
      setError("Musisz zaakceptować regulamin")
      return
    }

    registerMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      password: formData.password,
    })
  }

  const handleGoogleSignUp = () => {
    setError("")
    googleLoginMutation.mutate()
  }

  const isLoading = registerMutation.isPending || googleLoginMutation.isPending

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold text-center">Dołącz do EventSync</CardTitle>
          <CardDescription className="text-center">Utwórz konto, aby zacząć zarządzać wydarzeniami.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* First Name and Last Name Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Imię</Label>
                <Input
                  id="firstName"
                  type="text"
                  placeholder="Jan"
                  required
                  disabled={isLoading}
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nazwisko</Label>
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Kowalski"
                  required
                  disabled={isLoading}
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="jan.kowalski@example.com"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Hasło</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 znaków</p>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                required
                disabled={isLoading}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="terms"
                checked={formData.acceptTerms}
                disabled={isLoading}
                onCheckedChange={(checked) => setFormData({ ...formData, acceptTerms: checked })}
              />
              <label
                htmlFor="terms"
                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Akceptuję Regulamin serwisu
              </label>
            </div>

            {/* Sign Up Button */}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {registerMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Rejestracja...
                </>
              ) : (
                "Zarejestruj się"
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">LUB</span>
              </div>
            </div>

            {/* Google Sign Up Button */}
            <Button 
              type="button" 
              variant="outline" 
              className="w-full bg-transparent" 
              onClick={handleGoogleSignUp}
              disabled={isLoading}
            >
              {googleLoginMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Przekierowywanie...
                </>
              ) : (
                <>
                  <Chrome className="mr-2 h-4 w-4" />
                  Zarejestruj przez Google
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Zaloguj się
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
