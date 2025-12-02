"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail } from "lucide-react"

export default function PasswordResetPage() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false)
      setIsSubmitted(true)
    }, 1500)
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader className="space-y-2 text-center">
            <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-semibold text-slate-900">Sprawdź swoją skrzynkę e-mail</CardTitle>
            <CardDescription className="text-base text-slate-600">
              Wysłaliśmy link do resetowania hasła na adres <strong className="text-slate-900">{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 text-center">
              Jeśli nie otrzymasz wiadomości w ciągu kilku minut, sprawdź folder spam.
            </p>
          </CardContent>
          <CardFooter>
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors py-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Wróć do logowania
            </Link>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <Card className="w-full max-w-md shadow-sm">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl font-semibold text-slate-900">Zresetuj hasło</CardTitle>
          <CardDescription className="text-base text-slate-600 text-pretty">
            Wprowadź adres e-mail powiązany z Twoim kontem, a wyślemy Ci link do zmiany hasła.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                Adres e-mail
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="imie.nazwisko@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
                disabled={isSubmitting}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Wysyłanie..." : "Wyślij link resetujący"}
            </Button>
            <Link
              to="/login"
              className="w-full flex items-center justify-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Wróć do logowania
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
