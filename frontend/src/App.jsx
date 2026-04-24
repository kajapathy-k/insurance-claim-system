import { useEffect, useState } from "react"
import {
  BadgeCheck,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
  LogOut,
  Activity,
  ArrowRight
} from "lucide-react"
import { claimApi, processingApi, userPolicyApi } from "./api"

const pages = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "create-policy", label: "Create Policy", icon: ShieldCheck },
  { id: "submit-claim", label: "Submit Claim", icon: FilePlus2 },
  { id: "view-claims", label: "View Claims", icon: ClipboardList },
]

const statusStyles = {
  pending: "bg-warning/10 text-warning ring-warning/30",
  approved: "bg-success/10 text-success ring-success/30",
  rejected: "bg-danger/10 text-danger ring-danger/30",
}

function App() {
  const [activePage, setActivePage] = useState("dashboard")
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [message, setMessage] = useState("")
  const [isInitializing, setIsInitializing] = useState(true)

  const checkAuth = async () => {
    const token = localStorage.getItem("nexus_token")
    if (!token) {
      setIsInitializing(false)
      return
    }
    try {
      const meResponse = await userPolicyApi.get("/auth/me")
      setCurrentUser(meResponse.data)
      await loadData()
    } catch (error) {
      localStorage.removeItem("nexus_token")
    } finally {
      setIsInitializing(false)
    }
  }

  const loadData = async () => {
    try {
      const [policyResponse, claimResponse] = await Promise.all([
        userPolicyApi.get("/policies").catch(() => ({ data: [] })),
        claimApi.get("/claims").catch(() => ({ data: [] })),
      ])
      setPolicies(policyResponse.data)
      setClaims(claimResponse.data)
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const showMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(""), 3500)
  }

  const handleLogout = () => {
    localStorage.removeItem("nexus_token")
    setCurrentUser(null)
    setActivePage("dashboard")
  }

  if (isInitializing) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-primary">Loading...</div>
  }

  if (!currentUser) {
    return <LoginScreen 
      onLogin={(user) => {
        setCurrentUser(user)
        loadData()
      }} 
    />
  }

  const availablePages = pages.filter(p => {
    if (p.id === "create-policy" && currentUser.role !== "admin") return false
    return true
  })

  const summary = {
    total: claims.length,
    pending: claims.filter((claim) => claim.status === "pending").length,
    approved: claims.filter((claim) => claim.status === "approved").length,
    rejected: claims.filter((claim) => claim.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-background text-slate-200 font-body relative overflow-hidden">
      {/* Background glowing orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-5%] w-[30%] h-[40%] rounded-full bg-success/10 blur-[100px] pointer-events-none" />

      <div className="flex min-h-screen flex-col lg:flex-row relative z-10">
        <aside className="border-b border-border/50 bg-surface/40 p-6 backdrop-blur-xl lg:w-72 lg:border-b-0 lg:border-r flex flex-col">
          <div className="flex items-center gap-4 mb-8">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-glow">
              <Activity size={24} />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight tracking-wide text-white">NEXUS</p>
              <p className="text-xs text-muted uppercase tracking-wider font-semibold">Insurance Core</p>
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-2 lg:grid-cols-1 flex-1">
            {availablePages.map((page) => {
              const Icon = page.icon
              const isActive = activePage === page.id

              return (
                <button
                  className={`flex items-center gap-3 rounded-xl px-4 py-3.5 text-left text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-glow ring-1 ring-primary/30"
                      : "text-muted hover:bg-surface-light hover:text-white"
                  }`}
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                >
                  <Icon size={18} className={isActive ? "text-primary" : "text-slate-400"} />
                  {page.label}
                </button>
              )
            })}
          </nav>

          <div className="hidden lg:flex flex-col mt-auto pt-6 border-t border-border/50">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-light border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                {currentUser.name.charAt(0)}
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                <p className="text-xs text-muted capitalize truncate">{currentUser.role} Account</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-muted hover:text-danger transition-colors rounded-lg hover:bg-danger/10">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 p-5 sm:p-8 lg:px-12 lg:py-10 h-screen overflow-y-auto">
          <header className="mb-10 flex flex-col items-start justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
                Operations Dashboard
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {pages.find(p => p.id === activePage)?.label}
              </h1>
            </div>
            
            {/* Mobile user info */}
            <div className="flex lg:hidden items-center gap-3 px-4 py-2 rounded-xl bg-surface-light border border-border/50 w-full md:w-auto">
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{currentUser.name}</p>
                <p className="text-xs text-muted capitalize">{currentUser.role}</p>
              </div>
              <button onClick={handleLogout} className="p-2 text-muted hover:text-danger">
                <LogOut size={18} />
              </button>
            </div>
          </header>

          {message && (
            <div className="mb-8 rounded-xl border border-primary/20 bg-primary/10 px-5 py-4 text-sm font-semibold text-primary shadow-glow flex items-center gap-3 animate-in fade-in slide-in-from-top-4">
              <BadgeCheck size={18} />
              {message}
            </div>
          )}

          <div className="animate-in fade-in duration-500">
            {activePage === "dashboard" && <Dashboard summary={summary} />}
            {activePage === "create-policy" && (
              <CreatePolicy onCreated={loadData} showMessage={showMessage} />
            )}
            {activePage === "submit-claim" && (
              <SubmitClaim policies={policies} onCreated={loadData} showMessage={showMessage} currentUser={currentUser} />
            )}
            {activePage === "view-claims" && (
              <ViewClaims claims={claims} onUpdated={loadData} showMessage={showMessage} currentUser={currentUser} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await userPolicyApi.post("/auth/login", { email, password })
      localStorage.setItem("nexus_token", res.data.access_token)
      
      const meRes = await userPolicyApi.get("/auth/me")
      onLogin(meRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || "Authentication failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] rounded-full bg-primary/10 blur-[150px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-surface/60 backdrop-blur-2xl border border-border/50 rounded-3xl p-8 shadow-soft relative z-10">
        <div className="flex justify-center mb-8">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-glow">
            <Activity size={32} />
          </div>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="font-display text-3xl font-bold text-white tracking-tight">Welcome to Nexus</h1>
          <p className="text-muted mt-2 text-sm">Sign in to access the secure claim portal</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="grid gap-6">
          <Input label="Email Address" type="email" value={email} onChange={setEmail} placeholder="admin@nexus.com" />
          <Input label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" />
          
          <button
            type="submit"
            disabled={!email || !password || loading}
            className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-glow transition hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? "Authenticating..." : (
              <>Authenticate <ArrowRight size={16} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

function Dashboard({ summary }) {
  const cards = [
    { label: "Total Claims", value: summary.total, color: "text-primary", glow: "shadow-glow", border: "border-primary/20", bg: "bg-primary/5" },
    { label: "Pending Review", value: summary.pending, color: "text-warning", glow: "shadow-glow-warning", border: "border-warning/20", bg: "bg-warning/5" },
    { label: "Approved", value: summary.approved, color: "text-success", glow: "shadow-glow-success", border: "border-success/20", bg: "bg-success/5" },
    { label: "Rejected", value: summary.rejected, color: "text-danger", glow: "shadow-glow-danger", border: "border-danger/20", bg: "bg-danger/5" },
  ]

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div className={`rounded-3xl border ${card.border} bg-surface/50 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-surface`} key={card.label}>
          <div className="flex justify-between items-start mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.1em] text-muted">{card.label}</p>
            <div className={`w-2 h-2 rounded-full ${card.bg} ring-2 ring-current ${card.color} ${card.glow}`} />
          </div>
          <p className={`font-display text-5xl font-bold tracking-tight ${card.color}`}>{card.value}</p>
        </div>
      ))}
    </section>
  )
}

function CreatePolicy({ onCreated, showMessage }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", policy_type: "", role: "user" })
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const userResponse = await userPolicyApi.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
      })

      await userPolicyApi.post("/policies", {
        user_id: userResponse.data.id,
        policy_type: form.policy_type,
        status: "active",
      })

      setForm({ name: "", email: "", password: "", policy_type: "", role: "user" })
      await onCreated()
      showMessage("User and policy registered successfully.")
    } catch (error) {
      showMessage(error.response?.data?.detail || "System error during policy creation.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormCard title="Register Entity" subtitle="Onboard a new user and assign their primary policy.">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-2 gap-6">
          <Input label="Full Name" value={form.name} onChange={(value) => updateField("name", value)} />
          <Input label="Email Address" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Input label="Initial Password" type="password" value={form.password} onChange={(value) => updateField("password", value)} />
          <Input
            label="Policy Type"
            placeholder="e.g. Comprehensive Auto"
            value={form.policy_type}
            onChange={(value) => updateField("policy_type", value)}
          />
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <label className="grid gap-2 text-sm font-bold text-slate-300">
            System Role
            <select
              className="w-full rounded-xl border border-border bg-surface-light px-4 py-3.5 text-white outline-none ring-primary/30 transition focus:ring-2 appearance-none"
              value={form.role}
              onChange={(event) => updateField("role", event.target.value)}
            >
              <option value="user">Standard User</option>
              <option value="admin">Administrator</option>
            </select>
          </label>
        </div>
        
        <div className="pt-4 border-t border-border/50">
          <SubmitButton loading={loading}>Deploy Policy</SubmitButton>
        </div>
      </form>
    </FormCard>
  )
}

