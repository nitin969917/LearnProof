import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../../context/AuthContext';
import { useModal } from '../../../context/ModalContext';
import toast from 'react-hot-toast';
import {
  Users2, MessageSquare, Lock, Unlock, Search, Trash2,
  RefreshCw, ShieldAlert, AlertTriangle, Eye, X, UserMinus,
  Check, Filter, ChevronRight, CornerDownRight, ShieldCheck,
  Crown, Info, Calendar, ArrowUpDown
} from 'lucide-react';
import UserAvatar from '../../Common/UserAvatar.jsx';

const AdminGroupsManagement = () => {
  const { token } = useAuth();
  const { confirm } = useModal();

  const [groups, setGroups] = useState([]);
  const [metrics, setMetrics] = useState({
    totalGroups: 0,
    totalMessages: 0,
    totalMemberships: 0,
    lockedGroups: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [privacyFilter, setPrivacyFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 20 });

  // Modals
  const [selectedAuditGroup, setSelectedAuditGroup] = useState(null);
  const [auditMessages, setAuditMessages] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const [selectedMemberGroup, setSelectedMemberGroup] = useState(null);

  const fetchGroups = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/groups`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          search,
          privacy: privacyFilter,
          status: statusFilter,
          page,
          limit: 20,
        },
      });

      if (res.data) {
        setGroups(res.data.groups || []);
        setMetrics(res.data.metrics || {});
        setPagination(res.data.pagination || { total: 0, pages: 1, limit: 20 });
      }
    } catch (err) {
      console.error('Failed to fetch admin groups:', err);
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token, search, privacyFilter, statusFilter, page]);

  useEffect(() => {
    if (token) fetchGroups();
  }, [fetchGroups, token]);

  const handleToggleLock = async (group) => {
    const newLockState = !group.isLocked;
    const confirmed = await confirm({
      title: newLockState ? 'Freeze / Lock Group?' : 'Unlock Group?',
      message: newLockState
        ? `Are you sure you want to lock "${group.name}"? Regular members and admins will not be able to send messages or join until unlocked.`
        : `Unlock "${group.name}" and restore normal messaging for all members?`,
      confirmText: newLockState ? 'Lock Group' : 'Unlock Group',
      type: newLockState ? 'danger' : 'info',
    });

    if (!confirmed) return;

    try {
      const res = await axios.put(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/groups/${group.id}/lock`,
        { isLocked: newLockState },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data?.success) {
        toast.success(res.data.message || 'Group status updated');
        setGroups((prev) =>
          prev.map((g) => (g.id === group.id ? { ...g, isLocked: newLockState } : g))
        );
        if (selectedAuditGroup?.id === group.id) {
          setSelectedAuditGroup((prev) => ({ ...prev, isLocked: newLockState }));
        }
      }
    } catch (err) {
      console.error('Failed to update lock status:', err);
      toast.error(err.response?.data?.error || 'Failed to update group lock state');
    }
  };

  const handleDeleteGroup = async (group) => {
    const confirmed = await confirm({
      title: 'Permanently Delete Group?',
      message: `CAUTION: Are you sure you want to permanently delete "${group.name}"? This will delete all chat messages and memberships for all ${group.memberCount} members. This action is irreversible.`,
      confirmText: 'Delete Permanently',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      const res = await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/groups/${group.id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: 'Deleted by Main Admin via Admin Portal' },
        }
      );

      if (res.data?.success) {
        toast.success(`Group "${group.name}" deleted`);
        setGroups((prev) => prev.filter((g) => g.id !== group.id));
        setMetrics((prev) => ({
          ...prev,
          totalGroups: Math.max(0, prev.totalGroups - 1),
        }));
        if (selectedAuditGroup?.id === group.id) setSelectedAuditGroup(null);
        if (selectedMemberGroup?.id === group.id) setSelectedMemberGroup(null);
      }
    } catch (err) {
      console.error('Failed to delete group:', err);
      toast.error(err.response?.data?.error || 'Failed to delete group');
    }
  };

  const handleOpenAudit = async (group) => {
    setSelectedAuditGroup(group);
    setLoadingAudit(true);
    try {
      const res = await axios.get(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/groups/${group.id}/messages`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAuditMessages(res.data || []);
    } catch (err) {
      console.error('Failed to fetch audit messages:', err);
      toast.error('Failed to load group messages');
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleDeleteMessageAudit = async (messageId) => {
    const confirmed = await confirm({
      title: 'Delete Message?',
      message: 'Are you sure you want to delete this message? It will be removed from all members.',
      confirmText: 'Delete',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/social/groups/${selectedAuditGroup.id}/messages/${messageId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAuditMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, isDeleted: true, content: 'This message was deleted' } : m
        )
      );
      toast.success('Message deleted');
    } catch (err) {
      console.error('Failed to delete message:', err);
      toast.error('Failed to delete message');
    }
  };

  const handleRemoveMemberAdmin = async (groupId, member) => {
    const confirmed = await confirm({
      title: 'Remove Member?',
      message: `Are you sure you want to remove ${member.user?.name || 'this user'} from the group?`,
      confirmText: 'Remove Member',
      type: 'danger',
    });

    if (!confirmed) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_BACKEND_URL}/api/admin/groups/${groupId}/members/${member.userId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Member removed');
      setSelectedMemberGroup((prev) =>
        prev
          ? {
              ...prev,
              members: prev.members.filter((m) => m.userId !== member.userId),
              memberCount: Math.max(0, prev.memberCount - 1),
            }
          : prev
      );
      setGroups((prev) =>
        prev.map((g) =>
          g.id === groupId
            ? {
                ...g,
                memberCount: Math.max(0, g.memberCount - 1),
                members: g.members.filter((m) => m.userId !== member.userId),
              }
            : g
        )
      );
    } catch (err) {
      console.error('Failed to remove member:', err);
      toast.error(err.response?.data?.error || 'Failed to remove member');
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users2 className="text-orange-500" size={28} />
            Groups & Communities
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Global oversight, moderation, and management for all study and social discussion groups.
          </p>
        </div>

        <button
          onClick={() => fetchGroups(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-700 dark:text-slate-200 transition shadow-xs cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={16} className={refreshing ? 'animate-spin text-orange-500' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Groups</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalGroups?.toLocaleString() || 0}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 flex items-center justify-center">
            <Users2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Messages Sent</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalMessages?.toLocaleString() || 0}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <MessageSquare size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Memberships</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {metrics.totalMemberships?.toLocaleString() || 0}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Users2 size={24} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Locked / Frozen</p>
            <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {metrics.lockedGroups?.toLocaleString() || 0}
            </h3>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <Lock size={24} />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Search by group or creator..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <Filter size={14} className="text-slate-400" />
            <select
              value={privacyFilter}
              onChange={(e) => {
                setPrivacyFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-transparent text-xs font-semibold text-slate-700 dark:text-slate-200 border-none outline-none cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active Only</option>
              <option value="locked">Locked Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Groups Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-orange-500 border-t-transparent"></div>
            <span className="text-xs font-semibold">Loading platform groups...</span>
          </div>
        ) : groups.length === 0 ? (
          <div className="py-20 text-center text-slate-400 space-y-2">
            <Users2 size={36} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-sm font-semibold">No groups found</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Group Name</th>
                  <th className="py-3.5 px-4">Creator</th>
                  <th className="py-3.5 px-4">Privacy</th>
                  <th className="py-3.5 px-4">Members</th>
                  <th className="py-3.5 px-4">Messages</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Created</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {groups.map((group) => (
                  <tr key={group.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-white max-w-[200px] truncate">
                        {group.name}
                      </div>
                      {group.description ? (
                        <p className="text-[11px] text-slate-400 max-w-[240px] truncate mt-0.5">
                          {group.description}
                        </p>
                      ) : (
                        <span className="text-[11px] text-slate-300 italic">No description</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {group.creator ? (
                        <div className="flex items-center gap-2">
                          <UserAvatar
                            src={group.creator.profilePicture}
                            name={group.creator.name}
                            className="w-7 h-7 rounded-full"
                          />
                          <div className="min-w-0">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                              {group.creator.name}
                            </span>
                            <span className="text-[10px] text-slate-400 block truncate">
                              {group.creator.email}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400">Unknown</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {group.isPrivate ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded-full">
                          <Lock size={10} /> Private
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          <Unlock size={10} /> Public
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setSelectedMemberGroup(group)}
                        className="font-bold text-slate-700 dark:text-slate-300 hover:text-orange-500 underline decoration-dotted cursor-pointer"
                      >
                        {group.memberCount} members
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-600 dark:text-slate-400">
                        {group.messageCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      {group.isLocked ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-full border border-amber-200/50">
                          <Lock size={10} /> Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                          <Check size={10} /> Active
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(group.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenAudit(group)}
                          title="Audit Messages"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                        >
                          <Eye size={15} />
                        </button>

                        <button
                          onClick={() => handleToggleLock(group)}
                          title={group.isLocked ? 'Unlock Group' : 'Lock / Freeze Group'}
                          className={`p-1.5 rounded-lg transition cursor-pointer ${
                            group.isLocked
                              ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                              : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20'
                          }`}
                        >
                          {group.isLocked ? <Unlock size={15} /> : <Lock size={15} />}
                        </button>

                        <button
                          onClick={() => handleDeleteGroup(group)}
                          title="Delete Group (Permanent)"
                          className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition cursor-pointer"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page {pagination.page} of {pagination.pages} ({pagination.total} groups)
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Audit Messages Modal */}
      {selectedAuditGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <MessageSquare size={18} className="text-orange-500" />
                  Chat Audit: {selectedAuditGroup.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Recent conversation transcript for safety and compliance review.
                </p>
              </div>
              <button
                onClick={() => setSelectedAuditGroup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {loadingAudit ? (
                <div className="py-16 text-center text-slate-400 text-xs font-semibold flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
                  <span>Loading chat history...</span>
                </div>
              ) : auditMessages.length === 0 ? (
                <div className="py-16 text-center text-slate-400 text-xs">
                  No messages have been sent in this group yet.
                </div>
              ) : (
                auditMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-2xl border transition ${
                      msg.isDeleted
                        ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 opacity-60'
                        : 'bg-white dark:bg-slate-800/60 border-slate-100 dark:border-slate-700/60 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <UserAvatar
                          src={msg.sender?.profilePicture}
                          name={msg.sender?.name}
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {msg.sender?.name || 'Unknown'}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {!msg.isDeleted && (
                        <button
                          onClick={() => handleDeleteMessageAudit(msg.id)}
                          title="Delete abusive message"
                          className="text-[10px] font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 px-2 py-1 rounded-md transition cursor-pointer flex items-center gap-1"
                        >
                          <Trash2 size={12} /> Remove
                        </button>
                      )}
                    </div>
                    <p className={`text-xs pl-8 leading-relaxed ${msg.isDeleted ? 'italic text-slate-400' : 'text-slate-700 dark:text-slate-200'}`}>
                      {msg.content}
                    </p>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 flex items-center justify-between rounded-b-3xl">
              <span className="text-[11px] text-slate-400">
                Total Audit Messages: {auditMessages.length}
              </span>
              <button
                onClick={() => setSelectedAuditGroup(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Close Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Member Roster Modal */}
      {selectedMemberGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <Users2 size={18} className="text-orange-500" />
                  Members: {selectedMemberGroup.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedMemberGroup.members?.length || 0} active members in this group.
                </p>
              </div>
              <button
                onClick={() => setSelectedMemberGroup(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-2">
              {selectedMemberGroup.members?.map((m) => {
                const isCreator = m.userId === selectedMemberGroup.creator?.id;
                const isCoAdmin = m.role === 'admin';
                return (
                  <div
                    key={m.id || m.userId}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-700/50"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <UserAvatar
                        src={m.user?.profilePicture}
                        name={m.user?.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-900 dark:text-white block truncate">
                          {m.user?.name || 'User'}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {m.user?.email}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCreator ? (
                        <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 dark:bg-amber-950/30 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <Crown size={10} /> Owner
                        </span>
                      ) : isCoAdmin ? (
                        <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <ShieldCheck size={10} /> Admin
                        </span>
                      ) : (
                        <span className="text-[9px] text-slate-400 font-medium">Member</span>
                      )}

                      {!isCreator && (
                        <button
                          onClick={() => handleRemoveMemberAdmin(selectedMemberGroup.id, m)}
                          className="text-[10px] font-bold text-red-500 hover:text-white hover:bg-red-500 bg-red-50 dark:bg-red-950/20 px-2 py-1 rounded-lg transition cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedMemberGroup(null)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white text-xs font-semibold rounded-xl hover:opacity-90 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminGroupsManagement;
