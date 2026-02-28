import { useState } from "react"
import { supabase } from "../lib/supabase"
import { useNavigate } from "react-router-dom"
import { Card } from "../components/ui/card"
import { Button } from "../components/ui/button"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      alert("Login gagal")
      return
    }

    navigate("/admin-dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="p-6 w-96">
        <h2 className="text-xl font-bold mb-4">Admin Login</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="border w-full p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="border w-full p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" className="w-full bg-amber-900 text-white">
            Login
          </Button>
        </form>
      </Card>
    </div>
  )
}
