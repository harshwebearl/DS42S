import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../../api/axiosClient';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Table,
  Check
} from 'lucide-react';
import Modal from '../common/Modal';

const SYSTEM_FIELDS = [
  { key: 'fullName', label: 'Full Name', required: true, aliases: ['name', 'fullname', 'full name', 'member name', 'sabhyanu naam', 'naam'] },
  { key: 'villageName', label: 'Village / Gam', required: true, aliases: ['village', 'gam', 'city', 'town', 'village name', 'gamnu naam'] },
  { key: 'memberId', label: 'Member ID', required: false, aliases: ['id', 'memberid', 'member id', 'sr no', 'srno', 's.no', 'kramank', 'sabhyakram'] },
  { key: 'mobileNumber', label: 'Mobile Number', required: false, aliases: ['mobile', 'phone', 'contact', 'mobile no', 'cell', 'phone no'] },
  { key: 'dob', label: 'Date of Birth', required: false, aliases: ['dob', 'birth date', 'birthdate', 'date of birth', 'janma tarikh'] },
  { key: 'occupation', label: 'Occupation', required: false, aliases: ['occupation', 'dhandho', 'business', 'job', 'profession', 'vyavsay'] },
  { key: 'gender', label: 'Gender', required: false, aliases: ['gender', 'sex', 'jati'] },
  { key: 'address', label: 'Address', required: false, aliases: ['address', 'residence', 'street', 'main bazar', 'rahthan'] },
  { key: 'panCard', label: 'PAN Card', required: false, aliases: ['pan', 'pancard', 'pan card', 'pan no'] },
  { key: 'aadhaarCard', label: 'Aadhaar Card', required: false, aliases: ['aadhaar', 'aadhar', 'aadhaar card', 'aadhar card', 'aadhaar no'] },
  { key: 'nomineeName', label: 'Nominee Name', required: false, aliases: ['nominee', 'nominee name', 'varasdar', 'varasdar naam'] },
  { key: 'nomineeRelation', label: 'Nominee Relation', required: false, aliases: ['relation', 'relationship', 'varasdar sambandh', 'sambandh'] },
  { key: 'nomineeMobile', label: 'Nominee Mobile', required: false, aliases: ['nominee mobile', 'nominee phone', 'varasdar mobile'] }
];

