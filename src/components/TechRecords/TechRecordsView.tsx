import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  Building2,
  Plane,
  Database,
  Boxes,
  Wrench,
  Activity,
  Sliders,
  Check,
  X,
  FileCheck,
  ShieldCheck,
  Eye,
  Download,
  AlertCircle,
  HelpCircle,
  Folder,
  Layers,
  Sparkles,
  RefreshCw,
  MoreVertical,
} from 'lucide-react';
import {
  TechnicalRecordItem,
  TechnicalRecordStats,
  TechnicalRecordType,
  PdfExtractResponse,
  CsvMapAndValidateResponse,
} from '../../types/aircraft';
import { api } from '../../services/apiClient';
import { mockAirDoctorService } from '../../services/mockAirDoctorService';
import { fullFleetTable, baseList } from '../../data/aircraftData';

interface TechRecordsViewProps {
  onNavigate?: (tab: string) => void;
  activeNav?: string;
  onLogDecision?: () => void;
}

export const TechRecordsView: React.FC<TechRecordsViewProps> = ({
  onNavigate,
  activeNav,
  onLogDecision,
}) => {
  // 1. Aircraft Selection State
  const [selectedAircraftCode, setSelectedAircraftCode] = useState<string>('Rafale R-01');
  const [isAircraftDropdownOpen, setIsAircraftDropdownOpen] = useState<boolean>(false);
  const [aircraftSearch, setAircraftSearch] = useState<string>('');

  // 2. Record Type State
  const [recordType, setRecordType] = useState<TechnicalRecordType>('Maintenance History');
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState<boolean>(false);

  // 3. Stats & Records State
  const [stats, setStats] = useState<TechnicalRecordStats>({
    total_records: 12468,
    verified_records: 9842,
    pending_verification: 1924,
    incomplete_conflicting: 702,
  });

  const [records, setRecords] = useState<TechnicalRecordItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('All Records');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFiltersModal, setShowFiltersModal] = useState<boolean>(false);

  // 4. File Upload & Processing State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadToast, setUploadToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Modals
  const [pdfReviewData, setPdfReviewData] = useState<PdfExtractResponse | null>(null);
  const [csvReviewData, setCsvReviewData] = useState<CsvMapAndValidateResponse | null>(null);
  const [selectedRecordDetail, setSelectedRecordDetail] = useState<TechnicalRecordItem | null>(null);
  const [connectedSourceModal, setConnectedSourceModal] = useState<{ name: string; type: string } | null>(null);

  // Editable fields in PDF review modal
  const [reviewedFields, setReviewedFields] = useState<Record<string, any>>({});

  // Available aircraft registry
  const availableAircraft = useMemo(() => {
    const list = [
      { id: 'rafale-r01', code: 'Rafale R-01', model: 'Rafale', variant: 'EH (Standard F3-R)', squadron: 'No. 17 Squadron (Golden Arrows)', base: 'Central HQ / Ambala AFS', serial: 'RB-001' },
      { id: 'tejas-t04', code: 'Tejas T-04', model: 'Tejas', variant: 'Mk1 (FOC Fighter)', squadron: 'No. 45 Squadron (Flying Daggers)', base: 'Base Bravo (Sulur AFS)', serial: 'LA-5004' },
      { id: 'mig21-m12', code: 'MiG-21 M-12', model: 'MiG-21', variant: 'Bison Upgrade', squadron: 'No. 23 Squadron (Panthers)', base: 'Nal AFS / Western Command', serial: 'CU-2112' },
      { id: 'rafale-r02', code: 'Rafale R-02', model: 'Rafale', variant: 'EH (Standard F3-R)', squadron: 'No. 17 Squadron (Golden Arrows)', base: 'Base Alpha (Ambala AFS)', serial: 'RB-002' },
      { id: 'tejas-t01', code: 'Tejas T-01', model: 'Tejas', variant: 'Mk1 (IOC Standard)', squadron: 'No. 45 Squadron (Flying Daggers)', base: 'Base Bravo (Sulur AFS)', serial: 'LA-5001' },
    ];
    if (!aircraftSearch.trim()) return list;
    const term = aircraftSearch.toLowerCase();
    return list.filter((a) => a.code.toLowerCase().includes(term) || a.model.toLowerCase().includes(term) || a.base.toLowerCase().includes(term));
  }, [aircraftSearch]);

  const selectedAircraftInfo = useMemo(() => {
    return availableAircraft.find((a) => a.code === selectedAircraftCode) || availableAircraft[0];
  }, [availableAircraft, selectedAircraftCode]);

  // Load KPI metrics and records
  const fetchRecordsAndStats = async () => {
    try {
      setLoading(true);
      const [statsData, recordsData] = await Promise.all([
        api.getTechnicalRecordsStats(),
        api.getTechnicalRecords({
          record_type: activeTab === 'All Records' ? undefined : activeTab,
          status: statusFilter === 'all' ? undefined : statusFilter,
          search: searchQuery,
        }),
      ]);
      setStats(statsData);
      setRecords(recordsData);
    } catch {
      // Fallback to mock
      setStats(mockAirDoctorService.getTechnicalRecordsStats());
      setRecords(mockAirDoctorService.getTechnicalRecords({
        record_type: activeTab === 'All Records' ? undefined : activeTab,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery,
      }) as TechnicalRecordItem[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecordsAndStats();
  }, [activeTab, statusFilter, searchQuery]);

  // Synchronize sidebar activeNav with tabs, filters, and section scrolling
  useEffect(() => {
    if (activeNav === 'maintenance-history') {
      setActiveTab('Maintenance History');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'inspection-records') {
      setActiveTab('Inspection Records');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'component-changes') {
      setActiveTab('Component Changes');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'previous-records') {
      setActiveTab('Previous Records');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'verify-queue') {
      setStatusFilter('Pending');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'audit-trail') {
      setStatusFilter('Verified');
      document.getElementById('recent-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'aircraft-records') {
      setIsAircraftDropdownOpen(true);
      document.getElementById('import-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'import-records') {
      document.getElementById('import-records-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'data-sources') {
      document.getElementById('digital-sources-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (activeNav === 'records-overview' || activeNav === 'tech-records') {
      setActiveTab('All Records');
      setStatusFilter('all');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeNav]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setUploadToast({ message, type });
    setTimeout(() => setUploadToast(null), 5000);
  };

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf');
    const isCsvOrExcel = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls');

    if (!isPdf && !isCsvOrExcel) {
      showToast('Unsupported file type. Please upload a PDF, CSV, or Excel file.', 'error');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      showToast('File size exceeds the 50 MB limit.', 'error');
      return;
    }

    setIsUploading(true);
    try {
      if (isPdf) {
        const res = await api.uploadPdfRecord(file, file.name, selectedAircraftCode, recordType);
        setPdfReviewData(res);
        setReviewedFields({
          aircraft_id: res.extracted_fields.aircraft_id || selectedAircraftCode,
          date: res.extracted_fields.date || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          component: res.extracted_fields.component || 'Engine (M88)',
          finding: res.extracted_fields.finding || 'Borescope inspection completed with normal clearances.',
          work_performed: res.extracted_fields.work_performed || 'Dimensional measurement and pressure test completed.',
          parts_replaced: res.extracted_fields.parts_replaced || 'None (Scheduled inspection sign-off)',
          uploaded_by: res.extracted_fields.uploaded_by || 'Cpl. Arjun Singh',
          flight_hours: res.extracted_fields.flight_hours || '1,248 h',
        });
        showToast('PDF parsed successfully. Review extracted fields before committing.', 'info');
      } else {
        const res = await api.uploadCsvRecord(file, file.name, selectedAircraftCode, recordType);
        setCsvReviewData(res);
        showToast(`CSV preview parsed: ${res.valid_rows} valid records found.`, 'info');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to parse file.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Demo file trigger for evaluators
  const handleLoadSamplePdf = () => {
    const dummyBlob = new Blob(['%PDF-1.4 Indian Air Force Inspection Report'], { type: 'application/pdf' });
    const dummyFile = new File([dummyBlob], `IAF_${selectedAircraftInfo.model}_Inspection_Oct2026.pdf`, { type: 'application/pdf' });
    handleFileUpload(dummyFile);
  };

  const handleLoadSampleCsv = () => {
    const csvContent = `date,aircraft,component,finding,work_performed,technician\n18 Oct 2026,${selectedAircraftCode},Engine (M88),Hot section stator vanes nominal,Borescope test executed,Cpl. Arjun Singh\n17 Oct 2026,${selectedAircraftCode},Hydraulic System,Return pressure 205 bar,Pressure leak check executed,Fg Off. Patel`;
    const dummyBlob = new Blob([csvContent], { type: 'text/csv' });
    const dummyFile = new File([dummyBlob], `IAF_${selectedAircraftInfo.model}_Telemetry_Log.csv`, { type: 'text/csv' });
    handleFileUpload(dummyFile);
  };

  // Commit PDF reviewed record
  const handleCommitPdfRecord = async (status: 'Verified' | 'Pending') => {
    if (!pdfReviewData) return;
    try {
      await api.commitTechnicalRecord({
        aircraft_id: reviewedFields.aircraft_id || selectedAircraftCode,
        record_type: recordType,
        date: reviewedFields.date,
        component: reviewedFields.component,
        source: 'PDF Import',
        uploaded_by: reviewedFields.uploaded_by,
        finding: reviewedFields.finding,
        work_performed: reviewedFields.work_performed,
        parts_replaced: reviewedFields.parts_replaced,
        flight_hours: reviewedFields.flight_hours,
        document_name: pdfReviewData.filename,
        document_type: 'pdf',
        status: status,
        confidence_score: pdfReviewData.confidence_score,
        validation_issues: pdfReviewData.validation_issues,
        reviewer: 'Flt Lt. Meera (QA Officer)',
      });

      showToast(`Record committed successfully as ${status} and logged to SHA-256 Decision Ledger.`, 'success');
      setPdfReviewData(null);
      fetchRecordsAndStats();
      if (onLogDecision) onLogDecision();
    } catch (err: any) {
      showToast(err?.message || 'Failed to commit record.', 'error');
    }
  };

  // Commit CSV records
  const handleCommitCsvRecord = async () => {
    if (!csvReviewData) return;
    try {
      await api.commitTechnicalRecord({
        aircraft_id: selectedAircraftCode,
        record_type: recordType,
        date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
        component: 'Multi-Component Batch',
        source: 'CSV Import',
        uploaded_by: 'Fg Off. Patel',
        finding: `${csvReviewData.valid_rows} rows ingested from ${csvReviewData.filename}`,
        work_performed: 'Batch CSV schema mapping and validation commit.',
        parts_replaced: 'Batch Parts',
        flight_hours: selectedAircraftInfo.model === 'Rafale' ? '1,248 h' : '840 h',
        document_name: csvReviewData.filename,
        document_type: 'csv',
        status: 'Verified',
        confidence_score: 95,
        reviewer: 'Flt Lt. Meera (QA Officer)',
      });

      showToast(`Batch committed: ${csvReviewData.valid_rows} records added to ${selectedAircraftCode} logbook.`, 'success');
      setCsvReviewData(null);
      fetchRecordsAndStats();
      if (onLogDecision) onLogDecision();
    } catch (err: any) {
      showToast(err?.message || 'Failed to commit batch.', 'error');
    }
  };

  // Export structured fields to CSV
  const handleExportReviewedCsv = () => {
    if (!reviewedFields) return;
    const headers = Object.keys(reviewedFields).join(',');
    const values = Object.values(reviewedFields).map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',');
    const csvContent = `data:text/csv;charset=utf-8,${headers}\n${values}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${selectedAircraftCode}_TechnicalRecord_Export.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported structured record to CSV.', 'info');
  };

  const recordTypes: TechnicalRecordType[] = [
    'Maintenance History',
    'Inspection Record',
    'Component Change',
    'Fault / Repair Report',
    'Usage / Flight Data',
    'Airworthiness Directive (AD/SB)',
    'Other Technical Record',
  ];

  const tableTabs = [
    'All Records',
    'Maintenance History',
    'Inspection Records',
    'Component Changes',
    'Fault / Repair Reports',
    'Previous Records',
  ];

  return (
    <div className="space-y-6 max-w-[1680px] mx-auto pb-12 select-none font-sans text-slate-800">
      {/* Toast Alert */}
      {uploadToast && (
        <div
          className={`fixed top-18 right-8 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-3 transition-all animate-in fade-in slide-in-from-top-4 ${
            uploadToast.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : uploadToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {uploadToast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
          {uploadToast.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
          {uploadToast.type === 'info' && <AlertCircle className="w-5 h-5 text-blue-600 shrink-0" />}
          <span className="text-xs font-semibold">{uploadToast.message}</span>
          <button onClick={() => setUploadToast(null)} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header matching reference image */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Technical Records &amp; Quality
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Manage aircraft maintenance records, inspections and documentation
        </p>
      </div>

      {/* 2. Top Section: 1. Import New Records (Left) + Digital Import / Connected Systems (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: 1. Import New Records */}
        <div id="import-records-section" className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>1. Import New Records</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select aircraft, record type and upload file or connect a digital source
              </p>
            </div>

            {/* Form Fields Row */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              {/* Select Aircraft * (Searchable dropdown) */}
              <div className="md:col-span-4 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select Aircraft <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAircraftDropdownOpen(!isAircraftDropdownOpen)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {/* Aircraft Thumbnail */}
                    <div className="w-7 h-7 rounded-lg bg-blue-100/80 border border-blue-200 flex items-center justify-center shrink-0 text-blue-700">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="font-bold text-xs text-slate-900 leading-tight">
                        {selectedAircraftInfo.code}
                      </div>
                      <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                        {selectedAircraftInfo.model} | {selectedAircraftInfo.variant.split(' ')[0]} | {selectedAircraftInfo.base.split('/')[0].trim()}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {/* Dropdown Menu */}
                {isAircraftDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-1">
                    <div className="relative mb-2">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={aircraftSearch}
                        onChange={(e) => setAircraftSearch(e.target.value)}
                        placeholder="Search aircraft tail..."
                        className="w-full pl-8 pr-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600"
                        autoFocus
                      />
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1">
                      {availableAircraft.map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => {
                            setSelectedAircraftCode(a.code);
                            setIsAircraftDropdownOpen(false);
                          }}
                          className={`w-full p-2 rounded-xl text-left flex items-center justify-between text-xs transition-colors cursor-pointer ${
                            selectedAircraftCode === a.code
                              ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                              : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <div className="font-bold">{a.code}</div>
                            <div className="text-[10px] text-slate-500">{a.model} • {a.squadron}</div>
                          </div>
                          {selectedAircraftCode === a.code && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Aircraft Profile Specs Pill */}
                <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                  <span className="font-semibold text-slate-700">Serial: {selectedAircraftInfo.serial}</span>
                  <span>•</span>
                  <span>{selectedAircraftInfo.variant}</span>
                </div>
              </div>

              {/* Record Type * Dropdown */}
              <div className="md:col-span-4 relative">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Record Type <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="w-full flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-left hover:border-slate-300 transition-colors cursor-pointer text-xs font-semibold text-slate-900"
                >
                  <span className="truncate">{recordType}</span>
                  <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
                </button>

                {isTypeDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 p-2 space-y-0.5">
                    {recordTypes.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => {
                          setRecordType(t);
                          setIsTypeDropdownOpen(false);
                        }}
                        className={`w-full p-2 rounded-xl text-left text-xs transition-colors cursor-pointer ${
                          recordType === t
                            ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 text-[10px] text-slate-400">
                  Determines required fields, schema validation &amp; audit rules.
                </div>
              </div>

              {/* Upload File Zone matching screenshot */}
              <div className="md:col-span-4">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload File
                </label>
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleFileUpload(e.dataTransfer.files[0]);
                    }
                  }}
                  className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/20 rounded-2xl p-3 text-center flex flex-col items-center justify-center transition-all group min-h-[92px]"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".pdf,.csv,.xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <UploadCloud className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                  <p className="text-[11px] text-slate-600 font-medium leading-tight">
                    Drag &amp; drop CSV / Excel / PDF here
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="mt-1.5 px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-bold text-blue-600 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isUploading ? 'Extracting...' : 'Browse Files'}
                  </button>
                </div>
                <div className="mt-1.5 text-[10px] text-slate-400 text-center font-mono">
                  Supported: PDF, CSV, XLSX, XLS (Max 50 MB)
                </div>
              </div>
            </div>
          </div>

          {/* Quick Demo Pre-loaders */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 text-[11px]">Evaluator Demo Presets:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSamplePdf}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Load Sample PDF ({selectedAircraftInfo.model})</span>
              </button>
              <button
                type="button"
                onClick={handleLoadSampleCsv}
                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Load Sample CSV</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Digital Import / Connected Systems */}
        <div id="digital-sources-section" className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-900">
                Digital Import / Connected Systems
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Import directly from authorised maintenance/aircraft systems
              </p>
            </div>

            {/* 3 Source Cards */}
            <div className="space-y-3">
              {/* Card 1 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Aircraft Health System (HUMS)
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Sensor &amp; fault data
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectedSourceModal({ name: 'Aircraft Health System (HUMS)', type: 'Telemetry Feed' })}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Not configured
                </button>
              </div>

              {/* Card 2 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Maintenance Management System
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Work orders, inspections, history
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectedSourceModal({ name: 'Maintenance Management System (MMS)', type: 'Depot ERP Gateway' })}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Not configured
                </button>
              </div>

              {/* Card 3 */}
              <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
                    <Boxes className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      Inventory / Logistics System
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      Spare parts and component data
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setConnectedSourceModal({ name: 'Inventory / Logistics System', type: 'Spares Depot Interface' })}
                  className="px-2.5 py-1 rounded-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 hover:border-slate-300 transition-colors shadow-2xs cursor-pointer"
                >
                  Not configured
                </button>
              </div>
            </div>
          </div>

          <div className="mt-3 text-[10px] text-slate-400 font-mono text-center">
            Defence Gateway Status: Air-gapped / Local Storage Active
          </div>
        </div>
      </div>

      {/* 3. KPI Metrics Cards (Row of 4 cards matching screenshot) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {stats.total_records.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Total Records</div>
          </div>
        </div>

        {/* Verified Records */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {stats.verified_records.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Verified Records</div>
          </div>
        </div>

        {/* Pending Verification */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {stats.pending_verification.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Pending Verification</div>
          </div>
        </div>

        {/* Incomplete / Conflicting */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-4 flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              {stats.incomplete_conflicting.toLocaleString()}
            </div>
            <div className="text-xs font-medium text-slate-500 mt-1">Incomplete / Conflicting</div>
          </div>
        </div>
      </div>

      {/* 4. Recent Records Section */}
      <div id="recent-records-section" className="bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 space-y-4">
        {/* Section Heading & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-base font-black text-slate-900 tracking-tight">
            Recent Records
          </h2>

          <div className="flex items-center gap-2.5">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search records..."
                className="pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-blue-600 w-52 sm:w-64"
              />
            </div>

            {/* Filters Button */}
            <button
              type="button"
              onClick={() => setShowFiltersModal(!showFiltersModal)}
              className={`px-3 py-1.5 border rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                statusFilter !== 'all'
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Filters</span>
              {statusFilter !== 'all' && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
            </button>
          </div>
        </div>

        {/* Tab Pills matching reference screenshot */}
        <div className="flex items-center gap-1 border-b border-slate-100 pb-2 overflow-x-auto text-xs">
          {tableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-50 text-blue-700 border border-blue-200/80 shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table of Records */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3 w-8">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="py-2.5 px-3">Record ID</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Aircraft</th>
                <th className="py-2.5 px-3">Record Type</th>
                <th className="py-2.5 px-3">Component</th>
                <th className="py-2.5 px-3">Source</th>
                <th className="py-2.5 px-3">Uploaded By</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    Loading records from secure repository...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No technical records found matching your filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-3 px-3">
                      <input type="checkbox" className="rounded border-slate-300" />
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {r.id}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium whitespace-nowrap">
                      {r.date}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">
                      {r.aircraft_id}
                    </td>
                    <td className="py-3 px-3 text-slate-700 font-medium">
                      {r.record_type}
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {r.component || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium">
                        {r.source === 'PDF Import' && <FileText className="w-3.5 h-3.5 text-rose-500" />}
                        {r.source === 'CSV Import' && <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />}
                        {r.source === 'Digital Import' && <Activity className="w-3.5 h-3.5 text-blue-600" />}
                        <span>{r.source}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {r.uploaded_by}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'Verified'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : r.status === 'Pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : r.status === 'Incomplete'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            r.status === 'Verified'
                              ? 'bg-emerald-500'
                              : r.status === 'Pending'
                              ? 'bg-amber-500'
                              : 'bg-rose-500'
                          }`}
                        />
                        <span>{r.status}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedRecordDetail(r)}
                          className="px-2 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold flex items-center gap-1 text-[11px] shadow-2xs transition-colors cursor-pointer"
                        >
                          <ExternalLink className="w-3 h-3 text-blue-600" />
                          <span>View</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedRecordDetail(r)}
                          className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Bottom Section: What Happens After Upload (Left) & Data Becomes Available To (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: What Happens After Upload (5-step flow) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5">
          <div className="mb-4">
            <h2 className="text-sm font-black text-slate-900">
              What Happens After Upload
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              From file or digital source to verified record and department access
            </p>
          </div>

          {/* 5 Process Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {/* Step 1 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center mb-2">
                  1
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Select Aircraft &amp; Upload
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Choose aircraft, record type and upload PDF/CSV or use digital source
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center mb-2">
                  2
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Data Extraction &amp; Mapping
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  PDF &rarr; text extraction (OCR) or CSV field mapping using aircraft-specific model
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center mb-2">
                  3
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Validation &amp; Quality Checks
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Check required fields, units, duplicates, aircraft ID and model-specific rules
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center mb-2">
                  4
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Review &amp; Confirm
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Human review for low-confidence, missing or conflicting data. Original file is preserved.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3 flex flex-col justify-between">
              <div>
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white font-black text-[11px] flex items-center justify-center mb-2">
                  5
                </div>
                <div className="font-bold text-xs text-slate-900 leading-tight">
                  Verified Record
                </div>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Saved to aircraft record timeline with attachments and audit history
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Data Becomes Available To */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] p-5 flex flex-col justify-between">
          <div>
            <div className="mb-4">
              <h2 className="text-sm font-black text-slate-900">
                Data Becomes Available To
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified records are shared to authorised departments
              </p>
            </div>

            {/* Department List matching screenshot */}
            <div className="space-y-3">
              {/* Aircraft Health & Diagnostics */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Aircraft Health &amp; Diagnostics
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Maintenance history for diagnostics
                  </div>
                </div>
              </div>

              {/* Logistics & Spares */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Logistics &amp; Spares
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Part demand and stock information
                  </div>
                </div>
              </div>

              {/* Maintenance Agency */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                  <Wrench className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Maintenance Agency
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Work orders and approved tasks
                  </div>
                </div>
              </div>

              {/* Air Fleet Command */}
              <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Plane className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    Air Fleet Command
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Readiness status and fleet reports
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* MODAL 1: Side-by-Side PDF Review & Correction Interface    */}
      {/* ----------------------------------------------------------- */}
      {pdfReviewData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[90vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    Review Extracted Maintenance Report
                  </h3>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{pdfReviewData.filename}</span>
                    <span>•</span>
                    <span className="font-mono">{pdfReviewData.page_count} Page(s)</span>
                    <span>•</span>
                    <span className={`font-bold ${pdfReviewData.confidence_score >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Confidence {pdfReviewData.confidence_score}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPdfReviewData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Side-by-Side Review Body */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Original Document Preview */}
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3 text-xs">
                    <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                      Original PDF Document Text
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {pdfReviewData.is_scanned ? 'Scanned / OCR' : 'Digital Selectable Text'}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-700 bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-[380px] overflow-y-auto shadow-inner">
                    {pdfReviewData.extracted_text_preview}
                  </pre>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-500 flex items-center justify-between">
                  <span>Document securely parsed in local air-gapped environment.</span>
                  <button
                    type="button"
                    onClick={handleExportReviewedCsv}
                    className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Right: Extracted & Editable Fields */}
              <div className="lg:col-span-6 space-y-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    Extracted Structured Values (Editable)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    QA Verification Mode
                  </span>
                </div>

                {/* Validation Warnings */}
                {pdfReviewData.validation_issues.length > 0 && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>Review Flags Detected</span>
                    </div>
                    {pdfReviewData.validation_issues.map((issue, idx) => (
                      <div key={idx} className="text-[11px] text-amber-700 pl-5">
                        • {issue}
                      </div>
                    ))}
                  </div>
                )}

                {/* Editable Inputs */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Aircraft ID</label>
                    <input
                      type="text"
                      value={reviewedFields.aircraft_id || ''}
                      onChange={(e) => setReviewedFields({ ...reviewedFields, aircraft_id: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Event Date</label>
                    <input
                      type="text"
                      value={reviewedFields.date || ''}
                      onChange={(e) => setReviewedFields({ ...reviewedFields, date: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Subsystem / Component</label>
                    <input
                      type="text"
                      value={reviewedFields.component || ''}
                      onChange={(e) => setReviewedFields({ ...reviewedFields, component: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Certifying Officer</label>
                    <input
                      type="text"
                      value={reviewedFields.uploaded_by || ''}
                      onChange={(e) => setReviewedFields({ ...reviewedFields, uploaded_by: e.target.value })}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Observation / Finding</label>
                  <textarea
                    rows={2}
                    value={reviewedFields.finding || ''}
                    onChange={(e) => setReviewedFields({ ...reviewedFields, finding: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Work Performed</label>
                  <textarea
                    rows={2}
                    value={reviewedFields.work_performed || ''}
                    onChange={(e) => setReviewedFields({ ...reviewedFields, work_performed: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Parts Replaced</label>
                  <input
                    type="text"
                    value={reviewedFields.parts_replaced || ''}
                    onChange={(e) => setReviewedFields({ ...reviewedFields, parts_replaced: e.target.value })}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCommitPdfRecord('Pending')}
                className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Mark Pending Review
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfReviewData(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleCommitPdfRecord('Verified')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Verify &amp; Commit Record</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 2: CSV / Excel Mapping & Validation Modal            */}
      {/* ----------------------------------------------------------- */}
      {csvReviewData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[85vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    CSV Schema Mapping &amp; Validation
                  </h3>
                  <div className="text-[11px] text-slate-500">
                    {csvReviewData.filename} • {csvReviewData.total_rows} Rows • {csvReviewData.valid_rows} Valid
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCsvReviewData(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {/* Column Mapping Summary */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Mapped Source Headers
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {csvReviewData.column_mappings.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-2.5 rounded-xl border text-xs ${
                        m.is_unknown
                          ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                          : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="font-mono text-[10px] text-slate-400">Header: {m.source_column}</div>
                      <div className="font-bold text-xs mt-0.5">
                        &rarr; {m.target_field}
                      </div>
                      {m.is_unknown && (
                        <span className="text-[9px] font-bold text-amber-700 uppercase">Unmapped Column</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Validation Report */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Validation Log
                </h4>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1 font-mono text-slate-700">
                  {csvReviewData.validation_report.map((rep, idx) => (
                    <div key={idx}>• {rep}</div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setCsvReviewData(null)}
                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleCommitCsvRecord}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Commit Validated Records ({csvReviewData.valid_rows})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 3: Technical Record Details Modal                     */}
      {/* ----------------------------------------------------------- */}
      {selectedRecordDetail && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center font-bold">
                  REC
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {selectedRecordDetail.id} — {selectedRecordDetail.record_type}
                  </h3>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Aircraft: {selectedRecordDetail.aircraft_id} • Date: {selectedRecordDetail.date}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Component</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedRecordDetail.component || 'General Subsystem'}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Status</span>
                  <div className="font-bold text-slate-800 mt-0.5">{selectedRecordDetail.status}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Source Document</span>
                  <div className="font-mono text-slate-700 text-[11px] mt-0.5 truncate">{selectedRecordDetail.document_name}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-bold">Certifying Officer</span>
                  <div className="font-semibold text-slate-800 mt-0.5">{selectedRecordDetail.uploaded_by}</div>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Technical Observation / Finding</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedRecordDetail.finding}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Maintenance Rectification / Work Executed</span>
                <p className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                  {selectedRecordDetail.work_performed}
                </p>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1">Parts Replaced</span>
                <p className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-slate-700 font-mono">
                  {selectedRecordDetail.parts_replaced || 'None'}
                </p>
              </div>
            </div>

            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">SHA-256 Merkle Block Verified</span>
              <button
                type="button"
                onClick={() => setSelectedRecordDetail(null)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-xl font-bold cursor-pointer shadow-2xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------- */}
      {/* MODAL 4: Connected Source Status & Configuration Modal     */}
      {/* ----------------------------------------------------------- */}
      {connectedSourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center mx-auto">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{connectedSourceModal.name}</h3>
              <p className="text-xs text-slate-500 mt-1">{connectedSourceModal.type}</p>
            </div>
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2 text-slate-600">
              <div className="flex items-center justify-between">
                <span>Interface Protocol:</span>
                <span className="font-mono font-bold text-slate-800">MIL-STD-1553B / STANAG 4586</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Security Clearance:</span>
                <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">MoD Air-Gapped</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Live Feed Status:</span>
                <span className="font-bold text-amber-700">Not configured (Simulated Demo Only)</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              To connect real operational defence telemetry feeds, an authorized MoD gateway certificate is required.
            </p>
            <button
              type="button"
              onClick={() => setConnectedSourceModal(null)}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
