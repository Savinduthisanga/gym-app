import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useSettings } from '../../context/SettingsContext';

// ─── Shared helpers ───────────────────────────────────────────────────────────

const todayStr = () => new Date().toISOString().split('T')[0];

function paymentStatus(p) {
  if (p.isPaid) return 'Paid';
  return p.dueDate < todayStr() ? 'Overdue' : 'Pending';
}

function getLast12Months() {
  const now = new Date();
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    return { key, label };
  });
}

// ─── PDF header builder ───────────────────────────────────────────────────────

function addPDFHeader(doc, gymName, gymLogo, reportTitle) {
  let textX = 14;
  if (gymLogo) {
    try {
      const fmt = /\/(jpe?g)/.test(gymLogo) ? 'JPEG' : 'PNG';
      doc.addImage(gymLogo, fmt, 14, 12, 18, 18);
      textX = 36;
    } catch { /* skip on error */ }
  }
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20);
  doc.text(gymName || 'GymPro', textX, 20);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120);
  doc.text(reportTitle, textX, 27);

  doc.setDrawColor(200);
  doc.line(14, 34, doc.internal.pageSize.width - 14, 34);

  doc.setFontSize(8);
  doc.text(
    `Generated: ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}`,
    14, 40
  );
  return 47;
}

// ─── Print window helper ──────────────────────────────────────────────────────

