"use client"

import { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignIn = (e) => {
    e.preventDefault()
    // Handle email/password sign in logic here
    console.log("[v0] Sign in with:", { email, password })
  }

  const handleGoogleSignIn = () => {
    // Handle Google sign in logic here
    console.log("[v0] Sign in with Google")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl font-bold">EventSync</CardTitle>
          <CardDescription className="text-base">Witaj ponownie. Zaloguj się do swojego konta.</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Adres e-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="imie.nazwisko@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

            <Button type="submit" className="w-full">
              Zaloguj się
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Lub</span>
            </div>
          </div>

          <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGoogleSignIn}>
            <Mail className="mr-2 h-4 w-4" />
            Zaloguj przez Google
          </Button>
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
