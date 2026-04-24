import { useEffect, useState } from "react"
import {
  BadgeCheck,
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  ShieldCheck,
} from "lucide-react"
import { claimApi, processingApi, userPolicyApi } from "./api"

const pages = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "create-policy", label: "Create Policy", icon: ShieldCheck },
  { id: "submit-claim", label: "Submit Claim", icon: FilePlus2 },
  { id: "view-claims", label: "View Claims", icon: ClipboardList },
]

const statusStyles = {
  pending: "bg-amber-100 text-amber-700 ring-amber-200",
  approved: "bg-emerald-100 text-emerald-700 ring-emerald-200",
  rejected: "bg-red-100 text-red-700 ring-red-200",
}

function App() {
  const [activePage, setActivePage] = useState("dashboard")
  const [policies, setPolicies] = useState([])
  const [claims, setClaims] = useState([])
  const [message, setMessage] = useState("")

  const loadData = async () => {
    try {
      const [policyResponse, claimResponse] = await Promise.all([
        userPolicyApi.get("/policies"),
        claimApi.get("/claims"),
      ])
      setPolicies(policyResponse.data)
      setClaims(claimResponse.data)
    } catch (error) {
      setMessage("Unable to load data. Please check that backend services are running.")
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const showMessage = (text) => {
    setMessage(text)
    window.setTimeout(() => setMessage(""), 3500)
  }

  const summary = {
    total: claims.length,
    pending: claims.filter((claim) => claim.status === "pending").length,
    approved: claims.filter((claim) => claim.status === "approved").length,
    rejected: claims.filter((claim) => claim.status === "rejected").length,
  }

  return (
    <div className="min-h-screen bg-sand text-ink">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(197,107,79,0.20),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(47,111,143,0.18),_transparent_32%)]" />
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="border-b border-white/70 bg-white/75 p-5 shadow-soft backdrop-blur lg:w-72 lg:border-b-0 lg:border-r">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-ink text-white shadow-lg">
              <BadgeCheck size={26} />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-tight">Smart Insurance</p>
              <p className="text-sm text-slate-500">Claim Management</p>
            </div>
          </div>

          <nav className="mt-7 grid grid-cols-2 gap-2 lg:grid-cols-1">
            {pages.map((page) => {
              const Icon = page.icon
              const isActive = activePage === page.id

              return (
                <button
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                    isActive
                      ? "bg-ink text-white shadow-lg"
                      : "text-slate-600 hover:bg-white hover:text-ink"
                  }`}
                  key={page.id}
                  onClick={() => setActivePage(page.id)}
                >
                  <Icon size={19} />
                  {page.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <main className="flex-1 p-5 sm:p-8">
          <header className="mb-8 rounded-[2rem] bg-white/80 p-6 shadow-soft backdrop-blur">
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-clay">
              Insurance Operations
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Smart Insurance Claim Management System
            </h1>
            <p className="mt-3 max-w-3xl text-slate-600">
              Create customers and policies, submit claims, and process approvals from one clean dashboard.
            </p>
          </header>

          {message && (
            <div className="mb-5 rounded-2xl border border-ocean/20 bg-ocean/10 px-4 py-3 text-sm font-semibold text-ocean">
              {message}
            </div>
          )}

          {activePage === "dashboard" && <Dashboard summary={summary} />}
          {activePage === "create-policy" && (
            <CreatePolicy onCreated={loadData} showMessage={showMessage} />
          )}
          {activePage === "submit-claim" && (
            <SubmitClaim policies={policies} onCreated={loadData} showMessage={showMessage} />
          )}
          {activePage === "view-claims" && (
            <ViewClaims claims={claims} onUpdated={loadData} showMessage={showMessage} />
          )}
        </main>
      </div>
    </div>
  )
}

function Dashboard({ summary }) {
  const cards = [
    { label: "Total Claims", value: summary.total, color: "bg-ink", helper: "All submitted claims" },
    { label: "Pending Claims", value: summary.pending, color: "bg-amber-500", helper: "Awaiting review" },
    { label: "Approved Claims", value: summary.approved, color: "bg-emerald-600", helper: "Ready for payout" },
    { label: "Rejected Claims", value: summary.rejected, color: "bg-red-500", helper: "Closed as rejected" },
  ]

  return (
    <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div className="rounded-[1.75rem] bg-white p-6 shadow-soft" key={card.label}>
          <div className={`mb-5 h-2 w-16 rounded-full ${card.color}`} />
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">{card.label}</p>
          <p className="mt-3 font-display text-5xl font-bold">{card.value}</p>
          <p className="mt-3 text-sm text-slate-500">{card.helper}</p>
        </div>
      ))}
    </section>
  )
}

function CreatePolicy({ onCreated, showMessage }) {
  const [form, setForm] = useState({ name: "", email: "", policy_type: "" })
  const [loading, setLoading] = useState(false)

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)

    try {
      const userResponse = await userPolicyApi.post("/users", {
        name: form.name,
        email: form.email,
      })

      await userPolicyApi.post("/policies", {
        user_id: userResponse.data.id,
        policy_type: form.policy_type,
        status: "active",
      })

      setForm({ name: "", email: "", policy_type: "" })
      await onCreated()
      showMessage("Policy created successfully.")
    } catch (error) {
      showMessage("Could not create policy. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormCard title="Create Policy" subtitle="Add a customer and attach a new policy.">
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <Input label="Name" value={form.name} onChange={(value) => updateField("name", value)} />
        <Input label="Email" type="email" value={form.email} onChange={(value) => updateField("email", value)} />
        <Input
          label="Policy Type"
          placeholder="Health, Vehicle, Home..."
          value={form.policy_type}
          onChange={(value) => updateField("policy_type", value)}
        />
        <SubmitButton loading={loading}>Create Policy</SubmitButton>
      </form>
    </FormCard>
  )
}

function SubmitClaim({ policies, onCreated, showMessage }) {
  const [policyId, setPolicyId] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const selectedPolicy = policies.find((policy) => String(policy.id) === String(policyId))

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!selectedPolicy) {
      showMessage("Please select a policy before submitting a claim.")
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
      showMessage("Claim submitted successfully.")
    } catch (error) {
      showMessage("Could not submit claim. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <FormCard title="Submit Claim" subtitle="Choose an active policy and describe the claim.">
      <form className="grid gap-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Policy
          <select
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none ring-ocean/20 transition focus:ring-4"
            required
            value={policyId}
            onChange={(event) => setPolicyId(event.target.value)}
          >
            <option value="">Select a policy</option>
            {policies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                Policy #{policy.id} - User #{policy.user_id} - {policy.policy_type}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm font-bold text-slate-700">
          Description
          <textarea
            className="min-h-36 rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none ring-ocean/20 transition focus:ring-4"
            placeholder="Describe the incident or reason for the claim."
            required
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </label>

        <SubmitButton loading={loading}>Submit Claim</SubmitButton>
      </form>
    </FormCard>
  )
}

function ViewClaims({ claims, onUpdated, showMessage }) {
  const updateClaim = async (claimId, action) => {
    try {
      await processingApi.put(`/claims/${claimId}/${action}`)
      await onUpdated()
      showMessage(`Claim ${action === "approve" ? "approved" : "rejected"} successfully.`)
    } catch (error) {
      showMessage("Could not update claim. Please try again.")
    }
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] bg-white shadow-soft">
      <div className="border-b border-slate-100 p-6">
        <h2 className="font-display text-2xl font-bold">View Claims</h2>
        <p className="mt-1 text-sm text-slate-500">Review submitted claims and update their status.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left">
          <thead className="bg-slate-50 text-sm uppercase tracking-[0.16em] text-slate-400">
            <tr>
              <th className="px-6 py-4">Claim ID</th>
              <th className="px-6 py-4">Policy ID</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="px-6 py-4 font-bold">#{claim.id}</td>
                <td className="px-6 py-4">#{claim.policy_id}</td>
                <td className="px-6 py-4">
                  <StatusBadge status={claim.status} />
                </td>
                <td className="flex gap-2 px-6 py-4">
                  <button
                    className="rounded-xl bg-emerald-600 px-3 py-2 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={claim.status === "approved"}
                    onClick={() => updateClaim(claim.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="rounded-xl bg-red-500 px-3 py-2 text-sm font-bold text-white transition hover:bg-red-600 disabled:cursor-not-allowed disabled:bg-slate-300"
                    disabled={claim.status === "rejected"}
                    onClick={() => updateClaim(claim.id, "reject")}
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
            {claims.length === 0 && (
              <tr>
                <td className="px-6 py-10 text-center text-slate-500" colSpan="4">
                  No claims have been submitted yet.
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
    <section className="mx-auto max-w-2xl rounded-[1.75rem] bg-white p-6 shadow-soft sm:p-8">
      <h2 className="font-display text-2xl font-bold">{title}</h2>
      <p className="mb-7 mt-2 text-slate-500">{subtitle}</p>
      {children}
    </section>
  )
}

function Input({ label, onChange, type = "text", value, placeholder = "" }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-slate-700">
      {label}
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-medium outline-none ring-ocean/20 transition focus:ring-4"
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
      className="rounded-2xl bg-clay px-5 py-3 font-bold text-white shadow-lg shadow-clay/20 transition hover:bg-[#b75e44] disabled:cursor-not-allowed disabled:bg-slate-300"
      disabled={loading}
      type="submit"
    >
      {loading ? "Please wait..." : children}
    </button>
  )
}

function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.16em] ring-1 ${
        statusStyles[status] || "bg-slate-100 text-slate-700 ring-slate-200"
      }`}
    >
      {status}
    </span>
  )
}

export default App
