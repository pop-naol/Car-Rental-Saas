'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { DollarSign, TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/store/auth'

interface Invoice {
  id: string
  invoice_number: string
  total_amount: number
  tax_amount: number
  payment_status: string
  payment_method?: string | null
  created_at: string
}

interface Expense {
  id: string
  type: string
  amount: number
  description: string | null
  date: string
}

interface Transaction {
  id: string
  date: string
  source: 'REVENUE' | 'EXPENSE' | 'INVOICE'
  type: string
  direction: 'IN' | 'OUT'
  amount: number
  description: string
}

export default function FinancialPage() {
  const router = useRouter()
  const { user } = useAuthStore()
  const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'COMPANY_MANAGER'

  const [isLoading, setIsLoading] = useState(true)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])

  const [expenseType, setExpenseType] = useState('MAINTENANCE')
  const [expenseAmount, setExpenseAmount] = useState('')
  const [expenseDescription, setExpenseDescription] = useState('')
  const [isSavingExpense, setIsSavingExpense] = useState(false)

  useEffect(() => {
    if (user && !isAdmin) {
      router.push('/dashboard')
      return
    }
    if (isAdmin) {
      loadFinancialData()
    }
  }, [user, isAdmin, router])

  const loadFinancialData = async () => {
    try {
      const [invoiceData, expenseData, transactionData] = await Promise.all([
        api.get<{ invoices: Invoice[] }>('/financial/invoices'),
        api.get<{ expenses: Expense[] }>('/financial/expenses'),
        api.get<{ transactions: Transaction[] }>('/financial/transactions'),
      ])
      setInvoices(invoiceData.invoices)
      setExpenses(expenseData.expenses)
      setTransactions(transactionData.transactions)
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to load financial data')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateExpense = async () => {
    const amount = Number(expenseAmount)
    if (!amount || amount <= 0) {
      toast.error('Enter a valid expense amount')
      return
    }

    const companyId = user?.companyId || '00000000-0000-0000-0000-000000000001'
    setIsSavingExpense(true)
    try {
      await api.post('/financial/expenses', {
        companyId,
        amount,
        type: expenseType,
        description: expenseDescription || `${expenseType} expense`,
        date: new Date().toISOString(),
      })
      toast.success('Expense recorded')
      setExpenseAmount('')
      setExpenseDescription('')
      await loadFinancialData()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to create expense')
    } finally {
      setIsSavingExpense(false)
    }
  }

  const totals = useMemo(() => {
    const totalRevenue = transactions
      .filter((item) => item.direction === 'IN')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    const totalExpenses = transactions
      .filter((item) => item.direction === 'OUT')
      .reduce((sum, item) => sum + Number(item.amount), 0)
    return {
      totalRevenue,
      totalExpenses,
      net: totalRevenue - totalExpenses,
    }
  }, [transactions])

  if (!isAdmin && !isLoading) return null

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial</h1>
        <p className="mt-2 text-sm text-gray-600">Admin financial control with full transaction history</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-green-100">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Revenue</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.totalRevenue)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-red-100">
              <TrendingDown className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Expenses</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.totalExpenses)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 rounded-lg bg-blue-100">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Net</p>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totals.net)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Expense</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select className="input" value={expenseType} onChange={(e) => setExpenseType(e.target.value)}>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="FUEL">Fuel</option>
            <option value="SALARY">Salary</option>
            <option value="INSURANCE">Insurance</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            className="input"
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount"
            value={expenseAmount}
            onChange={(e) => setExpenseAmount(e.target.value)}
          />
          <input
            className="input"
            type="text"
            placeholder="Description"
            value={expenseDescription}
            onChange={(e) => setExpenseDescription(e.target.value)}
          />
          <button className="btn btn-primary" onClick={handleCreateExpense} disabled={isSavingExpense}>
            {isSavingExpense ? 'Saving...' : 'Add Expense'}
          </button>
        </div>
      </div>

      <div className="card overflow-hidden">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Transactions</h2>
        <div className="overflow-x-auto overflow-y-auto max-h-[780px]">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(item.date)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.source}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.type}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">{item.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold">
                    <span className={item.direction === 'IN' ? 'text-green-700' : 'text-red-700'}>
                      {item.direction === 'IN' ? '+' : '-'}
                      {formatCurrency(item.amount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transactions.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No financial transactions yet</h3>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Invoices ({invoices.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invoices.slice(0, 10).map((invoice) => (
                  <tr key={invoice.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.invoice_number}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{invoice.payment_status}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(invoice.total_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Expenses ({expenses.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expenses.slice(0, 10).map((expense) => (
                  <tr key={expense.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{expense.description || '-'}</td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
