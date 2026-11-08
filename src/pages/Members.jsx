import React, { useState, useEffect } from 'react';
import api, { API_URL } from '../api/axiosClient';
import {
  Users,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  UserCheck,
  CreditCard,
  HeartCrack,
  BookOpen,
  Calendar,
  Phone,
  Mail,
  MapPin,
  Upload,
  ArrowUp,
  ArrowDown,
  ArrowUpDown
} from 'lucide-react';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import Pagination from '../components/common/Pagination';
import ExcelImportModal from '../components/members/ExcelImportModal';

export default function Members() {
  const [members, setMembers] = useState([]);
  const [villages, setVillages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('memberId');
  const [sortOrder, setSortOrder] = useState('asc'); // By default ascending order!
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // View Details Drawer / Modal
  const [viewingMember, setViewingMember] = useState(null);
  const [memberDetails, setMemberDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Add / Edit Modal
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    memberId: '',
    fullName: '',
    mobileNumber: '',
    email: '',
    villageId: '',
    dob: '',
    joiningDate: '',
    occupation: '',
    gender: 'MALE',
    maritalStatus: true,
    address: '',
    panCard: '',
    aadhaarCard: '',
    status: 'ACTIVE',
    notes: ''
  });
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVillages = async () => {
    try {
      const res = await api.get('/villages');
      setVillages(res.data.villages || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/members', {
        params: {
          search,
          villageId: villageFilter,
          status: statusFilter,
          sortBy,
          sortOrder,
          page,
          limit
        }
      });
      setMembers(res.data.members || []);
      setTotalPages(res.data.totalPages || 1);
      setTotal(res.data.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLimitChange = (newLimit) => {
    setLimit(Number(newLimit));
    setPage(1);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc'); // Default to ascending when switching field
    }
    setPage(1);
  };

  useEffect(() => {
    fetchVillages();
  }, []);

  useEffect(() => {
    fetchMembers();
  }, [search, villageFilter, statusFilter, sortBy, sortOrder, page, limit]);

  const openAddModal = () => {
    setEditingMember(null);
    setFormData({
      memberId: '',
      fullName: '',
      mobileNumber: '',
      email: '',
      villageId: villages[0]?._id || '',
      dob: '',
      joiningDate: new Date().toISOString().split('T')[0],
      occupation: '',
      gender: 'MALE',
      maritalStatus: true,
      address: '',
      panCard: '',
      aadhaarCard: '',
      status: 'ACTIVE',
      notes: ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const openEditModal = (m) => {
    setEditingMember(m);
    setFormData({
      memberId: m.memberId,
      fullName: m.fullName,
      mobileNumber: m.mobileNumber || '',
      email: m.email || '',
      villageId: m.villageId?._id || m.villageId || '',
      dob: m.dob ? new Date(m.dob).toISOString().split('T')[0] : '',
      joiningDate: m.joiningDate ? new Date(m.joiningDate).toISOString().split('T')[0] : '',
      occupation: m.occupation || '',
      gender: m.gender || 'MALE',
      maritalStatus: m.maritalStatus !== undefined ? m.maritalStatus : true,
      address: m.address || '',
      panCard: m.panCard || '',
      aadhaarCard: m.aadhaarCard || '',
      status: m.status,
      notes: m.notes || ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
    try {
      if (editingMember) {
        await api.put(`/members/${editingMember._id}`, formData);
      } else {
        await api.post('/members', formData);
      }
      setIsFormModalOpen(false);
      fetchMembers();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Error saving member.');
    } finally {
      setSubmitting(false);
    }
  };

  const openViewProfile = async (m) => {
    setViewingMember(m);
    setDetailsLoading(true);
    setActiveTab('overview');
    try {
      const res = await api.get(`/members/${m._id}`);
      setMemberDetails(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleDeleteMember = async (m) => {
    if (window.confirm(`Are you sure you want to permanently delete member ${m.memberId} (${m.fullName})?`)) {
      try {
        await api.delete(`/members/${m._id}`);
        fetchMembers();
      } catch (err) {
        alert(err.response?.data?.message || 'Cannot delete member.');
      }
    }
  };

  const handleExportExcel = () => {
    window.open(`${API_URL}/reports/all-members/export-excel?villageId=${villageFilter}&status=${statusFilter}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6 text-indigo-600" />
            Member / Family Head Management
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Maintain registered society members, personal KYC, identity masking, and financial records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold hover:bg-indigo-100 shadow-2xs"
          >
            <Upload className="h-4 w-4 text-indigo-600" />
            Import Excel
          </button>
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-2xs"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
            Export Excel
          </button>
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Register Member
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap gap-3 items-center justify-between">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Member ID, Full Name, Mobile..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={villageFilter}
            onChange={(e) => {
              setVillageFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Villages</option>
            {villages.map((v) => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
            <option value="DECEASED">DECEASED</option>
          </select>

          {/* Sorting Filter: Ascending / Descending with default Ascending */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">ક્રમ / Order:</span>
            <select
              value={`${sortBy}:${sortOrder}`}
              onChange={(e) => {
                const [f, o] = e.target.value.split(':');
                setSortBy(f);
                setSortOrder(o);
                setPage(1);
              }}
              className="text-xs font-semibold rounded border border-slate-300 px-2 py-0.5 bg-white text-slate-800 focus:ring-1 focus:ring-indigo-500"
            >
              <option value="memberId:asc">Member ID: ચડતો ક્રમ (Ascending) [Default]</option>
              <option value="memberId:desc">Member ID: ઉતરતો ક્રમ (Descending)</option>
              <option value="fullName:asc">નામ (A → Z): ચડતો ક્રમ (Ascending)</option>
              <option value="fullName:desc">નામ (Z → A): ઉતરતો ક્રમ (Descending)</option>
              <option value="joiningDate:asc">જોડાણ તારીખ: જૂની થી નવી (Ascending)</option>
              <option value="joiningDate:desc">જોડાણ તારીખ: નવી થી જૂની (Descending)</option>
            </select>

            {/* Quick Toggle Button between Asc and Desc */}
            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
                setPage(1);
              }}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition border cursor-pointer ${
                sortOrder === 'asc'
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                  : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              }`}
              title={`હાલનો ક્રમ: ${sortOrder === 'asc' ? 'ચડતો ક્રમ (Ascending)' : 'ઉતરતો ક્રમ (Descending)'}. ક્લિક કરીને બદલો.`}
            >
              {sortOrder === 'asc' ? (
                <>
                  <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                  <span>Asc</span>
                </>
              ) : (
                <>
                  <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
                  <span>Desc</span>
                </>
              )}
            </button>
          </div>

          {/* Page Size / Entry Count Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
            <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">Show:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(e.target.value)}
              className="text-xs font-bold rounded border border-slate-300 px-2 py-0.5 bg-white text-indigo-700 focus:ring-1 focus:ring-indigo-500"
            >
              <option value={25}>25 entries</option>
              <option value={50}>50 entries</option>
              <option value={75}>75 entries</option>
              <option value={100}>100 entries</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group"
                  onClick={() => handleSort('memberId')}
                  title="Click to sort by Member ID (ચડતો / ઉતરતો ક્રમ)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Member ID</span>
                    {sortBy === 'memberId' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>
                <th
                  className="py-3 px-4 cursor-pointer hover:bg-slate-100 transition select-none group"
                  onClick={() => handleSort('fullName')}
                  title="Click to sort by Full Name (A → Z / Z → A)"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Full Name</span>
                    {sortBy === 'fullName' ? (
                      sortOrder === 'asc' ? (
                        <ArrowUp className="h-3.5 w-3.5 text-indigo-600" />
                      ) : (
                        <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
                      )
                    ) : (
                      <ArrowUpDown className="h-3.5 w-3.5 text-slate-300 group-hover:text-slate-500" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-4">Village</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Masked Aadhaar</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">Loading members...</td>
                </tr>
              ) : members.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-400">No members found matching criteria.</td>
                </tr>
              ) : (
                members.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{m.memberId}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{m.fullName}</td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{m.villageId?.name || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-600">{m.mobileNumber || '-'}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.maskedAadhaar || '-'}</td>
                    <td className="py-3 px-4">
                      <Badge status={m.status} />
                    </td>
                    <td className="py-3 px-4 text-right space-x-1">
                      <button
                        onClick={() => openViewProfile(m)}
                        title="View Full Profile & Financials"
                        className="p-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => openEditModal(m)}
                        title="Edit Details"
                        className="p-1 rounded text-slate-600 hover:text-indigo-600 hover:bg-slate-100"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m)}
                        title="Delete Member"
                        className="p-1 rounded text-slate-600 hover:text-rose-600 hover:bg-slate-100"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={handleLimitChange}
        />
      </div>

      {/* Add / Edit Member Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingMember ? `Edit Member: ${editingMember.memberId}` : 'Register New Member / Family Head'}
        subtitle="Mandatory fields are marked with *. Identity numbers are stored securely and masked in public views."
        maxWidth="max-w-3xl"
      >
        {formError && (
          <div className="mb-4 rounded-lg bg-rose-50 p-3 text-xs text-rose-700 flex items-start gap-2 border border-rose-200">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Member ID (Optional, leave blank to auto-generate SDS-xxx)
              </label>
              <input
                type="text"
                value={formData.memberId}
                onChange={(e) => setFormData({ ...formData, memberId: e.target.value.toUpperCase() })}
                placeholder="e.g. SDS-001"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Rameshchandra Mohanlal Shah"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Village <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.villageId}
                onChange={(e) => setFormData({ ...formData, villageId: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="">Select Village</option>
                {villages.map((v) => (
                  <option key={v._id} value={v._id}>{v.name} ({v.district})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Date of Birth <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.dob}
                onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="tel"
                value={formData.mobileNumber}
                onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                placeholder="10 digit mobile"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Marital Status</label>
              <select
                value={formData.maritalStatus ? 'true' : 'false'}
                onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value === 'true' })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="true">Married (Yes)</option>
                <option value="false">Unmarried (No)</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Occupation</label>
              <input
                type="text"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Business / Service"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">PAN Card Number</label>
              <input
                type="text"
                maxLength={10}
                value={formData.panCard}
                onChange={(e) => setFormData({ ...formData, panCard: e.target.value.toUpperCase() })}
                placeholder="ABCDE1234F"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono uppercase"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Aadhaar Card Number</label>
              <input
                type="text"
                maxLength={12}
                value={formData.aadhaarCard}
                onChange={(e) => setFormData({ ...formData, aadhaarCard: e.target.value.replace(/\D/g, '') })}
                placeholder="12 digit Aadhaar"
                className="w-full px-3 py-2 rounded-lg border border-slate-300 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Residential Address</label>
            <textarea
              rows={2}
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Street, Village/City, District"
              className="w-full px-3 py-2 rounded-lg border border-slate-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Member Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
                <option value="DECEASED">DECEASED</option>
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes</label>
              <input
                type="text"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional comments"
                className="w-full px-3 py-2 rounded-lg border border-slate-300"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : editingMember ? 'Update Member' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Member Profile Drawer Modal */}
      <Modal
        isOpen={!!viewingMember}
        onClose={() => setViewingMember(null)}
        title={`Member Profile: ${viewingMember?.memberId} — ${viewingMember?.fullName}`}
        subtitle="Complete record, registered nominees, installment dues, and verified financial ledger."
        maxWidth="max-w-4xl"
      >
        {detailsLoading ? (
          <div className="py-12 text-center text-slate-400">Loading complete member history...</div>
        ) : memberDetails && (
          <div className="space-y-4">
            {/* Tabs Header */}
            <div className="flex border-b border-slate-200 text-xs font-bold space-x-4">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-2.5 transition border-b-2 ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Overview & KYC
              </button>
              <button
                onClick={() => setActiveTab('nominees')}
                className={`pb-2.5 transition border-b-2 ${activeTab === 'nominees' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Nominees ({memberDetails.nominees?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('dues')}
                className={`pb-2.5 transition border-b-2 ${activeTab === 'dues' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Installment Dues
              </button>
              <button
                onClick={() => setActiveTab('financials')}
                className={`pb-2.5 transition border-b-2 ${activeTab === 'financials' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
              >
                Financial Summary
              </button>
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-slate-500">Member ID:</span>
                    <p className="font-bold font-mono text-slate-900">{memberDetails.member?.memberId}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Full Name:</span>
                    <p className="font-bold text-slate-900">{memberDetails.member?.fullName}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Village:</span>
                    <p className="font-semibold text-slate-800">{memberDetails.member?.villageId?.name || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Date of Birth:</span>
                    <p className="font-medium text-slate-800">{new Date(memberDetails.member?.dob).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Mobile:</span>
                    <p className="font-mono text-slate-800">{memberDetails.member?.mobileNumber || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Status:</span>
                    <div><Badge status={memberDetails.member?.status} /></div>
                  </div>
                  <div>
                    <span className="text-slate-500">Masked Aadhaar:</span>
                    <p className="font-mono text-slate-800">{memberDetails.member?.maskedAadhaar || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Masked PAN:</span>
                    <p className="font-mono text-slate-800">{memberDetails.member?.maskedPan || '-'}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Occupation:</span>
                    <p className="font-medium text-slate-800">{memberDetails.member?.occupation || '-'}</p>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Residential Address:</span>
                  <p className="font-medium text-slate-800 mt-0.5">{memberDetails.member?.address || '-'}</p>
                </div>
              </div>
            )}

            {/* Tab: Nominees */}
            {activeTab === 'nominees' && (
              <div className="space-y-3">
                {(!memberDetails.nominees || memberDetails.nominees.length === 0) ? (
                  <p className="text-xs text-slate-500 py-4 text-center">No nominees registered for this member.</p>
                ) : (
                  memberDetails.nominees.map((n) => (
                    <div key={n._id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{n.nomineeName} ({n.relation})</p>
                        <p className="text-slate-500">Priority: #{n.priority} • Share: {n.sharePercentage}%</p>
                      </div>
                      <div className="text-right font-mono text-[11px] text-slate-600">
                        <p>Aadhaar: {n.maskedAadhaar || '-'}</p>
                        <p>PAN: {n.maskedPan || '-'}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Tab: Installment Dues */}
            {activeTab === 'dues' && (
              <div className="space-y-2">
                <div className="overflow-x-auto border border-slate-200 rounded-lg">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 font-bold text-slate-700">
                      <tr>
                        <th className="py-2 px-3">Installment</th>
                        <th className="py-2 px-3">Due Date</th>
                        <th className="py-2 px-3 text-right">Original</th>
                        <th className="py-2 px-3 text-right">Paid</th>
                        <th className="py-2 px-3 text-right">Outstanding</th>
                        <th className="py-2 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(memberDetails.financialSummary?.duesBreakdown || []).map((d) => (
                        <tr key={d._id}>
                          <td className="py-2 px-3 font-semibold text-slate-900">{d.installmentId?.installmentTitle}</td>
                          <td className="py-2 px-3 text-slate-600">{new Date(d.dueDate).toLocaleDateString()}</td>
                          <td className="py-2 px-3 text-right font-mono">{d.originalAmountPaise / 100}</td>
                          <td className="py-2 px-3 text-right font-mono text-emerald-600">{d.paidAmountPaise / 100}</td>
                          <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">{d.outstandingAmountPaise / 100}</td>
                          <td className="py-2 px-3"><Badge status={d.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tab: Financials */}
            {activeTab === 'financials' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                    <span className="text-slate-500">Total Demand:</span>
                    <p className="text-base font-black text-slate-900 mt-1">{memberDetails.financialSummary?.formattedTotalDues}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                    <span className="text-emerald-700">Total Confirmed Paid:</span>
                    <p className="text-base font-black text-emerald-700 mt-1">{memberDetails.financialSummary?.formattedPaidDues}</p>
                  </div>
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg">
                    <span className="text-rose-700">Pending Installments:</span>
                    <p className="text-base font-black text-rose-700 mt-1">{memberDetails.financialSummary?.formattedPendingDues}</p>
                  </div>
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <span className="text-indigo-700">Total Outstanding:</span>
                    <p className="text-base font-black text-indigo-700 mt-1">{memberDetails.financialSummary?.formattedTotalOutstanding}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <h5 className="font-bold text-slate-900">Death Claim Assistance Eligibility Status</h5>
                    <p className="text-slate-500">
                      Under approved society rules, all required installments must be confirmed and cleared.
                    </p>
                  </div>
                  <div>
                    {memberDetails.financialSummary?.isEligibleForClaim ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                        <CheckCircle2 className="h-4 w-4" />
                        ELIGIBLE (Zero Dues)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-rose-100 text-rose-800 rounded-full font-bold">
                        <AlertCircle className="h-4 w-4" />
                        ON HOLD (Pending Dues)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Excel Bulk Import with Column Mapping Modal */}
      <ExcelImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={fetchMembers}
      />
    </div>
  );
}
