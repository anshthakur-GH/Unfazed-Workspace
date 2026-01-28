import React, { useState, useMemo } from 'react';
import { Plus, Search, FileText, Download, Trash2, Edit, Filter, ArrowUpRight, ArrowDownRight, IndianRupee, Copy } from 'lucide-react';
import { formatCurrency, formatDate } from './utils';
import { jsPDF } from 'jspdf'; // Ensure jsPacket is imported if needed, though mostly standard utils.

const InvoiceDashboard = ({ invoices, onCreateNew, onEdit, onDelete, onDuplicate, onDownloadPDF, onStatusChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // all, paid, unpaid

    // Calculate Statistics
    const stats = useMemo(() => {
        const total = invoices.length;
        let totalRevenue = 0;
        let pendingAmount = 0;
        let paidInvoices = 0;

        invoices.forEach(inv => {
            totalRevenue += inv.total;
            if (inv.status === 'paid') {
                paidInvoices++;
            } else {
                pendingAmount += inv.balanceDue;
            }
        });

        return {
            total,
            totalRevenue,
            pendingAmount,
            paidPercentage: total === 0 ? 0 : Math.round((paidInvoices / total) * 100)
        };
    }, [invoices]);

    // Filter Invoices
    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv => {
            const clientName = inv.clientName || inv.billTo?.name || '';
            const invoiceNum = inv.invoiceNumber ? inv.invoiceNumber.toString() : '';

            const matchesSearch = clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                invoiceNum.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0)); // Sort by date desc
    }, [invoices, searchTerm, statusFilter]);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Total Revenue</p>
                            <h3 className="text-2xl font-bold text-text mt-1">{formatCurrency(stats.totalRevenue)}</h3>
                        </div>
                        <div className="p-2 bg-accent/10 rounded-lg">
                            <IndianRupee className="w-5 h-5 text-accent" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Total Invoices</p>
                            <h3 className="text-2xl font-bold text-text mt-1">{stats.total}</h3>
                        </div>
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            <FileText className="w-5 h-5 text-blue-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Pending Amount</p>
                            <h3 className="text-2xl font-bold text-text mt-1">{formatCurrency(stats.pendingAmount)}</h3>
                        </div>
                        <div className="p-2 bg-orange-500/10 rounded-lg">
                            <ArrowUpRight className="w-5 h-5 text-orange-500" />
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-text-muted text-sm font-medium">Paid Ratio</p>
                            <h3 className="text-2xl font-bold text-text mt-1">{stats.paidPercentage}%</h3>
                        </div>
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <ArrowDownRight className="w-5 h-5 text-green-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative flex-1 md:flex-initial">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-text-muted w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Search client or invoice #"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full md:w-64 bg-background border border-border rounded-lg pl-9 pr-4 py-2 text-sm text-text focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
                        />
                    </div>
                    <div className="flex bg-background border border-border rounded-lg p-1">
                        <button
                            onClick={() => setStatusFilter('all')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'all' ? 'bg-accent text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
                        >
                            All
                        </button>
                        <button
                            onClick={() => setStatusFilter('paid')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'paid' ? 'bg-green-500 text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
                        >
                            Paid
                        </button>
                        <button
                            onClick={() => setStatusFilter('unpaid')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${statusFilter === 'unpaid' ? 'bg-orange-500 text-white shadow-sm' : 'text-text-muted hover:text-text'}`}
                        >
                            Unpaid
                        </button>
                    </div>
                </div>

                <button
                    onClick={onCreateNew}
                    className="flex items-center gap-2 bg-accent hover:bg-accent-hover text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-accent/20"
                >
                    <Plus className="w-4 h-4" />
                    Create Invoice
                </button>
            </div>

            {/* Invoices Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[800px] text-left border-collapse">
                        <thead>
                            <tr className="bg-background/50 border-b border-border">
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Invoice #</th>
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Client</th>
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Date</th>
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Amount</th>
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-semibold text-text-muted uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredInvoices.length > 0 ? (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-accent/5 transition-colors group">
                                        <td className="p-4 text-sm font-medium text-text">#{inv.invoiceNumber}</td>
                                        <td className="p-4 text-sm text-text">{inv.billTo?.name || 'Unknown Client'}</td>
                                        <td className="p-4 text-sm text-text-muted">{formatDate(inv.date)}</td>
                                        <td className="p-4 text-sm font-medium text-text">{formatCurrency(inv.total)}</td>
                                        <td className="p-4">
                                            <button
                                                onClick={() => onStatusChange && onStatusChange(inv.id, inv.status === 'paid' ? 'unpaid' : 'paid')}
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-colors hover:opacity-80 ${inv.status === 'paid'
                                                    ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                                                    : 'bg-orange-500/10 text-orange-500 border border-orange-500/20'
                                                    }`}
                                                title="Click to toggle status"
                                            >
                                                {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
                                            </button>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onDuplicate && onDuplicate(inv)}
                                                    className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
                                                    title="Duplicate"
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDownloadPDF(inv)}
                                                    className="p-1.5 text-text-muted hover:text-accent hover:bg-accent/10 rounded-md transition-colors"
                                                    title="Download PDF"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onEdit(inv)}
                                                    className="p-1.5 text-text-muted hover:text-blue-500 hover:bg-blue-500/10 rounded-md transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onDelete(inv.id)}
                                                    className="p-1.5 text-text-muted hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="p-12 text-center text-text-muted">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-background rounded-full">
                                                <FileText className="w-6 h-6 opacity-50" />
                                            </div>
                                            <p>No invoices found</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InvoiceDashboard;
