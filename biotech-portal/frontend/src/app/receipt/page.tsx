'use client';

import { useState } from 'react';
import { FileText, Search, Download, ChevronLeft, Loader2, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';

export default function ReceiptPage() {
  const [searchType, setSearchType] = useState('matric_number');
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [receipts, setReceipts] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!searchValue.trim()) {
      toast.error('Please enter a search value');
      return;
    }
    setLoading(true);
    setSearched(false);
    try {
      const res = await api.findReceipt({ search_type: searchType, search_value: searchValue.trim() });
      setReceipts(res.data.data || []);
      setSearched(true);
    } catch (err: any) {
      if (err.response?.status === 404) {
        setReceipts([]);
        setSearched(true);
      } else {
        toast.error(err.response?.data?.message || 'Search failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const searchLabels: Record<string, string> = {
    matric_number: 'Matric Number',
    receipt_number: 'Receipt Number',
    payment_reference: 'Payment Reference',
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary-700 text-white py-4 px-4">
        <div className="container mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-1 text-green-200 hover:text-white text-sm">
            <ChevronLeft size={16} /> Back
          </Link>
          <h1 className="font-heading font-bold text-lg">Receipt Recovery</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 max-w-xl">
        <div className="card mb-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Search className="text-amber-600" size={20} />
            </div>
            <div>
              <h2 className="font-heading font-bold text-gray-900">Find Your Receipt</h2>
              <p className="text-sm text-gray-500">Search using your matric number or receipt reference</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Search By</label>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(searchLabels).map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => { setSearchType(value); setSearchValue(''); }}
                    className={`text-xs font-medium px-3 py-2.5 rounded-lg border transition-all text-center ${
                      searchType === value ? 'bg-primary-700 text-white border-primary-700' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Enter {searchLabels[searchType]}</label>
              <div className="flex gap-2">
                <input
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="input flex-1"
                  placeholder={
                    searchType === 'matric_number' ? 'e.g. FUL/BTH/21/001' :
                    searchType === 'receipt_number' ? 'e.g. BTH-2024-000001' :
                    'e.g. BIOTECH-1234567-ABCD'
                  }
                />
                <button
                  onClick={handleSearch}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 px-5"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        {searched && (
          <div className="animate-fade-in">
            {receipts.length === 0 ? (
              <div className="card text-center py-10">
                <FileText className="text-gray-200 mx-auto mb-3" size={40} />
                <h3 className="font-semibold text-gray-500">No receipt found</h3>
                <p className="text-sm text-gray-400 mt-1">No payment record matches your search. Try a different search method.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500 font-medium">{receipts.length} receipt{receipts.length > 1 ? 's' : ''} found</p>
                {receipts.map((receipt) => (
                  <div key={receipt.id} className="card hover:shadow-card-hover transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                          <CheckCircle className="text-primary-700" size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-primary-700 text-sm">{receipt.receipt_number}</p>
                          <p className="text-xs text-gray-400">Verified Payment</p>
                        </div>
                      </div>
                      <span className="badge-success">Paid</span>
                    </div>

                    <div className="space-y-2 mb-4">
                      {[
                        ['Student Name', receipt.full_name],
                        ['Matric Number', receipt.matric_number],
                        ['Academic Session', receipt.academic_session],
                        ['Level', receipt.level],
                        ['Amount Paid', `₦${parseFloat(receipt.amount_paid).toLocaleString()}`],
                        ['Payment Date', new Date(receipt.issued_at).toLocaleDateString('en-NG', { dateStyle: 'medium' })],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-sm">
                          <span className="text-gray-500">{label}</span>
                          <span className="font-medium text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>

                    <a
                      href={api.downloadReceiptUrl(receipt.receipt_number)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
                    >
                      <Download size={15} />
                      Download Receipt PDF
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