function openPrintWindow(gymName, gymLogo, title, bodyHTML) {
  const logoEl = gymLogo
    ? `<img src="${gymLogo}" style="width:44px;height:44px;object-fit:cover;border-radius:8px"/>`
    : `<span style="font-size:28px">💪</span>`;

  const w = window.open('', '_blank', 'width=960,height=720');
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${title}</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:system-ui,-apple-system,sans-serif;font-size:13px;color:#111;padding:28px;max-width:960px}
    .hdr{display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:3px solid #f97316;margin-bottom:14px}
    .hdr h1{font-size:20px;font-weight:700;color:#111}
    .hdr p{color:#888;font-size:11px;margin-top:2px}
    .meta{color:#aaa;font-size:10px;margin-bottom:18px}
    .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:12px;margin-bottom:20px}
    .card{background:#fff8f0;border:1px solid #fed7aa;border-radius:8px;padding:12px}
    .card .val{font-size:22px;font-weight:700;color:#f97316}
    .card .lbl{font-size:10px;color:#999;margin-top:2px}
    h2{font-size:13px;font-weight:600;margin:20px 0 8px;color:#444;border-bottom:1px solid #eee;padding-bottom:4px}
    table{width:100%;border-collapse:collapse;margin-top:8px}
    th{background:#f97316;color:#fff;padding:7px 10px;text-align:left;font-size:10px;font-weight:600;letter-spacing:.3px}
    td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:11px}
    tr:nth-child(even) td{background:#fafafa}
    .badge{display:inline-block;padding:2px 7px;border-radius:999px;font-size:10px;font-weight:600}
    .g{background:#dcfce7;color:#166534}
    .y{background:#fef9c3;color:#854d0e}
    .r{background:#fee2e2;color:#991b1b}
    .print-btn{display:inline-flex;align-items:center;gap:6px;background:#f97316;color:#fff;border:none;padding:9px 22px;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;margin-top:24px}
    @media print{.print-btn{display:none}}
  </style></head><body>
  <div class="hdr">${logoEl}<div><h1>${gymName || 'GymPro'}</h1><p>${title}</p></div></div>
  <p class="meta">Generated ${new Date().toLocaleDateString('en-US', { dateStyle: 'long' })} · ${new Date().toLocaleTimeString()}</p>
  ${bodyHTML}
  <button class="print-btn" onclick="window.print()">🖨️ Print</button>
  </body></html>`);
  w.document.close();
  w.focus();
}

// ─── ExportCard UI ────────────────────────────────────────────────────────────

function ExportCard({ icon, iconBg, title, description, items, btnLabel = 'Export', btnColor, onExport, loading }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col">
      <div className={`w-10 h-10 ${iconBg} rounded-xl flex items-center justify-center text-xl mb-3 flex-shrink-0`}>
        {icon}
      </div>
      <h3 className="text-white font-semibold text-sm mb-1">{title}</h3>
      <p className="text-gray-500 text-xs mb-2 leading-relaxed">{description}</p>
      <ul className="text-gray-600 text-xs space-y-0.5 mb-4 flex-1">
        {items.map(i => <li key={i} className="flex items-start gap-1"><span className="text-gray-700 mt-0.5">·</span>{i}</li>)}
      </ul>
      <button
        onClick={onExport}
        disabled={loading}
        className={`w-full py-2 rounded-xl text-xs font-semibold transition disabled:opacity-40 ${
          btnColor || 'bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white'
        }`}
      >
        {loading ? 'Exporting…' : btnLabel}
      </button>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ icon, iconBg, title, subtitle }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className={`w-9 h-9 ${iconBg} rounded-xl flex items-center justify-center text-lg flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <h2 className="text-white font-semibold">{title}</h2>
        <p className="text-gray-500 text-xs">{subtitle}</p>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ExportData() {
  const { settings } = useSettings();
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const withLoading = (key, fn) => {
    setLoading(p => ({ ...p, [key]: true }));
    try { fn(); } finally { setLoading(p => ({ ...p, [key]: false })); }
  };

  // ── PDF exports ─────────────────────────────────────────────────────────────

  const exportMembersPDF = () => withLoading('membersPDF', () => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    if (!members.length) { showToast('No member data to export.', 'error'); return; }
    const doc = new jsPDF();
    const startY = addPDFHeader(doc, settings.gymName, settings.gymLogo, 'Members List');
    autoTable(doc, {
      startY,
      head: [['Name', 'Email', 'Phone', 'Membership', 'Join Date']],
      body: members.map(m => [m.name, m.email, m.phone, m.membershipType, m.joinDate]),
      headStyles: { fillColor: [249, 115, 22], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
    });
    doc.save(`${settings.gymName || 'gym'}-members.pdf`);
    showToast('Members PDF downloaded.');
  });

  const exportPaymentsPDF = () => withLoading('paymentsPDF', () => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    if (!payments.length) { showToast('No payment data to export.', 'error'); return; }
    const doc = new jsPDF({ orientation: 'landscape' });
    const startY = addPDFHeader(doc, settings.gymName, settings.gymLogo, 'Payment History');
    autoTable(doc, {
      startY,
      head: [['Member', 'Amount', 'Method', 'Payment Date', 'Due Date', 'Status']],
      body: payments.map(p => [
        p.memberName,
        `$${Number(p.amount).toFixed(2)}`,
        p.paymentMethod || 'Cash',
        p.paymentDate,
        p.dueDate,
        paymentStatus(p),
      ]),
      headStyles: { fillColor: [249, 115, 22], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 1: { halign: 'right' } },
      didDrawCell: (data) => {
        if (data.section === 'body' && data.column.index === 5) {
          const status = data.cell.raw;
          const color = status === 'Paid' ? [22, 163, 74]
            : status === 'Overdue' ? [220, 38, 38]
            : [202, 138, 4];
          data.doc.setTextColor(...color);
          data.doc.setFontSize(8.5);
          data.doc.text(status, data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
          data.doc.setTextColor(0);
          return false;
        }
      },
    });
    doc.save(`${settings.gymName || 'gym'}-payments.pdf`);
    showToast('Payments PDF downloaded.');
  });

  const exportWorkoutsPDF = () => withLoading('workoutsPDF', () => {
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');
    if (!workouts.length) { showToast('No workout data to export.', 'error'); return; }
    const doc = new jsPDF();
    const startY = addPDFHeader(doc, settings.gymName, settings.gymLogo, 'Workout History');
    autoTable(doc, {
      startY,
      head: [['Exercise', 'Sets', 'Reps', 'Weight (kg)', 'Volume (kg)', 'Date']],
      body: workouts.map(w => [
        w.exercise, w.sets, w.reps, w.weight,
        (w.sets * w.reps * w.weight).toLocaleString(),
        w.date,
      ]),
      headStyles: { fillColor: [249, 115, 22], fontSize: 9, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8.5 },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      columnStyles: { 0: { cellWidth: 50 }, 4: { halign: 'right' } },
    });
    doc.save(`${settings.gymName || 'gym'}-workouts.pdf`);
    showToast('Workouts PDF downloaded.');
  });

  // ── Excel exports ─────────────────────────────────────────────────────────────

  const exportMembersExcel = () => withLoading('membersXLSX', () => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    if (!members.length) { showToast('No member data to export.', 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(members.map(m => ({
      'Name': m.name, 'Email': m.email, 'Phone': m.phone,
      'Membership Type': m.membershipType, 'Join Date': m.joinDate,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Members');
    XLSX.writeFile(wb, `${settings.gymName || 'gym'}-members.xlsx`);
    showToast('Members spreadsheet downloaded.');
  });

  const exportPaymentsExcel = () => withLoading('paymentsXLSX', () => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    if (!payments.length) { showToast('No payment data to export.', 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(payments.map(p => ({
      'Member Name': p.memberName,
      'Amount ($)': Number(p.amount).toFixed(2),
      'Method': p.paymentMethod || 'Cash',
      'Payment Date': p.paymentDate,
      'Due Date': p.dueDate,
      'Status': paymentStatus(p),
      'Membership': p.membershipType,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Payments');
    XLSX.writeFile(wb, `${settings.gymName || 'gym'}-payments.xlsx`);
    showToast('Payments spreadsheet downloaded.');
  });

  const exportWorkoutsExcel = () => withLoading('workoutsXLSX', () => {
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');
    if (!workouts.length) { showToast('No workout data to export.', 'error'); return; }
    const ws = XLSX.utils.json_to_sheet(workouts.map(w => ({
      'Exercise': w.exercise,
      'Sets': Number(w.sets),
      'Reps': Number(w.reps),
      'Weight (kg)': Number(w.weight),
      'Volume (kg)': w.sets * w.reps * w.weight,
      'Date': w.date,
    })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Workouts');
    XLSX.writeFile(wb, `${settings.gymName || 'gym'}-workouts.xlsx`);
    showToast('Workouts spreadsheet downloaded.');
  });

  // ── Print reports ─────────────────────────────────────────────────────────────

  const printMonthlyRevenue = () => {
    const payments = JSON.parse(localStorage.getItem('gym_payments') || '[]');
    const paid = payments.filter(p => p.isPaid);
    const totalRevenue = paid.reduce((s, p) => s + Number(p.amount || 0), 0);
    const pendingCount = payments.filter(p => !p.isPaid && p.dueDate >= todayStr()).length;
    const overdueCount = payments.filter(p => !p.isPaid && p.dueDate < todayStr()).length;

    const monthlyRows = getLast12Months().map(({ key, label }) => {
      const mp = paid.filter(p => p.paymentDate?.slice(0, 7) === key);
      const rev = mp.reduce((s, p) => s + Number(p.amount || 0), 0);
      return `<tr><td>${label}</td><td style="text-align:center">${mp.length}</td><td style="text-align:right;font-weight:600">$${rev.toFixed(2)}</td></tr>`;
    }).join('');

    const methodRows = ['Cash', 'Card', 'Bank Transfer'].map(m => {
      const total = paid.filter(p => p.paymentMethod === m).reduce((s, p) => s + Number(p.amount || 0), 0);
      return total > 0 ? `<tr><td>${m}</td><td style="text-align:right;font-weight:600">$${total.toFixed(2)}</td></tr>` : '';
    }).join('');

    openPrintWindow(settings.gymName, settings.gymLogo, 'Monthly Revenue Report', `
      <div class="cards">
        <div class="card"><div class="val">$${totalRevenue.toFixed(2)}</div><div class="lbl">Total Revenue</div></div>
        <div class="card"><div class="val">${paid.length}</div><div class="lbl">Paid Payments</div></div>
        <div class="card"><div class="val">${pendingCount}</div><div class="lbl">Pending</div></div>
        <div class="card"><div class="val">${overdueCount}</div><div class="lbl">Overdue</div></div>
      </div>
      <h2>Monthly Breakdown (Last 12 Months)</h2>
      <table><thead><tr><th>Month</th><th style="text-align:center">Payments</th><th style="text-align:right">Revenue</th></tr></thead>
      <tbody>${monthlyRows}</tbody>
      <tfoot><tr style="font-weight:700;background:#fff8f0"><td>Total</td><td style="text-align:center">${paid.length}</td><td style="text-align:right">$${totalRevenue.toFixed(2)}</td></tr></tfoot>
      </table>
      ${methodRows ? `<h2>By Payment Method</h2><table><thead><tr><th>Method</th><th style="text-align:right">Total Collected</th></tr></thead><tbody>${methodRows}</tbody></table>` : ''}
    `);
    showToast('Print window opened.');
  };

  const printMemberList = () => {
    const members = JSON.parse(localStorage.getItem('gym_members') || '[]');
    if (!members.length) { showToast('No member data to print.', 'error'); return; }

    const byType = ['Basic', 'Standard', 'Premium', 'VIP'].map(t => {
      const c = members.filter(m => m.membershipType === t).length;
      return c > 0 ? `<div class="card"><div class="val">${c}</div><div class="lbl">${t}</div></div>` : '';
    }).join('');

    const rows = members.map(m =>
      `<tr><td>${m.name}</td><td>${m.email}</td><td>${m.phone}</td><td>${m.membershipType}</td><td>${m.joinDate}</td></tr>`
    ).join('');

    openPrintWindow(settings.gymName, settings.gymLogo, 'Member List', `
      <div class="cards">
        <div class="card"><div class="val">${members.length}</div><div class="lbl">Total Members</div></div>
        ${byType}
      </div>
      <h2>All Members</h2>
      <table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Membership</th><th>Join Date</th></tr></thead>
      <tbody>${rows}</tbody></table>
    `);
    showToast('Print window opened.');
  };

  const printWorkoutReport = () => {
    const workouts = JSON.parse(localStorage.getItem('gym_workouts') || '[]');
    if (!workouts.length) { showToast('No workout data to print.', 'error'); return; }

    const totalVolume = workouts.reduce((s, w) => s + w.sets * w.reps * w.weight, 0);
    const thisWeek = workouts.filter(w => (new Date() - new Date(w.date)) < 7 * 86400000).length;

    const rows = [...workouts].reverse().map(w =>
      `<tr>
        <td>${w.exercise}</td>
        <td style="text-align:center">${w.sets}</td>
        <td style="text-align:center">${w.reps}</td>
        <td style="text-align:right">${w.weight} kg</td>
        <td style="text-align:right;font-weight:600">${(w.sets * w.reps * w.weight).toLocaleString()} kg</td>
        <td>${w.date}</td>
      </tr>`
    ).join('');

    openPrintWindow(settings.gymName, settings.gymLogo, 'Workout Report', `
      <div class="cards">
        <div class="card"><div class="val">${workouts.length}</div><div class="lbl">Total Sessions</div></div>
        <div class="card"><div class="val">${totalVolume.toLocaleString()} kg</div><div class="lbl">Total Volume</div></div>
        <div class="card"><div class="val">${thisWeek}</div><div class="lbl">This Week</div></div>
      </div>
      <h2>Workout History</h2>
      <table>
        <thead><tr><th>Exercise</th><th style="text-align:center">Sets</th><th style="text-align:center">Reps</th><th style="text-align:right">Weight</th><th style="text-align:right">Volume</th><th>Date</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `);
    showToast('Print window opened.');
  };

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Export Data</h1>
        <p className="text-gray-400 text-sm mt-0.5">Download your gym data as PDF, Excel, or print formatted reports</p>
      </div>

      {toast && (
        <div className={`border rounded-xl px-4 py-3 flex items-center gap-3 text-sm transition ${
          toast.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          <span className="text-lg flex-shrink-0">{toast.type === 'error' ? '❌' : '✅'}</span>
          {toast.message}
        </div>
      )}

      {/* PDF */}
      <section>
        <SectionHeader icon="📄" iconBg="bg-red-500/20" title="Export to PDF"
          subtitle="Printable PDFs with gym name and logo header" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ExportCard icon="👥" iconBg="bg-green-500/20" title="Members List"
            description="Full member directory as a formatted PDF document."
            items={['Name, email & phone', 'Membership type', 'Join date']}
            btnLabel="Download PDF" btnColor="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300"
            onExport={exportMembersPDF} loading={loading.membersPDF} />
          <ExportCard icon="💳" iconBg="bg-blue-500/20" title="Payment History"
            description="Complete payment records exported in landscape format."
            items={['Member name & amount', 'Payment method & dates', 'Colour-coded status']}
            btnLabel="Download PDF" btnColor="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300"
            onExport={exportPaymentsPDF} loading={loading.paymentsPDF} />
          <ExportCard icon="🏋️" iconBg="bg-purple-500/20" title="Workout History"
            description="All logged workout sessions with volume calculations."
            items={['Exercise name', 'Sets, reps & weight', 'Total volume per session']}
            btnLabel="Download PDF" btnColor="bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-400 hover:text-red-300"
            onExport={exportWorkoutsPDF} loading={loading.workoutsPDF} />
        </div>
      </section>

      {/* Excel */}
      <section>
        <SectionHeader icon="📊" iconBg="bg-green-500/20" title="Export to Excel"
          subtitle="Download as .xlsx — open in Excel, Google Sheets, or Numbers" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ExportCard icon="👥" iconBg="bg-green-500/20" title="Members List"
            description="Member data ready for spreadsheet analysis and filtering."
            items={['All member fields', 'Clean column headers', 'Ready to sort & filter']}
            btnLabel="Download .xlsx" btnColor="bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 hover:text-green-300"
            onExport={exportMembersExcel} loading={loading.membersXLSX} />
          <ExportCard icon="💳" iconBg="bg-blue-500/20" title="Payment History"
            description="Payment records with computed status and method columns."
            items={['Amount & payment method', 'Computed status column', 'Both dates included']}
            btnLabel="Download .xlsx" btnColor="bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 hover:text-green-300"
            onExport={exportPaymentsExcel} loading={loading.paymentsXLSX} />
          <ExportCard icon="🏋️" iconBg="bg-purple-500/20" title="Workout History"
            description="Workout sessions with pre-calculated volume column."
            items={['Sets, reps & weight', 'Volume pre-calculated', 'Sorted newest first']}
            btnLabel="Download .xlsx" btnColor="bg-green-500/15 hover:bg-green-500/25 border border-green-500/30 text-green-400 hover:text-green-300"
            onExport={exportWorkoutsExcel} loading={loading.workoutsXLSX} />
        </div>
      </section>

      {/* Print */}
      <section>
        <SectionHeader icon="🖨️" iconBg="bg-orange-500/20" title="Print Reports"
          subtitle="Opens a formatted print-ready page in a new window" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ExportCard icon="💰" iconBg="bg-emerald-500/20" title="Monthly Revenue"
            description="Revenue summary with 12-month breakdown and method totals."
            items={['Summary stat cards', '12-month revenue table', 'Payment method totals']}
            btnLabel="Open Print View" btnColor="bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 hover:text-orange-300"
            onExport={printMonthlyRevenue} loading={false} />
          <ExportCard icon="👥" iconBg="bg-green-500/20" title="Member List"
            description="Clean member directory with plan distribution summary."
            items={['Members by plan type', 'Full member table']}
            btnLabel="Open Print View" btnColor="bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 hover:text-orange-300"
            onExport={printMemberList} loading={false} />
          <ExportCard icon="🏋️" iconBg="bg-purple-500/20" title="Workout Report"
            description="Workout history with total volume and this-week stats."
            items={['Summary cards', 'Full history table', 'Sorted newest first']}
            btnLabel="Open Print View" btnColor="bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 text-orange-400 hover:text-orange-300"
            onExport={printWorkoutReport} loading={false} />
        </div>
      </section>
    </div>
  );
}
