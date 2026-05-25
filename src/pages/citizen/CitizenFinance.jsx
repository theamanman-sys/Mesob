import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, DollarSign, Wallet, PiggyBank, CheckCircle, Globe, Target, Plus, Minus, BadgeCheck, Hash, ArrowUp, ArrowDown, Landmark, Building2, Newspaper, BarChart3, Percent, Briefcase, LineChart, PieChart, ExternalLink, X, Bookmark, BookmarkCheck, ChevronRight, Minimize2, Unplug, RefreshCw } from 'lucide-react'
import { citizenService } from '../../services/citizenService'
import { useLanguage } from '../../context/LanguageContext'

function formatBirr(n) { if (!n) return '0'; if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`; return Number(n).toLocaleString() }

export default function CitizenFinance() {
  const { t } = useLanguage()
  const [citizen, setCitizen] = useState(null)
  const [economy, setEconomy] = useState(null)
  const [netWorth, setNetWorth] = useState(null)
  const [tin, setTin] = useState(null)
  const [tax, setTax] = useState(null)
  const [badge, setBadge] = useState(null)
  const [banks, setBanks] = useState([])
  const [news, setNews] = useState([])
  const [bankPortfolio, setBankPortfolio] = useState([])
  const [bankIframeUrl, setBankIframeUrl] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [tinInput, setTinInput] = useState('')
  const [savingTin, setSavingTin] = useState(false)
  const [tinMsg, setTinMsg] = useState('')
  const [nwForm, setNwForm] = useState({ netWorth: '', assets: '', liabilities: '' })
  const [savingNw, setSavingNw] = useState(false)
  const [allocForm, setAllocForm] = useState({ income: '100000', stocks: '30', bonds: '20', realEstate: '25', cash: '15', commodities: '10' })
  const [showConnectBank, setShowConnectBank] = useState(false)
  const [selectedBankId, setSelectedBankId] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [bankBalances, setBankBalances] = useState({})
  const [refreshingBalance, setRefreshingBalance] = useState(null)

  useEffect(() => {
    const session = citizenService.getSession()
    setCitizen(session)
    Promise.all([
      citizenService.getEconomyData(),
      citizenService.getNetWorth(),
      citizenService.getTin(),
      citizenService.getTaxRecords(),
      citizenService.getBadge(),
      citizenService.getBanks(),
      citizenService.getBusinessNews(),
      citizenService.getBankPortfolio().catch(() => [])
    ]).then(([e, n, t, tx, b, bk, nw, bp]) => {
      setEconomy(e || {}); setNetWorth(n || {}); setTin(t || {}); setTax(tx || { records: [] }); setBadge(b || {}); setBanks(bk || []); setNews(nw || []); setBankPortfolio(bp || [])
      setTinInput(t?.tinNumber || '')
      setNwForm({ netWorth: n?.netWorth || '', assets: JSON.stringify(n?.assets || []), liabilities: JSON.stringify(n?.liabilities || []) })
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleTinSubmit = async () => {
    if (!tinInput || tinInput.length < 5) return
    setSavingTin(true); setTinMsg('')
    try { const res = await citizenService.updateTin(tinInput); setTin(res); setTinMsg(res.tinNumber ? 'TIN registered successfully!' : 'Invalid TIN number') } catch (e) { setTinMsg('Failed to register TIN') }
    setSavingTin(false)
  }

  const handleNwSubmit = async () => {
    setSavingNw(true)
    try { const nw = parseFloat(nwForm.netWorth) || 0; const assets = nwForm.assets ? JSON.parse(nwForm.assets) : []; const liabilities = nwForm.liabilities ? JSON.parse(nwForm.liabilities) : []; const res = await citizenService.updateNetWorth(nw, assets, liabilities); setNetWorth(res) } catch (e) { console.error(e) }
    setSavingNw(false)
  }

  const handleAddBank = async (bank) => {
    try { const res = await citizenService.addBankToPortfolio(bank.id, 'savings', ''); setBankPortfolio(prev => [...prev, res]); setBankIframeUrl(bank.website) } catch (e) { alert(e.response?.data?.message || 'Failed to add bank') }
  }

  const handleRemoveBank = async (bankId) => {
    try { await citizenService.removeBankFromPortfolio(bankId); setBankPortfolio(prev => prev.filter(b => b.bankId !== bankId)); setBankBalances(prev => { const n = {...prev}; delete n[bankId]; return n }) } catch (e) { console.error(e) }
  }

  const handleConnectToBank = async () => {
    if (!selectedBankId) return
    setConnecting(true)
    try {
      const bank = banks.find(b => b.id === parseInt(selectedBankId))
      if (!bank) return
      await citizenService.addBankToPortfolio(bank.id, 'checking', 'Connected via Connect to Bank')
      const { data } = await citizenService.getBankPortfolio()
      setBankPortfolio(data || [])
      setShowConnectBank(false)
      setSelectedBankId('')
    } catch (e) { alert(e.response?.data?.message || 'Failed to connect to bank') }
    setConnecting(false)
  }

  const fetchBankBalance = async (bankId) => {
    setRefreshingBalance(bankId)
    try {
      const res = await citizenService.getBankBalance(bankId)
      setBankBalances(prev => ({ ...prev, [bankId]: res }))
    } catch {}
    setRefreshingBalance(null)
  }

  const openBankIframe = (url) => setBankIframeUrl(url)

  const bankInPortfolio = (bankId) => bankPortfolio.some(b => b.bankId === bankId)

  const taxRecords = tax?.records || []
  const sectorData = economy?.sectors ? Object.entries(economy.sectors) : []
  const totalAlloc = Object.entries(allocForm).filter(([k]) => k !== 'income').reduce((s, [, v]) => s + Number(v), 0)

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-gray-900">{t('Economy & Finance')}</h1><p className="text-gray-500 mt-1">{t('Your financial overview, banks, portfolio builder, and business news')}</p></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></div><span className="text-xs text-gray-500">{t('Net Worth')}</span></div><div className="text-lg font-bold text-gray-900">{formatBirr(netWorth?.netWorth || 0)} ETB</div><div className="text-[10px] text-gray-400">{t('Rank')} #{netWorth?.rank || '-'}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-green-50 text-green-600"><Globe className="w-4 h-4" /></div><span className="text-xs text-gray-500">{t('GDP')}</span></div><div className="text-lg font-bold text-gray-900">${economy?.gdp || 155.8}B</div><div className="text-[10px] text-green-600">{economy?.gdpGrowth || 6.4}% {t('growth')}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><Hash className="w-4 h-4" /></div><span className="text-xs text-gray-500">{t('TIN')}</span></div><div className="text-lg font-bold text-gray-900">{tin?.tinNumber ? t('Registered') : t('Not Set')}</div><div className="text-[10px] text-gray-400">{tin?.status || '—'}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><DollarSign className="w-4 h-4" /></div><span className="text-xs text-gray-500">{t('Tax Paid')}</span></div><div className="text-lg font-bold text-green-600">{formatBirr(tax?.totalPaid || 0)} ETB</div><div className="text-[10px] text-gray-400">{tax?.paidCount || 0} {t('payments')}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><Landmark className="w-4 h-4" /></div><span className="text-xs text-gray-500">{t('Banks')}</span></div><div className="text-lg font-bold text-indigo-600">{banks.length}</div><div className="text-[10px] text-gray-400">{t('In Ethiopia')}</div></motion.div>
      </div>

      {badge?.badges && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-600" /> {t('Finance Badges')}</h3>
          <div className="flex flex-wrap gap-2">{badge.badges.tinRegistered && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium"><BadgeCheck className="w-3 h-3" />{t('TIN Registered')}</span>}{badge.badges.taxPayer && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium"><DollarSign className="w-3 h-3" />{t('Tax Payer')}</span>}{badge.isMesobVerified && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"><BadgeCheck className="w-3 h-3" />{t('MESOB Verified')}</span>}{!badge.badges.tinRegistered && <span className="text-xs text-gray-400 py-1">{t('No badges. Register TIN below.')}</span>}</div>
        </motion.div>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{id:'overview',label:t('Overview'),icon:BarChart3},{id:'banks',label:t('Banks'),icon:Landmark},{id:'builder',label:t('Portfolio Builder'),icon:Wallet},{id:'allocation',label:t('Wealth Allocation'),icon:Target},{id:'news',label:t('Business News'),icon:Newspaper}].map(tab => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === tab.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>)}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4" /> {t('Net Worth Calculator')}</h3>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div><label className="block text-xs text-gray-500 mb-1">{t('Net Worth (ETB)')}</label><input type="number" value={nwForm.netWorth} onChange={e => setNwForm({...nwForm, netWorth: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="0" /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><label className="block text-xs text-gray-500 mb-1">{t('Assets (JSON)')}</label><input type="text" value={nwForm.assets} onChange={e => setNwForm({...nwForm, assets: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder='[{"name":"House","value":500000}]' /></div><div><label className="block text-xs text-gray-500 mb-1">{t('Liabilities (JSON)')}</label><input type="text" value={nwForm.liabilities} onChange={e => setNwForm({...nwForm, liabilities: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder='[{"name":"Loan","value":100000}]' /></div></div>
              <button onClick={handleNwSubmit} disabled={savingNw} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition">{savingNw ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}{t('Update Net Worth')}</button>
            </div>
            {netWorth?.rank && <div className="p-3 bg-blue-50 rounded-xl text-sm"><div className="flex items-center justify-between"><span className="text-blue-700 font-medium">{t('Position in Economy')}</span><span className="text-blue-800 font-bold">#{netWorth.rank} {t('of')} {netWorth.totalParticipants}</span></div></div>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Hash className="w-4 h-4" /> {t('TIN Registration')}</h3>
            {tin?.tinNumber ? <div className="p-4 bg-green-50 rounded-xl mb-4"><div className="flex items-center gap-2 text-green-700 font-semibold mb-1"><CheckCircle className="w-5 h-5" /> {t('TIN Registered')}</div><div className="text-lg font-bold text-gray-900">{tin.tinNumber}</div><div className="text-xs text-gray-500 mt-1">{t('Status')}: {tin.status} • {t('Verified')}: {tin.verifiedAt ? new Date(tin.verifiedAt).toLocaleDateString() : '—'}</div></div> : <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">{t('Enter your TIN Number')}</label><div className="flex gap-2"><input type="text" value={tinInput} onChange={e => setTinInput(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="e.g. TIN-1001234567" /><button onClick={handleTinSubmit} disabled={savingTin || !tinInput} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition">{savingTin ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : t('Register')}</button></div>{tinMsg && <p className={`text-xs mt-1 ${tinMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{tinMsg}</p>}</div>}
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">{t('Tax Payment History')}</h4>
            {taxRecords.length === 0 ? <p className="text-sm text-gray-400">{t('No tax records found.')}</p> : <div className="space-y-2 max-h-48 overflow-y-auto">{taxRecords.map(r => <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-sm"><div><span className="font-medium text-gray-700">{r.taxType}</span><span className="text-xs text-gray-400 ml-2">{r.period}</span></div><div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{formatBirr(r.amount)} ETB</span>{r.status === 'paid' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-yellow-600">{r.status}</span>}</div></div>)}</div>}
          </motion.div>
        </div>
      )}

      {activeTab === 'banks' && (
        <div className="space-y-6">
          {/* Connected Banks with Balances */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Unplug className="w-5 h-5 text-green-600" /> {t('Connected Banks')}
                <span className="text-sm font-normal text-gray-400">({bankPortfolio.length})</span>
              </h3>
              <button onClick={() => setShowConnectBank(true)}
                className="flex items-center gap-1.5 px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 transition">
                <Plus className="w-4 h-4" /> {t('Connect to Bank')}
              </button>
            </div>
            {bankPortfolio.length === 0 ? (
              <div className="text-center py-10">
                <Landmark className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">{t('No banks connected yet.')}</p>
                <p className="text-xs text-gray-300 mt-1">{t('Click "Connect to Bank" to link your bank accounts')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bankPortfolio.map(bp => {
                  const bk = banks.find(b => b.id === bp.bankId)
                  const bal = bankBalances[bp.bankId]
                  return bk ? (
                    <div key={bp.id} className="p-4 rounded-xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-sm">{bk.code}</div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">{bk.name}</h4>
                            <p className="text-[10px] text-gray-400">{bp.accountType || t('Checking')} {t('account')}</p>
                          </div>
                        </div>
                        <button onClick={() => handleRemoveBank(bk.id)}
                          className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      {bal ? (
                        <div className="space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            <div className="p-2 bg-green-50 rounded-lg text-center">
                              <div className="text-[10px] text-green-600">{t('Balance')}</div>
                              <div className="text-sm font-bold text-green-700">{formatBirr(bal.balance)}</div>
                            </div>
                            <div className="p-2 bg-blue-50 rounded-lg text-center">
                              <div className="text-[10px] text-blue-600">{t('Credit')}</div>
                              <div className="text-sm font-bold text-blue-700">{formatBirr(bal.credit)}</div>
                            </div>
                            <div className="p-2 bg-red-50 rounded-lg text-center">
                              <div className="text-[10px] text-red-600">{t('Debt')}</div>
                              <div className="text-sm font-bold text-red-700">{formatBirr(bal.debt)}</div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400">
                            <span>ETB • {t('Updated')} {bal.lastUpdated ? new Date(bal.lastUpdated).toLocaleTimeString() : '—'}</span>
                            <button onClick={() => fetchBankBalance(bk.id)} disabled={refreshingBalance === bk.id}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-700">
                              <RefreshCw className={`w-3 h-3 ${refreshingBalance === bk.id ? 'animate-spin' : ''}`} /> {t('Refresh')}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <button onClick={() => fetchBankBalance(bk.id)}
                            className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                            {t('Fetch Balance')}
                          </button>
                        </div>
                      )}
                      <div className="flex gap-2 mt-3">
                        <button onClick={() => setBankIframeUrl(bk.website)}
                          className="flex-1 text-xs py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition">
                          <ExternalLink className="w-3 h-3 inline mr-1" /> {t('Visit Website')}
                        </button>
                      </div>
                    </div>
                  ) : null
                })}
              </div>
            )}
          </motion.div>

          {/* Bank Iframe Viewer */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" /> {t('National Bank of Ethiopia')}
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">{t('Central Bank')}</span>
            </div>
            <div className="w-full min-h-[250px] md:min-h-[400px] lg:min-h-[500px]">
              <iframe src="/api/proxy/bank?url=https%3A%2F%2Fnbe.gov.et"
                className="w-full h-full border-0" title="National Bank of Ethiopia"
                loading="lazy" referrerPolicy="no-referrer"
                />
            </div>
          </motion.div>

          {/* All Banks List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bookmark className="w-5 h-5 text-blue-600" /> {t('Your Banks')} ({bankPortfolio.length})</h3>
                {bankPortfolio.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">{t('No banks added yet.')}<br />{t('Browse the list to add banks.')}</p>
                ) : (
                  <div className="space-y-2">
                    {bankPortfolio.map(bp => {
                      const bk = banks.find(b => b.id === bp.bankId)
                      return bk ? (
                        <div key={bp.id} className="flex items-center gap-2 p-2.5 bg-gray-50 rounded-xl hover:bg-blue-50 transition group">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-[10px]">{bk.code}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">{bk.name}</div>
                            <div className="text-[10px] text-gray-400 truncate">{bk.website.replace('https://www.', '')}</div>
                          </div>
                          <button onClick={() => setBankIframeUrl(bk.website)} className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-100 opacity-0 group-hover:opacity-100 transition">
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleRemoveBank(bk.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> {t('Add Banks to Your Portfolio')}</h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {banks.filter(b => b.code !== 'NBE').map(b => {
                    const inP = bankInPortfolio(b.id)
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3.5 hover:bg-gray-50 transition">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">{b.code}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{b.name}</h4>
                          <p className="text-xs text-gray-400">{t('Since')} {b.founded} • {b.type === 'public' ? t('Public') : t('Private')}</p>
                        </div>
                        {inP ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"><BookmarkCheck className="w-3.5 h-3.5" />{t('Added')}</span>
                            <button onClick={() => setBankIframeUrl(b.website)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"><ExternalLink className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleAddBank(b)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition"><Plus className="w-3.5 h-3.5" />{t('Add')}</button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bank Website Iframe Modal */}
      {bankIframeUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setBankIframeUrl(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900 text-sm truncate flex-1">{bankIframeUrl}</h3>
              <span className="text-xs text-gray-400 mr-2">{t('Bank Website')}</span>
              <button onClick={() => setBankIframeUrl(null)} className="p-1.5 hover:bg-gray-100 rounded-lg ml-2"><Minimize2 className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 bg-gray-50">
              <iframe src={`/api/proxy/bank?url=${encodeURIComponent(bankIframeUrl)}`}
                className="w-full h-full border-0" title="Bank Website"
                loading="lazy" referrerPolicy="no-referrer"
                />
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-600" /> {t('Portfolio Allocation Builder')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('Distribute your income across asset classes to build a balanced portfolio.')}</p>
            <div className="space-y-3">
              {[{k:'stocks',l:t('Stocks / Equities'),c:'blue'},{k:'bonds',l:t('Bonds / Treasury'),c:'green'},{k:'realEstate',l:t('Real Estate'),c:'purple'},{k:'cash',l:t('Cash / Savings'),c:'amber'},{k:'commodities',l:t('Commodities / Gold'),c:'orange'}].map(a => <div key={a.k}><div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{a.l}</span><span className={`font-semibold text-${a.c}-600`}>{allocForm[a.k]}%</span></div><input type="range" min="0" max="100" value={allocForm[a.k]} onChange={e => setAllocForm({...allocForm, [a.k]: e.target.value})} className="w-full accent-blue-600" /></div>)}
              <div className={`p-3 rounded-xl text-sm font-medium ${totalAlloc === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{t('Total allocation')}: {totalAlloc}% {totalAlloc === 100 ? t('✓ Balanced') : totalAlloc > 100 ? t('(over-allocated)') : t('(under-allocated)')}</div>
              {totalAlloc === 100 && <div className="p-3 bg-blue-50 rounded-xl"><p className="text-sm text-blue-700 font-medium">{t('Suggested Monthly Investment')}</p><p className="text-lg font-bold text-blue-900">{formatBirr(Number(allocForm.income) * 0.3)} ETB <span className="text-sm font-normal text-blue-500">{t('(30% of income)')}</span></p><div className="text-xs text-blue-600 mt-1">{t('Breakdown')}: {t('Stocks')}: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.stocks) / 100)} ETB • {t('Bonds')}: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.bonds) / 100)} ETB • {t('Real Estate')}: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.realEstate) / 100)} ETB • {t('Cash')}: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.cash) / 100)} ETB • {t('Commodities')}: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.commodities) / 100)} ETB</div></div>}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-600" /> {t('Wealth Allocation Advice')}</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">{t('Conservative Strategy')}</h4><p className="text-xs text-gray-600">{t('Focus on bonds (40%), cash (30%), and real estate (20%). Lower risk, stable returns. Ideal for capital preservation.')}</p></div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">{t('Balanced Strategy')}</h4><p className="text-xs text-gray-600">{t('Equal mix of stocks (30%), bonds (20%), real estate (25%), cash (15%), and commodities (10%). Moderate risk with growth potential.')}</p></div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">{t('Growth Strategy')}</h4><p className="text-xs text-gray-600">{t('High allocation to stocks (50%), commodities (20%), and real estate (20%). Higher risk but higher potential returns for long-term growth.')}</p></div>
              <div className="p-4 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700">{t('Tip: Rebalance your portfolio quarterly. Diversification across asset classes reduces overall risk. Consider Ethiopia\'s growing sectors like agriculture, technology, and financial services.')}</p></div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> {t('National Economy Overview')}</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[{label:t('GDP'),value:`$${economy?.gdp || 155.8}B`,color:'text-blue-600'},{label:t('Growth'),value:`${economy?.gdpGrowth || 6.4}%`,color:'text-green-600'},{label:t('Inflation'),value:`${economy?.inflation || 23.5}%`,color:'text-red-600'},{label:t('GDP/Capita'),value:`$${economy?.gdpPerCapita || 1123}`,color:'text-purple-600'}].map((s, i) => <div key={i} className="p-3 bg-gray-50 rounded-xl text-center"><div className={`text-lg font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
            </div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">{t('GDP by Sector')}</h4>
            <div className="grid grid-cols-3 gap-2">{sectorData.map(([name, val]) => <div key={name} className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center"><div className="text-sm font-bold text-blue-700">{val}%</div><div className="text-xs text-blue-600 capitalize">{t(name)}</div></div>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> {t('Where to Allocate')}</h3>
            <p className="text-sm text-gray-500 mb-4">{t('Based on Ethiopia\'s current economic landscape, these sectors show strong potential:')}</p>
            <div className="space-y-3">
              {[{sector:t('Agriculture (Coffee, Teff, Wheat)'),desc:t('Ethiopia\'s backbone - growing export demand'),alloc:'15-25%'},{sector:t('Technology & Digital'),desc:t('Rapidly growing sector with govt support'),alloc:'10-20%'},{sector:t('Real Estate & Construction'),desc:t('Urbanization driving demand'),alloc:'20-30%'},{sector:t('Precious Metals (Gold)'),desc:t('Hedge against inflation'),alloc:'5-15%'},{sector:t('Government Bonds'),desc:t('Stable returns, low risk'),alloc:'10-20%'}].map((item, i) => <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><h4 className="text-sm font-semibold text-gray-800">{item.sector}</h4><p className="text-xs text-gray-500">{item.desc}</p></div><span className="text-sm font-bold text-blue-600">{item.alloc}</span></div>)}
            </div>
          </div>
        </div>
      )}

      {/* Connect to Bank Modal */}
      <AnimatePresence>
        {showConnectBank && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 flex items-center gap-2"><Unplug className="w-5 h-5 text-green-600" /> {t('Connect to Bank')}</h3>
                <button onClick={() => { setShowConnectBank(false); setSelectedBankId('') }} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
              </div>
              <p className="text-sm text-gray-500 mb-4">{t('Select a bank to connect and view your balance, credit, and debt information.')}</p>
              <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                {banks.filter(b => b.code !== 'NBE' && !bankInPortfolio(b.id)).map(b => (
                  <label key={b.id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${selectedBankId === String(b.id) ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <input type="radio" name="bank" value={b.id} checked={selectedBankId === String(b.id)}
                      onChange={() => setSelectedBankId(String(b.id))} className="accent-green-600" />
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-white font-bold text-xs">{b.code}</div>
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{b.name}</div>
                      <div className="text-xs text-gray-400">{b.type === 'public' ? t('Public Bank') : t('Private Bank')}</div>
                    </div>
                  </label>
                ))}
                {banks.filter(b => b.code !== 'NBE' && !bankInPortfolio(b.id)).length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">{t('All banks are already connected.')}</p>
                )}
              </div>
              <div className="flex gap-3">
                <button onClick={handleConnectToBank} disabled={!selectedBankId || connecting}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition">
                  {connecting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" /> : t('Connect')}
                </button>
                <button onClick={() => { setShowConnectBank(false); setSelectedBankId('') }}
                  className="flex-1 bg-gray-100 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">{t('Cancel')}</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {activeTab === 'news' && (
        <div className="space-y-3">
          {news.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">{t('No business news available.')}</p></div> : news.map((article, i) => <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between"><div className="flex-1"><h3 className="font-semibold text-gray-900">{article.title}</h3><p className="text-sm text-gray-500 mt-1">{article.description}</p><div className="flex items-center gap-3 mt-2 text-xs text-gray-400"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded capitalize">{article.category}</span><span>{article.source}</span><span>{new Date(article.publishedAt).toLocaleDateString()}</span></div></div><a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 ml-4 flex-shrink-0"><ExternalLink className="w-4 h-4" /></a></div></motion.div>)}
        </div>
      )}
    </div>
  )
}
