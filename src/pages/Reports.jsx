import React, { useState, useEffect } from 'react';
import api, { API_URL } from '../api/axiosClient';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Search,
  Filter,
  Download,
  Calendar,
  Layers
} from 'lucide-react';

const REPORT_DEFINITIONS = [
  { id: 'all-members', name: '1. All Members Report', desc: 'Complete registry of all registered society members with personal & KYC info' },
  { id: 'village-wise-members', name: '2. Village-wise Member Report', desc: 'Member census distributed across all 42 Gnati native villages' },
  { id: 'fy-collection', name: '3. Financial Year-wise Collection Report', desc: 'Annual demand, realized collections, and pending dues per accounting year' },
  { id: 'installment-pending', name: '4. Installment-wise Pending Report', desc: 'Detailed breakdown of unpaid and partial member installment dues' },
  { id: 'member-payment-statement', name: '5. Member-wise Payment Statement', desc: 'Realized single and bulk allocations received from society members' },
  { id: 'penalty-report', name: '6. Penalty Report', desc: 'Record of all assessed penalties, payments, and authorized waivers' },
  { id: 'single-payments', name: '7. Single Payment Report', desc: 'Individual payments collected across cash, UPI, bank transfer, and cheques' },
  { id: 'bulk-payments', name: '8. Bulk Payment Report', desc: 'Master bulk cheque vouchers and group allocations across families' },
  { id: 'cheque-clearance', name: '9. Cheque Clearance Report', desc: 'Realization status of all cheques: received, deposited, and cleared' },
  { id: 'bounced-cheques', name: '10. Bounced Cheque Report', desc: 'Record of unpaid dishonored cheques with recorded bank bounce reasons' },
  { id: 'death-claims', name: '11. Death Claim Report', desc: 'Assistance claims filed on deceased members with nominee details' },
  { id: 'claim-eligibility', name: '12. Claim Eligibility Report', desc: 'Audit compliance verifying 100% dues clearance prior to cheque issue' },
  { id: 'claim-cheques', name: '13. Claim Cheque Issue Report', desc: 'Disbursement cheques prepared, issued, handed over, and cleared' },
  { id: 'outstanding-balances', name: '14. Outstanding Balance Report', desc: 'List of members carrying active unpaid balances' },
  { id: 'annual-summary', name: '15. Annual Collection Summary', desc: 'Macro collection performance split by payment modes and accounting years' }
];

export default function Reports() {
  const [activeReportId, setActiveReportId] = useState('all-members');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [villages, setVillages] = useState([]);
  const [villageFilter, setVillageFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    api.get('/villages').then((res) => {
      setVillages(res.data.villages || []);
    });
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/reports/${activeReportId}`, {
        params: { villageId: villageFilter }
      });
      setReportData(res.data.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReportId, villageFilter]);

  const handleExportExcel = () => {
    const token = localStorage.getItem('token');
    window.open(`${API_URL}/reports/${activeReportId}/export-excel?villageId=${villageFilter}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  // Derive columns from first data item
  const columns = reportData.length > 0 ? Object.keys(reportData[0]) : [];

  // Client-side search filter
  const filteredData = reportData.filter((row) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return Object.values(row).some((val) => String(val || '').toLowerCase().includes(q));
  });

  const activeDef = REPORT_DEFINITIONS.find((r) => r.id === activeReportId);

  return (
    <div className="space-y-6">
      {/* Page Header (No Print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-indigo-600" />
            Society Reports & Financial Audits
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate and export all 15 official financial statements, member census, clearance logs, and death assistance registers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm transition"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Export to Excel (.xlsx)
          </button>
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 shadow-sm transition"
          >
            <Printer className="h-4 w-4" />
            Print Report
          </button>
        </div>
      </div>

      {/* Report Selector Dropdown / Pills (No Print) */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3 no-print">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
          Select Report Type (15 Available Reports)
        </label>
        <select
          value={activeReportId}
          onChange={(e) => setActiveReportId(e.target.value)}
          className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 font-bold bg-white text-indigo-900 text-sm"
        >
          {REPORT_DEFINITIONS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} — {r.desc}
            </option>
          ))}
        </select>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search in generated report..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300"
            />
          </div>

          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="text-xs rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700"
          >
            <option value="">All Gnati Villages</option>
            {villages.map((v) => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Generated Report Table / Printable Paper */}
      <div id="printable-report" className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4 print:border-none print:shadow-none print:p-0">
        {/* Printable Header */}
        <div className="text-center pb-3 border-b-2 border-indigo-900">
          <p className="text-[11px] uppercase font-bold tracking-widest text-indigo-700">Official Society Financial Report</p>
          <h2 className="text-lg font-black text-slate-900">
            SHREE DASHASHREMALI 42 GNATI SURAKSHA SAMITI
          </h2>
          <h3 className="text-sm font-bold text-indigo-900 mt-0.5">{activeDef?.name}</h3>
          <p className="text-[10px] text-slate-500">Generated on {new Date().toLocaleDateString()} • Central Directorate</p>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 font-semibold no-print">
          <span>Total Records: <strong className="text-slate-900">{filteredData.length}</strong></span>
          <span>Report ID: <span className="font-mono">{activeReportId}</span></span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto border border-slate-200 rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 font-mono">#</th>
                {columns.map((col) => (
                  <th key={col} className="py-2.5 px-3 whitespace-nowrap">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-[11px]">
              {loading ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-12 text-center text-slate-400">Generating report data...</td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length + 1} className="py-8 text-center text-slate-400">No records found matching criteria.</td>
                </tr>
              ) : (
                filteredData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    {columns.map((col) => (
                      <td key={col} className="py-2 px-3 whitespace-nowrap font-medium text-slate-800">
                        {String(row[col] !== undefined && row[col] !== null ? row[col] : '-')}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Footer */}
        <div className="pt-6 flex justify-between items-end text-xs">
          <div>
            <p className="text-[10px] text-slate-400">Authentic System Generated Record.</p>
          </div>
          <div className="text-center">
            <div className="h-8 border-b border-slate-400 w-36 mb-1" />
            <p className="font-bold text-slate-800 text-[11px]">Director Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
}