export default function ExcelImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState(1); // 1: Upload, 2: Map, 3: Preview & Import
  const [excelFile, setExcelFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [excelHeaders, setExcelHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [mapping, setMapping] = useState({});
  const [autoCreateVillages, setAutoCreateVillages] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [resultMsg, setResultMsg] = useState('');

  // Download Sample Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'Member ID': '66',
        'Full Name': 'Jyantilal Ratilal Shah',
        'Village': 'Aakhaj',
        'Mobile Number': '9825012345',
        'Date of Birth': '1970-05-15',
        'Occupation': 'Business',
        'Gender': 'MALE',
        'Address': 'Main Bazar, Aakhaj',
        'PAN Card': 'ABCDE1234F',
        'Aadhaar Card': '987654321234',
        'Nominee Name': 'Shardaben J. Shah',
        'Nominee Relation': 'SPOUSE',
        'Nominee Mobile': '9825098765'
      },
      {
        'Member ID': '67',
        'Full Name': 'Rupeshkumar Jyantilal Shah',
        'Village': 'Aakhaj',
        'Mobile Number': '9825023456',
        'Date of Birth': '1995-08-20',
        'Occupation': 'Trading',
        'Gender': 'MALE',
        'Address': 'Station Road, Aakhaj',
        'PAN Card': '',
        'Aadhaar Card': '987654325678',
        'Nominee Name': 'Payalben R. Shah',
        'Nominee Relation': 'SPOUSE',
        'Nominee Mobile': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Members');
    XLSX.writeFile(workbook, 'samiti_members_import_template.xlsx');
  };

  // Handle Excel File Selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setErrorMsg('');
    setFileName(file.name);
    setExcelFile(file);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length === 0) {
          setErrorMsg('The selected Excel file is empty.');
          return;
        }

        const headers = (data[0] || []).map((h) => String(h || '').trim()).filter(Boolean);
        const rows = data.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c !== ''));

        if (headers.length === 0) {
          setErrorMsg('Could not find header row in Excel.');
          return;
        }

        setExcelHeaders(headers);
        setRawRows(rows);

        // Auto-match headers to system fields
        const initialMapping = {};
        SYSTEM_FIELDS.forEach((sf) => {
          const match = headers.find((h) => {
            const hLower = h.toLowerCase().replace(/[^a-z0-9]/g, '');
            return sf.aliases.some((a) => a.replace(/[^a-z0-9]/g, '') === hLower);
          });
          if (match) {
            initialMapping[sf.key] = match;
          }
        });

        setMapping(initialMapping);
        setStep(2); // Advance to column mapping
      } catch (err) {
        setErrorMsg('Error reading Excel file. Please ensure it is a valid .xlsx or .xls file.');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Change column mapping for a system field
  const handleMappingChange = (fieldKey, headerName) => {
    setMapping((prev) => ({
      ...prev,
      [fieldKey]: headerName || undefined
    }));
  };

  // Map rows based on selected mappings
  const getMappedRows = () => {
    return rawRows.map((row) => {
      const obj = {};
      SYSTEM_FIELDS.forEach((sf) => {
        const mappedHeader = mapping[sf.key];
        if (mappedHeader) {
          const colIndex = excelHeaders.indexOf(mappedHeader);
          if (colIndex !== -1 && row[colIndex] !== undefined) {
            obj[sf.key] = row[colIndex];
          }
        }
      });
      return obj;
    });
  };

  // Validation before proceeding to step 3
  const handleProceedToPreview = () => {
    if (!mapping.fullName) {
      setErrorMsg('Please map the "Full Name" field before proceeding.');
      return;
    }
    setErrorMsg('');
    setStep(3);
  };

  // Final Submit to Backend
  const handleExecuteImport = async () => {
    const mappedRows = getMappedRows();
    if (mappedRows.length === 0) {
      setErrorMsg('No valid rows found to import.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setResultMsg('');

    try {
      const res = await api.post('/members/bulk-import', {
        members: mappedRows,
        autoCreateVillages
      });

      setResultMsg(res.data.message || `Successfully imported ${res.data.importedCount} members!`);
      setTimeout(() => {
        if (onImportSuccess) onImportSuccess();
        handleClose();
      }, 1500);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error executing bulk import.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setExcelFile(null);
    setFileName('');
    setExcelHeaders([]);
    setRawRows([]);
    setMapping({});
    setErrorMsg('');
    setResultMsg('');
    onClose();
  };

  const mappedRowsPreview = getMappedRows().slice(0, 5);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Members via Excel / CSV (With Column Mapping)"
      size="2xl"
    >
      <div className="space-y-6 text-xs">
        {/* Step Indicator */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 1 ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
            }`}>
              {step > 1 ? '✓' : '1'}
            </span>
            <span className={step === 1 ? 'font-bold text-slate-900' : 'text-slate-500'}>Upload File</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 2 ? 'bg-indigo-600 text-white' : step > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              {step > 2 ? '✓' : '2'}
            </span>
            <span className={step === 2 ? 'font-bold text-slate-900' : 'text-slate-500'}>Column Mapping</span>
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300" />

          <div className="flex items-center gap-2">
            <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
              step === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
            }`}>
              3
            </span>
            <span className={step === 3 ? 'font-bold text-slate-900' : 'text-slate-500'}>Preview & Confirm</span>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {resultMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
            <span>{resultMsg}</span>
          </div>
        )}

        {/* STEP 1: Upload File */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <h4 className="font-bold text-slate-900">Need a ready-made template?</h4>
                <p className="text-slate-500 text-[11px]">Download our sample Excel template with all recommended columns.</p>
              </div>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 font-bold text-indigo-600 hover:bg-indigo-50 shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-slate-300 hover:border-indigo-500 rounded-xl p-8 text-center bg-slate-50/50 hover:bg-indigo-50/30 transition">
              <input
                type="file"
                id="excel-file-upload"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="excel-file-upload" className="cursor-pointer block space-y-3">
                <div className="w-12 h-12 mx-auto rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">Click here to browse or drag & drop Excel / CSV file</p>
                  <p className="text-slate-400 text-[11px] mt-0.5">Supports Microsoft Excel (.xlsx, .xls) and CSV files</p>
                </div>
                <span className="inline-block px-4 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs shadow-xs">
                  Choose Excel File
                </span>
              </label>
            </div>
          </div>
        )}

        {/* STEP 2: Interactive Column Mapping */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-indigo-900 flex items-center gap-1.5">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600" />
                  File: {fileName}
                </p>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Found <strong>{rawRows.length} rows</strong> and <strong>{excelHeaders.length} columns</strong>. Match each CRM field with your sheet's column.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] font-bold text-indigo-600 hover:underline"
              >
                Change File
              </button>
            </div>

            {/* Column Mapping Grid */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
              <div className="p-2.5 bg-slate-100 font-bold text-slate-700 grid grid-cols-2 text-xs">
                <span>Samiti CRM Field</span>
                <span>Your Excel Sheet Column</span>
              </div>

              {SYSTEM_FIELDS.map((sf) => (
                <div key={sf.key} className="p-2.5 grid grid-cols-2 items-center gap-3 hover:bg-slate-50">
                  <div>
                    <label className="font-bold text-slate-800">
                      {sf.label}
                      {sf.required && <span className="text-rose-500 ml-1">*</span>}
                    </label>
                    <p className="text-[10px] text-slate-400">
                      {sf.required ? 'Required field' : 'Optional'}
                    </p>
                  </div>

                  <div>
                    <select
                      value={mapping[sf.key] || ''}
                      onChange={(e) => handleMappingChange(sf.key, e.target.value)}
                      className={`w-full px-2.5 py-1.5 text-xs rounded-lg border font-medium transition ${
                        mapping[sf.key]
                          ? 'border-indigo-400 bg-indigo-50/30 text-indigo-900 font-bold'
                          : sf.required
                          ? 'border-rose-300 bg-rose-50/30 text-slate-600'
                          : 'border-slate-300 bg-white text-slate-600'
                      }`}
                    >
                      <option value="">-- Skip / Not in File --</option>
                      {excelHeaders.map((h) => (
                        <option key={h} value={h}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="auto-create-village"
                checked={autoCreateVillages}
                onChange={(e) => setAutoCreateVillages(e.target.checked)}
                className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer"
              />
              <label htmlFor="auto-create-village" className="text-slate-700 cursor-pointer font-medium text-[11px]">
                Auto-add village to Village Master if it does not already exist
              </label>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </button>

              <button
                type="button"
                onClick={handleProceedToPreview}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-1.5 shadow-xs"
              >
                Proceed to Preview <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Preview & Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Ready to Import {rawRows.length} Members
                </p>
                <p className="text-emerald-700 text-[11px] mt-0.5">
                  Below is a preview of the first 5 records with your column mapping applied.
                </p>
              </div>
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 font-bold text-slate-700 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-2.5">#</th>
                    <th className="py-2 px-2.5">Member ID</th>
                    <th className="py-2 px-2.5">Full Name</th>
                    <th className="py-2 px-2.5">Village</th>
                    <th className="py-2 px-2.5">Mobile</th>
                    <th className="py-2 px-2.5">DOB</th>
                    <th className="py-2 px-2.5">Nominee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {mappedRowsPreview.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-2.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="py-2 px-2.5 font-mono font-bold text-slate-700">
                        {row.memberId || <span className="text-slate-400 italic">Auto-gen</span>}
                      </td>
                      <td className="py-2 px-2.5 font-bold text-slate-900">{row.fullName || '-'}</td>
                      <td className="py-2 px-2.5 text-slate-700">{row.villageName || '-'}</td>
                      <td className="py-2 px-2.5 font-mono text-slate-600">{row.mobileNumber || '-'}</td>
                      <td className="py-2 px-2.5 text-slate-500">{row.dob ? String(row.dob) : '-'}</td>
                      <td className="py-2 px-2.5 text-slate-600">
                        {row.nomineeName ? `${row.nomineeName} (${row.nomineeRelation || 'Nominee'})` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={submitting}
                className="px-3.5 py-2 rounded-lg border border-slate-300 text-slate-700 font-bold flex items-center gap-1.5"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Adjust Mapping
              </button>

              <button
                type="button"
                onClick={handleExecuteImport}
                disabled={submitting}
                className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Importing {rawRows.length} Records...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Confirm & Import {rawRows.length} Members</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
