import { API_BASE_URL } from '../services/api';

/**
 * Utility to download CSV reports with JWT authentication and proper MIME handling.
 * Ensures downloaded files are always valid .csv format with UTF-8 encoding.
 */
export async function downloadCsvReport(type = 'income', customFilename = null) {
  const token = localStorage.getItem('ganpati_mandal_token');
  const url = `${API_BASE_URL}/reports/export/${type}${token ? `?token=${encodeURIComponent(token)}` : ''}`;
  
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Authorization': token ? `Bearer ${token}` : ''
    }
  });

  if (!response.ok) {
    let errorMsg = 'CSV डाऊनलोड अयशस्वी.';
    try {
      const errJson = await response.json();
      if (errJson.message) errorMsg = errJson.message;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  const filenameMap = {
    balance_sheet: 'ganpati_mandal_balance_sheet.csv',
    financial: 'ganpati_mandal_balance_sheet.csv',
    income: 'ganpati_mandal_income_transactions.csv',
    expenses: 'ganpati_mandal_expense_transactions.csv',
    donors: 'ganpati_mandal_donors_list.csv',
    members: 'ganpati_mandal_members_list.csv'
  };

  const filename = customFilename || filenameMap[type] || `ganpati_mandal_${type}_report.csv`;
  const blob = await response.blob();
  
  // Create an explicit text/csv blob URL
  const csvBlob = new Blob([blob], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = window.URL.createObjectURL(csvBlob);
  const anchor = document.createElement('a');
  anchor.href = downloadUrl;
  anchor.setAttribute('download', filename);
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  window.URL.revokeObjectURL(downloadUrl);
  return true;
}

export default downloadCsvReport;
