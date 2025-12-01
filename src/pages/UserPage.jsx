import { useState } from "react"
import { Send, Trash2, RefreshCw, UserCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

const INITIAL_USERS = [
  {
    id: 1,
    email: "admin@example.com",
    role: "Administrator",
    status: "Active",
    avatarUrl: "/admin-user-interface.png",
  },
  {
    id: 2,
    email: "registrar1@example.com",
    role: "Rejestrator",
    status: "Active",
    avatarUrl: "/registrar-user-1.jpg",
  },
  {
    id: 3,
    email: "registrar2@example.com",
    role: "Rejestrator",
    status: "Active",
    avatarUrl: "/registrar-user-2.jpg",
  },
  {
    id: 4,
    email: "invited1@example.com",
    role: "Rejestrator",
    status: "Pending",
    avatarUrl: null,
  },
  {
    id: 5,
    email: "invited2@example.com",
    role: "Rejestrator",
    status: "Pending",
    avatarUrl: null,
  },
]

export default function UsersPage() {
  const [users, setUsers] = useState(INITIAL_USERS)
  const [inviteEmail, setInviteEmail] = useState("")

  const handleInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      alert("Proszę wprowadzić prawidłowy adres email")
      return
    }

    const newUser = {
      id: Date.now(),
      email: inviteEmail,
      role: "Rejestrator",
      status: "Pending",
      avatarUrl: null,
    }

    setUsers([...users, newUser])
    setInviteEmail("")
  }

  const handleRoleChange = (userId, newRole) => {
    setUsers(users.map((user) => (user.id === userId ? { ...user, role: newRole } : user)))
  }

  const handleDelete = (userId) => {
    if (confirm("Czy na pewno chcesz usunąć tego użytkownika?")) {
      setUsers(users.filter((user) => user.id !== userId))
    }
  }

  const handleResendInvite = (userEmail) => {
    alert(`Zaproszenie zostało ponownie wysłane do: ${userEmail}`)
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Zarządzanie Dostępem</h1>
        <p className="text-muted-foreground">Zaproś członków zespołu do obsługi wydarzenia.</p>
      </div>

      {/* Invite Section */}
      <Card className="mb-8 border-primary/20 shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Zaproś nowego użytkownika</CardTitle>
          <CardDescription>Wyślij zaproszenie e-mail do nowego członka zespołu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Input
              type="email"
              placeholder="adres@gmail.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleInvite()}
              className="flex-1"
            />
            <Button onClick={handleInvite} className="gap-2">
              <Send className="h-4 w-4" />
              Wyślij zaproszenie
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Członkowie zespołu</CardTitle>
          <CardDescription>Zarządzaj dostępem i rolami użytkowników</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Użytkownik</TableHead>
                <TableHead>Rola</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Akcje</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} className={user.status === "Pending" ? "opacity-70" : ""}>
                  {/* User Column */}
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className={user.status === "Pending" ? "opacity-60" : ""}>
                        {user.avatarUrl ? (
                          <AvatarImage src={user.avatarUrl || "/placeholder.svg"} alt={user.email} />
                        ) : (
                          <AvatarFallback className="bg-muted">
                            <UserCircle2 className="h-5 w-5 text-muted-foreground" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{user.email}</span>
                      </div>
                    </div>
                  </TableCell>

                  {/* Role Column */}
                  <TableCell>
                    <Select value={user.role} onValueChange={(value) => handleRoleChange(user.id, value)}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Rejestrator">Rejestrator</SelectItem>
                        <SelectItem value="Administrator">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>

                  {/* Status Column */}
                  <TableCell>
                    {user.status === "Pending" ? (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                        Oczekuje
                      </Badge>
                    ) : (
                      <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                        Aktywny
                      </Badge>
                    )}
                  </TableCell>

                  {/* Actions Column */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {user.status === "Pending" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendInvite(user.email)}
                          title="Ponów zaproszenie"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(user.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Usuń"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
