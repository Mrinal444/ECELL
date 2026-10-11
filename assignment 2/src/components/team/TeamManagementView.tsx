"use client";

import React, { useState } from "react";
import {
  Users,
  UserPlus,
  Shield,
  Key,
  UserCheck,
  UserX,
  AlertCircle,
  RefreshCw,
  Layers,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
} from "lucide-react";
import { RoleBadge } from "@/components/ui/Badge";
import {
  createUserAction,
  toggleUserActiveAction,
  resetUserPasswordAction,
  bulkReassignUserDealsAction,
  createCampaignAction,
} from "@/actions/team";
import { SessionUser } from "@/types";

interface TeamUser {
  id: string;
  name: string;
  email: string;
  role: string;
  active: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  _count: {
    deals: number;
    activities: number;
  };
}

interface Campaign {
  id: string;
  name: string;
  year: number;
  goalINR?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  _count: {
    deals: number;
  };
}

interface TeamManagementViewProps {
  currentUser: SessionUser;
  users: TeamUser[];
  campaigns: Campaign[];
}

export function TeamManagementView({
  currentUser,
  users,
  campaigns,
}: TeamManagementViewProps) {
  // Tabs: Team Members vs Campaigns
  const [activeTab, setActiveTab] = useState<"TEAM" | "CAMPAIGNS">("TEAM");

  // Add User State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"MEMBER" | "LEAD">("MEMBER");
  const [newUserPassword, setNewUserPassword] = useState("ecell2025");
  const [addingUser, setAddingUser] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);

  // Bulk Reassign Modal State
  const [reassignModalUser, setReassignModalUser] = useState<TeamUser | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>("");
  const [reassigning, setReassigning] = useState(false);

  // Campaign Create State
  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false);
  const [campName, setCampName] = useState("");
  const [campYear, setCampYear] = useState<number>(new Date().getFullYear());
  const [campGoal, setCampGoal] = useState<number | "">("");
  const [addingCamp, setAddingCamp] = useState(false);
  const [campError, setCampError] = useState<string | null>(null);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setUserError(null);
    setUserSuccess(null);
    setAddingUser(true);

    try {
      const res = await createUserAction({
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: newUserRole,
        initialPassword: newUserPassword,
      });

      if (!res.success) {
        setUserError(res.error || "Failed to create user.");
      } else {
        setUserSuccess(`User ${newUserName} created successfully with temporary password.`);
        setIsAddUserOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        window.location.reload();
      }
    } catch (err: any) {
      setUserError(err.message || "An unexpected error occurred.");
    } finally {
      setAddingUser(false);
    }
  };

  const handleToggleActive = async (user: TeamUser) => {
    if (user.id === currentUser.id) {
      alert("You cannot deactivate your own account.");
      return;
    }

    if (!confirm(`Are you sure you want to ${user.active ? "deactivate" : "reactivate"} ${user.name}?`)) {
      return;
    }

    try {
      await toggleUserActiveAction(user.id);
      window.location.reload();
    } catch (err) {
      alert("Failed to update user status.");
    }
  };

  const handleResetPassword = async (user: TeamUser) => {
    const tempPass = prompt(`Enter new temporary password for ${user.name}:`, "ecell2025");
    if (!tempPass) return;

    try {
      const res = await resetUserPasswordAction(user.id, tempPass);
      if (res.success) {
        alert(`Password for ${user.name} has been reset. They will be forced to change it on next login.`);
        window.location.reload();
      } else {
        alert(res.error || "Failed to reset password.");
      }
    } catch (err) {
      alert("An error occurred resetting password.");
    }
  };

  const handleBulkReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalUser) return;

    const targetLabel = targetUserId ? users.find((u) => u.id === targetUserId)?.name : "Open Queue (Unassigned)";
    if (!confirm(`Confirm bulk reassign of all active deals from ${reassignModalUser.name} to ${targetLabel}?`)) {
      return;
    }

    setReassigning(true);
    try {
      const res = await bulkReassignUserDealsAction(
        reassignModalUser.id,
        targetUserId ? targetUserId : null
      );
      if (res.success) {
        alert(`Successfully reassigned ${res.count} deal(s).`);
        setReassignModalUser(null);
        window.location.reload();
      } else {
        alert(res.error || "Failed to reassign deals.");
      }
    } catch (err) {
      alert("Error reassigning deals.");
    } finally {
      setReassigning(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setCampError(null);
    setAddingCamp(true);

    try {
      const res = await createCampaignAction({
        name: campName.trim(),
        year: campYear,
        goalINR: typeof campGoal === "number" ? campGoal : undefined,
      });

      if (!res.success) {
        setCampError(res.error || "Failed to create campaign.");
      } else {
        setIsAddCampaignOpen(false);
        setCampName("");
        window.location.reload();
      }
    } catch (err: any) {
      setCampError(err.message || "An unexpected error occurred.");
    } finally {
      setAddingCamp(false);
    }
  };

  return (
    <div className="space-y-6 font-mono text-xs">
      {/* Page Header */}
      <div className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-black uppercase text-ink tracking-wide flex items-center gap-2">
              <Shield className="w-5 h-5 text-ink" />
              <span>Team &amp; Operations Administration</span>
            </h1>
            <p className="text-xs text-ink-muted mt-0.5">
              Lead governance center. Manage team access, reset passwords, bulk reassign accounts, and configure annual campaigns.
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex items-center gap-1 bg-canvas border border-border-grid p-1">
            <button
              type="button"
              onClick={() => setActiveTab("TEAM")}
              className={`px-3 py-1 font-bold transition-colors ${
                activeTab === "TEAM" ? "bg-ink text-canvas" : "text-ink hover:bg-surface-muted"
              }`}
            >
              Team Members ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("CAMPAIGNS")}
              className={`px-3 py-1 font-bold transition-colors ${
                activeTab === "CAMPAIGNS" ? "bg-ink text-canvas" : "text-ink hover:bg-surface-muted"
              }`}
            >
              Campaigns ({campaigns.length})
            </button>
          </div>
        </div>

        {userSuccess && (
          <div className="p-3 bg-green-50 border border-green-300 text-green-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{userSuccess}</span>
          </div>
        )}
      </div>

      {/* TAB 1: TEAM MEMBERS */}
      {activeTab === "TEAM" && (
        <div className="space-y-4">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase text-ink">
              Registered Team Roster ({users.length})
            </span>

            <button
              type="button"
              onClick={() => setIsAddUserOpen(!isAddUserOpen)}
              className="flex items-center gap-1.5 bg-ink text-canvas px-3.5 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isAddUserOpen ? "Cancel" : "Add Team Member"}</span>
            </button>
          </div>

          {/* Add User Drawer */}
          {isAddUserOpen && (
            <form
              onSubmit={handleCreateUser}
              className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4"
            >
              <div className="border-b border-border-grid pb-2">
                <h3 className="font-bold text-ink uppercase text-xs">
                  Register New E-Cell Team Member
                </h3>
                <p className="text-[11px] text-ink-muted">
                  New users are issued a temporary password and prompted to reset it upon their initial login.
                </p>
              </div>

              {userError && (
                <div className="p-2 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{userError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Full Name*:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Vikramaditya Sharma"
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Email Address*:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. vikram@ecell.in"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Role Hierarchy*:
                  </label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as any)}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs font-semibold"
                  >
                    <option value="MEMBER">MEMBER (Deal Owner / Outreach)</option>
                    <option value="LEAD">LEAD (Full Admin / Reassign / Merge)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Temporary Password*:
                  </label>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-grid">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-1.5 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingUser}
                  className="bg-ink text-canvas px-5 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm"
                >
                  {addingUser ? "Registering..." : "Create Account"}
                </button>
              </div>
            </form>
          )}

          {/* Users Table */}
          <div className="bg-surface border-2 border-border-grid shadow-sharp overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-ink text-canvas uppercase text-[10px]">
                  <th className="p-3 border border-ink">Member Profile</th>
                  <th className="p-3 border border-ink">Role</th>
                  <th className="p-3 border border-ink">Active Deals</th>
                  <th className="p-3 border border-ink">Activity Logs</th>
                  <th className="p-3 border border-ink">Status</th>
                  <th className="p-3 border border-ink text-right">Lead Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-grid">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-canvas transition-colors ${
                      !user.active ? "opacity-60 bg-stone-100" : ""
                    }`}
                  >
                    {/* Member Profile */}
                    <td className="p-3 border-r border-border-grid">
                      <div className="font-bold text-ink text-sm">
                        {user.name} {user.id === currentUser.id && "(You)"}
                      </div>
                      <div className="text-[11px] text-ink-muted">{user.email}</div>
                      {user.mustChangePassword && (
                        <span className="inline-block mt-1 text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 font-bold">
                          Pending First Password Change
                        </span>
                      )}
                    </td>

                    {/* Role */}
                    <td className="p-3 border-r border-border-grid">
                      <RoleBadge role={user.role} />
                    </td>

                    {/* Active Deals */}
                    <td className="p-3 border-r border-border-grid font-bold text-ink">
                      {user._count.deals} deal(s)
                    </td>

                    {/* Activity Logs */}
                    <td className="p-3 border-r border-border-grid text-ink-muted">
                      {user._count.activities} touches
                    </td>

                    {/* Status */}
                    <td className="p-3 border-r border-border-grid">
                      {user.active ? (
                        <span className="text-signal-green font-bold">Active</span>
                      ) : (
                        <span className="text-signal-red font-bold">Deactivated</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Bulk Reassign Deals */}
                        {user._count.deals > 0 && (
                          <button
                            type="button"
                            onClick={() => setReassignModalUser(user)}
                            className="bg-canvas border border-border-grid px-2 py-1 text-[10px] font-bold hover:bg-surface-muted text-ink"
                            title="Bulk reassign deals to another member or open queue"
                          >
                            Reassign Deals
                          </button>
                        )}

                        {/* Reset Password */}
                        <button
                          type="button"
                          onClick={() => handleResetPassword(user)}
                          className="bg-canvas border border-border-grid px-2 py-1 text-[10px] font-bold hover:bg-surface-muted text-ink"
                          title="Reset temporary password"
                        >
                          <Key className="w-3 h-3 inline mr-0.5" />
                          <span>Reset Pass</span>
                        </button>

                        {/* Toggle Active */}
                        {user.id !== currentUser.id && (
                          <button
                            type="button"
                            onClick={() => handleToggleActive(user)}
                            className={`px-2 py-1 text-[10px] font-bold border ${
                              user.active
                                ? "bg-red-50 border-signal-red text-signal-red hover:bg-red-100"
                                : "bg-green-50 border-signal-green text-signal-green hover:bg-green-100"
                            }`}
                          >
                            {user.active ? "Deactivate" : "Activate"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: CAMPAIGNS */}
      {activeTab === "CAMPAIGNS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase text-ink">
              Configured Annual Campaigns ({campaigns.length})
            </span>

            <button
              type="button"
              onClick={() => setIsAddCampaignOpen(!isAddCampaignOpen)}
              className="flex items-center gap-1.5 bg-ink text-canvas px-3.5 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAddCampaignOpen ? "Cancel" : "New Campaign"}</span>
            </button>
          </div>

          {/* Add Campaign Drawer */}
          {isAddCampaignOpen && (
            <form
              onSubmit={handleCreateCampaign}
              className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-4"
            >
              <div className="border-b border-border-grid pb-2">
                <h3 className="font-bold text-ink uppercase text-xs">
                  Create New Outreach Campaign
                </h3>
              </div>

              {campError && (
                <div className="p-2 bg-red-50 border border-signal-red text-signal-red flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{campError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Campaign Name*:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. E-Summit 2026"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Edition Year*:
                  </label>
                  <input
                    type="number"
                    required
                    value={campYear}
                    onChange={(e) => setCampYear(Number(e.target.value))}
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                    Fundraising Target Goal in INR (₹):
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 5000000 (50 Lakhs)"
                    value={campGoal}
                    onChange={(e) =>
                      setCampGoal(e.target.value === "" ? "" : Number(e.target.value))
                    }
                    className="w-full bg-canvas border border-border-grid p-2 font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border-grid">
                <button
                  type="button"
                  onClick={() => setIsAddCampaignOpen(false)}
                  className="px-4 py-1.5 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingCamp}
                  className="bg-ink text-canvas px-5 py-1.5 font-bold hover:bg-stone-800 shadow-sharp-sm"
                >
                  {addingCamp ? "Creating..." : "Save Campaign"}
                </button>
              </div>
            </form>
          )}

          {/* Campaigns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="bg-surface border-2 border-border-grid p-4 shadow-sharp space-y-3"
              >
                <div className="flex items-center justify-between border-b border-border-grid pb-2">
                  <div className="font-bold text-ink text-sm">{camp.name}</div>
                  <span className="text-[10px] bg-canvas border border-border-grid px-2 py-0.5 font-bold text-ink">
                    {camp.year}
                  </span>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Fundraising Goal:</span>
                    <span className="font-bold text-ink">
                      {camp.goalINR ? `₹${(camp.goalINR / 100000).toFixed(0)} Lakhs` : "Unset"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Active Pipeline Deals:</span>
                    <span className="font-bold text-ink">{camp._count.deals} companies</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-border-grid">
                  <a
                    href={`/?campaign=${camp.id}`}
                    className="block text-center bg-canvas border border-border-grid py-1.5 font-bold hover:bg-surface-muted text-ink"
                  >
                    Open Kanban Board
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BULK REASSIGN MODAL */}
      {reassignModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-xs font-mono">
          <div className="bg-surface border-2 border-border-grid w-full max-w-md p-6 shadow-sharp space-y-4">
            <div className="flex items-center justify-between border-b border-border-grid pb-2">
              <h3 className="text-sm font-bold text-ink uppercase flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-signal-amber" />
                <span>Bulk Reassign Deals (Lead Tool)</span>
              </h3>
              <button
                type="button"
                onClick={() => setReassignModalUser(null)}
                className="text-ink-muted hover:text-ink font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-ink-muted">
              Reassign all <strong>{reassignModalUser._count.deals} deal(s)</strong> currently owned by{" "}
              <strong>{reassignModalUser.name}</strong> to a new team member or release them to the Open Queue.
            </p>

            <form onSubmit={handleBulkReassign} className="space-y-4">
              <div>
                <label className="block font-bold text-ink mb-1 uppercase text-[10px]">
                  Target Recipient:
                </label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="w-full bg-canvas border border-border-grid p-2 text-xs font-mono font-bold"
                >
                  <option value="">-- Release to Open Queue (Unassigned) --</option>
                  {users
                    .filter((u) => u.id !== reassignModalUser.id && u.active)
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-grid">
                <button
                  type="button"
                  onClick={() => setReassignModalUser(null)}
                  className="px-4 py-2 border border-border-grid bg-canvas text-ink font-bold hover:bg-surface-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reassigning}
                  className="bg-ink text-canvas font-bold px-4 py-2 hover:bg-stone-800 shadow-sharp-sm"
                >
                  {reassigning ? "Reassigning..." : "Execute Reassignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