function SubmitClaim({ policies, onCreated, showMessage, currentUser }) {
  const [policyId, setPolicyId] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  // Filter policies to only show policies belonging to the current user
  const userPolicies = policies.filter((policy) => policy.user_id === currentUser.id)
  const selectedPolicy = policies.find((policy) => String(policy.id) === String(policyId))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedPolicy) {
      showMessage("A policy must be selected to proceed.")
      return
    }

    setLoading(true)
    try {
      await claimApi.post("/claims", {
        user_id: selectedPolicy.user_id,
        policy_id: selectedPolicy.id,
        description,
      })

      setPolicyId("")
      setDescription("")
      await onCreated()
      showMessage("Claim securely logged into the system.")
    } catch (error) {
      showMessage("Transaction failed. Please retry.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormCard title="Log Incident" subtitle="File a new claim against an active policy.">
      <form className="grid gap-6" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Target Policy
          <select
            className="w-full rounded-xl border border-border bg-surface-light px-4 py-3.5 text-white outline-none ring-primary/30 transition focus:ring-2 appearance-none"
            required
            value={policyId}
            onChange={(event) => setPolicyId(event.target.value)}
          >
            <option value="">Select an active policy</option>
            {userPolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                POL-{policy.id} — {policy.policy_type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-300">
          Incident Report
          <textarea
            className="min-h-[160px] w-full rounded-xl border border-border bg-surface-light px-4 py-3.5 text-white outline-none ring-primary/30 transition focus:ring-2 resize-y"
            placeholder="Provide a detailed account of the incident..."
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <div className="pt-4 border-t border-border/50">
          <SubmitButton loading={loading}>Submit to Ledger</SubmitButton>
        </div>
      </form>
    </FormCard>
  )
}

function ViewClaims({ claims, onUpdated, showMessage, currentUser }) {
  const updateClaim = async (claimId, action) => {
    if (currentUser?.role !== "admin") {
      showMessage("Unauthorized operation. Admin clearance required.")
      return
    }

    try {
      await processingApi.put(`/claims/${claimId}/${action}`, {}, {
        headers: { "X-User-Id": currentUser.id }
      })
      await onUpdated()
      showMessage(`Claim #${claimId} status updated to ${action}.`)
    } catch (error) {
      if (error.response?.status === 403) {
        showMessage(`Access Denied: ${error.response.data.detail}`)
      } else {
        showMessage("System malfunction during processing.")
      }
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-border bg-surface/40 backdrop-blur-xl shadow-soft">
      <div className="border-b border-border/50 p-6 sm:px-8 sm:py-6 flex justify-between items-center">
        <div>
          <h2 className="font-display text-xl font-bold text-white">Ledger Records</h2>
          <p className="mt-1 text-sm text-muted">Real-time status of all submitted claims.</p>
        </div>
        <div className="hidden sm:flex px-3 py-1 bg-surface-light border border-border rounded-lg items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-success shadow-glow-success animate-pulse"></span>
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Live</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px] text-left border-collapse">
          <thead className="bg-surface-light/50 text-xs uppercase tracking-[0.2em] text-muted border-b border-border">
            <tr>
              <th className="px-8 py-4 font-bold">Identifier</th>
              <th className="px-8 py-4 font-bold">Policy Ref</th>
              <th className="px-8 py-4 font-bold">State</th>
              <th className="px-8 py-4 font-bold text-right">Operations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {claims.map((claim) => (
              <tr key={claim.id} className="transition-colors hover:bg-surface-light/30 group">
                <td className="px-8 py-5">
                  <span className="font-mono text-sm text-slate-300">CLM-{String(claim.id).padStart(4, '0')}</span>
                </td>
                <td className="px-8 py-5">
                  <span className="font-mono text-sm text-slate-400">POL-{String(claim.policy_id).padStart(4, '0')}</span>
                </td>
                <td className="px-8 py-5">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="px-8 py-5 text-right">
                  {currentUser?.role === "admin" ? (
                    currentUser?.id === claim.user_id ? (
                      <span className="text-xs font-bold uppercase tracking-wider text-warning flex items-center justify-end gap-2">
                        <ShieldCheck size={14} /> Self-Assigned
                      </span>
                    ) : claim.status === "pending" ? (
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          className="rounded-lg bg-success/10 text-success border border-success/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:bg-success hover:text-white"
                          onClick={() => updateClaim(claim.id, "approve")}
                        >
                          Approve
                        </button>
                        <button
                          className="rounded-lg bg-danger/10 text-danger border border-danger/30 px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition hover:bg-danger hover:text-white"
                          onClick={() => updateClaim(claim.id, "reject")}
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold uppercase tracking-wider text-muted">Closed</span>
                    )
                  ) : (
                    <span className="text-xs font-bold uppercase tracking-wider text-muted flex items-center justify-end gap-2">
                      Restricted
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td className="px-8 py-16 text-center text-muted" colSpan="4">
                  <div className="flex flex-col items-center justify-center gap-3">
                    <ClipboardList size={32} className="opacity-20" />
                    <p>No records found in the ledger.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function FormCard({ title, subtitle, children }) {
  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] border border-border bg-surface/40 p-6 shadow-soft backdrop-blur-xl sm:p-10">
      <div className="mb-8">
        <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
        <p className="mt-2 text-sm text-muted">{subtitle}</p>
      </div>
      {children}
    </section>
  )
}

function Input({ label, onChange, type = "text", value, placeholder = "" }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-300">
      {label}
      <input
        className="w-full rounded-xl border border-border bg-surface-light px-4 py-3.5 text-white outline-none ring-primary/30 transition focus:ring-2 placeholder:text-slate-600"
        placeholder={placeholder || label}
        required
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  )
}

function SubmitButton({ children, loading }) {
  return (
    <button
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-glow transition-all hover:bg-blue-600 disabled:opacity-50 disabled:shadow-none"
      disabled={loading}
      type="submit"
    >
      {loading ? "Processing..." : children}
    </button>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ring-1 ${
        statusStyles[status] || "bg-surface-light text-muted ring-border"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
      {status}
    </span>
  )
}

export default App
