import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Wallet, PiggyBank, CheckCircle, Globe, Target, Plus, Minus, BadgeCheck, Hash, ArrowUp, ArrowDown, Landmark, Building2, Newspaper, BarChart3, Percent, Briefcase, LineChart, PieChart, ExternalLink, X, Bookmark, BookmarkCheck, ChevronRight, Minimize2 } from 'lucide-react'
import { citizenService } from '../../services/citizenService'

function formatBirr(n) { if (!n) return '0'; if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`; if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`; return Number(n).toLocaleString() }

export default function CitizenFinance() {
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
    try { await citizenService.removeBankFromPortfolio(bankId); setBankPortfolio(prev => prev.filter(b => b.bankId !== bankId)) } catch (e) { console.error(e) }
  }

  const openBankIframe = (url) => setBankIframeUrl(url)

  const bankInPortfolio = (bankId) => bankPortfolio.some(b => b.bankId === bankId)

  const taxRecords = tax?.records || []
  const sectorData = economy?.sectors ? Object.entries(economy.sectors) : []
  const totalAlloc = Object.entries(allocForm).filter(([k]) => k !== 'income').reduce((s, [, v]) => s + Number(v), 0)

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" /></div>

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-black text-gray-900">Economy & Finance</h1><p className="text-gray-500 mt-1">Your financial overview, banks, portfolio builder, and business news</p></div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-blue-50 text-blue-600"><TrendingUp className="w-4 h-4" /></div><span className="text-xs text-gray-500">Net Worth</span></div><div className="text-lg font-bold text-gray-900">{formatBirr(netWorth?.netWorth || 0)} ETB</div><div className="text-[10px] text-gray-400">Rank #{netWorth?.rank || '-'}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-green-50 text-green-600"><Globe className="w-4 h-4" /></div><span className="text-xs text-gray-500">GDP</span></div><div className="text-lg font-bold text-gray-900">${economy?.gdp || 155.8}B</div><div className="text-[10px] text-green-600">{economy?.gdpGrowth || 6.4}% growth</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-purple-50 text-purple-600"><Hash className="w-4 h-4" /></div><span className="text-xs text-gray-500">TIN</span></div><div className="text-lg font-bold text-gray-900">{tin?.tinNumber ? 'Registered' : 'Not Set'}</div><div className="text-[10px] text-gray-400">{tin?.status || '—'}</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.09 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-amber-50 text-amber-600"><DollarSign className="w-4 h-4" /></div><span className="text-xs text-gray-500">Tax Paid</span></div><div className="text-lg font-bold text-green-600">{formatBirr(tax?.totalPaid || 0)} ETB</div><div className="text-[10px] text-gray-400">{tax?.paidCount || 0} payments</div></motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"><div className="flex items-center gap-2 mb-1"><div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600"><Landmark className="w-4 h-4" /></div><span className="text-xs text-gray-500">Banks</span></div><div className="text-lg font-bold text-indigo-600">{banks.length}</div><div className="text-[10px] text-gray-400">In Ethiopia</div></motion.div>
      </div>

      {badge?.badges && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-blue-600" /> Finance Badges</h3>
          <div className="flex flex-wrap gap-2">{badge.badges.tinRegistered && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-purple-100 text-purple-700 font-medium"><BadgeCheck className="w-3 h-3" />TIN Registered</span>}{badge.badges.taxPayer && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-100 text-green-700 font-medium"><DollarSign className="w-3 h-3" />Tax Payer</span>}{badge.isMesobVerified && <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 font-medium"><BadgeCheck className="w-3 h-3" />MESOB Verified</span>}{!badge.badges.tinRegistered && <span className="text-xs text-gray-400 py-1">No badges. Register TIN below.</span>}</div>
        </motion.div>
      )}

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[{id:'overview',label:'Overview',icon:BarChart3},{id:'banks',label:'Banks',icon:Landmark},{id:'builder',label:'Portfolio Builder',icon:Wallet},{id:'allocation',label:'Wealth Allocation',icon:Target},{id:'news',label:'Business News',icon:Newspaper}].map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><t.icon className="w-4 h-4" />{t.label}</button>)}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Wallet className="w-4 h-4" /> Net Worth Calculator</h3>
            <div className="grid grid-cols-1 gap-3 mb-4">
              <div><label className="block text-xs text-gray-500 mb-1">Net Worth (ETB)</label><input type="number" value={nwForm.netWorth} onChange={e => setNwForm({...nwForm, netWorth: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="0" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="block text-xs text-gray-500 mb-1">Assets (JSON)</label><input type="text" value={nwForm.assets} onChange={e => setNwForm({...nwForm, assets: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder='[{"name":"House","value":500000}]' /></div><div><label className="block text-xs text-gray-500 mb-1">Liabilities (JSON)</label><input type="text" value={nwForm.liabilities} onChange={e => setNwForm({...nwForm, liabilities: e.target.value})} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder='[{"name":"Loan","value":100000}]' /></div></div>
              <button onClick={handleNwSubmit} disabled={savingNw} className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition">{savingNw ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Plus className="w-4 h-4" />}Update Net Worth</button>
            </div>
            {netWorth?.rank && <div className="p-3 bg-blue-50 rounded-xl text-sm"><div className="flex items-center justify-between"><span className="text-blue-700 font-medium">Position in Economy</span><span className="text-blue-800 font-bold">#{netWorth.rank} of {netWorth.totalParticipants}</span></div></div>}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Hash className="w-4 h-4" /> TIN Registration</h3>
            {tin?.tinNumber ? <div className="p-4 bg-green-50 rounded-xl mb-4"><div className="flex items-center gap-2 text-green-700 font-semibold mb-1"><CheckCircle className="w-5 h-5" /> TIN Registered</div><div className="text-lg font-bold text-gray-900">{tin.tinNumber}</div><div className="text-xs text-gray-500 mt-1">Status: {tin.status} • Verified: {tin.verifiedAt ? new Date(tin.verifiedAt).toLocaleDateString() : '—'}</div></div> : <div className="mb-4"><label className="block text-xs text-gray-500 mb-1">Enter your TIN Number</label><div className="flex gap-2"><input type="text" value={tinInput} onChange={e => setTinInput(e.target.value)} className="flex-1 px-3 py-2.5 rounded-xl border border-gray-200 text-sm" placeholder="e.g. TIN-1001234567" /><button onClick={handleTinSubmit} disabled={savingTin || !tinInput} className="px-4 py-2.5 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition">{savingTin ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Register'}</button></div>{tinMsg && <p className={`text-xs mt-1 ${tinMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{tinMsg}</p>}</div>}
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Tax Payment History</h4>
            {taxRecords.length === 0 ? <p className="text-sm text-gray-400">No tax records found.</p> : <div className="space-y-2 max-h-48 overflow-y-auto">{taxRecords.map(r => <div key={r.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl text-sm"><div><span className="font-medium text-gray-700">{r.taxType}</span><span className="text-xs text-gray-400 ml-2">{r.period}</span></div><div className="flex items-center gap-2"><span className="font-semibold text-gray-900">{formatBirr(r.amount)} ETB</span>{r.status === 'paid' ? <CheckCircle className="w-4 h-4 text-green-500" /> : <span className="text-xs text-yellow-600">{r.status}</span>}</div></div>)}</div>}
          </motion.div>
        </div>
      )}

      {activeTab === 'banks' && (
        <div className="space-y-6">
          {/* National Bank of Ethiopia - Main Iframe */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                <Landmark className="w-5 h-5 text-blue-600" /> National Bank of Ethiopia
              </h3>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">Central Bank</span>
            </div>
            <div className="w-full" style={{ height: '500px' }}>
              <iframe src="/api/proxy/bank?url=https%3A%2F%2Fnbe.gov.et"
                className="w-full h-full border-0" title="National Bank of Ethiopia"
                sandbox="allow-scripts allow-forms allow-same-origin" />
            </div>
          </motion.div>

          {/* Bank Portfolio + Add Banks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2"><Bookmark className="w-5 h-5 text-blue-600" /> Your Banks ({bankPortfolio.length})</h3>
                {bankPortfolio.length === 0 ? (
                  <p className="text-sm text-gray-400 py-6 text-center">No banks added yet.<br />Browse the list to add banks.</p>
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
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-blue-600" /> Add Banks to Your Portfolio</h3>
                </div>
                <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
                  {banks.filter(b => b.code !== 'NBE').map(b => {
                    const inP = bankInPortfolio(b.id)
                    return (
                      <div key={b.id} className="flex items-center gap-3 p-3.5 hover:bg-gray-50 transition">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs">{b.code}</div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm">{b.name}</h4>
                          <p className="text-xs text-gray-400">Since {b.founded} • {b.type === 'public' ? 'Public' : 'Private'}</p>
                        </div>
                        {inP ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-blue-600 bg-blue-50 px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1"><BookmarkCheck className="w-3.5 h-3.5" />Added</span>
                            <button onClick={() => setBankIframeUrl(b.website)} className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition"><ExternalLink className="w-4 h-4" /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleAddBank(b)} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-xl text-xs font-medium hover:bg-blue-700 transition"><Plus className="w-3.5 h-3.5" />Add</button>
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
              <button onClick={() => setBankIframeUrl(null)} className="p-1.5 hover:bg-gray-100 rounded-lg ml-2"><Minimize2 className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="flex-1 bg-gray-50">
              <iframe src={`/api/proxy/bank?url=${encodeURIComponent(bankIframeUrl)}`}
                className="w-full h-full border-0" title="Bank Website" sandbox="allow-scripts allow-forms allow-same-origin" />
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'builder' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><PieChart className="w-5 h-5 text-blue-600" /> Portfolio Allocation Builder</h3>
            <p className="text-sm text-gray-500 mb-4">Distribute your income across asset classes to build a balanced portfolio.</p>
            <div className="space-y-3">
              {[{k:'stocks',l:'Stocks / Equities',c:'blue'},{k:'bonds',l:'Bonds / Treasury',c:'green'},{k:'realEstate',l:'Real Estate',c:'purple'},{k:'cash',l:'Cash / Savings',c:'amber'},{k:'commodities',l:'Commodities / Gold',c:'orange'}].map(a => <div key={a.k}><div className="flex justify-between text-sm mb-1"><span className="text-gray-700">{a.l}</span><span className={`font-semibold text-${a.c}-600`}>{allocForm[a.k]}%</span></div><input type="range" min="0" max="100" value={allocForm[a.k]} onChange={e => setAllocForm({...allocForm, [a.k]: e.target.value})} className="w-full accent-blue-600" /></div>)}
              <div className={`p-3 rounded-xl text-sm font-medium ${totalAlloc === 100 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>Total allocation: {totalAlloc}% {totalAlloc === 100 ? '✓ Balanced' : totalAlloc > 100 ? '(over-allocated)' : '(under-allocated)'}</div>
              {totalAlloc === 100 && <div className="p-3 bg-blue-50 rounded-xl"><p className="text-sm text-blue-700 font-medium">Suggested Monthly Investment</p><p className="text-lg font-bold text-blue-900">{formatBirr(Number(allocForm.income) * 0.3)} ETB <span className="text-sm font-normal text-blue-500">(30% of income)</span></p><div className="text-xs text-blue-600 mt-1">Breakdown: Stocks: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.stocks) / 100)} ETB • Bonds: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.bonds) / 100)} ETB • Real Estate: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.realEstate) / 100)} ETB • Cash: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.cash) / 100)} ETB • Commodities: {formatBirr(Number(allocForm.income) * 0.3 * Number(allocForm.commodities) / 100)} ETB</div></div>}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-amber-600" /> Wealth Allocation Advice</h3>
            <div className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">Conservative Strategy</h4><p className="text-xs text-gray-600">Focus on bonds (40%), cash (30%), and real estate (20%). Lower risk, stable returns. Ideal for capital preservation.</p></div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">Balanced Strategy</h4><p className="text-xs text-gray-600">Equal mix of stocks (30%), bonds (20%), real estate (25%), cash (15%), and commodities (10%). Moderate risk with growth potential.</p></div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl"><h4 className="font-semibold text-gray-900 text-sm mb-2">Growth Strategy</h4><p className="text-xs text-gray-600">High allocation to stocks (50%), commodities (20%), and real estate (20%). Higher risk but higher potential returns for long-term growth.</p></div>
              <div className="p-4 bg-amber-50 rounded-xl"><p className="text-xs text-amber-700">Tip: Rebalance your portfolio quarterly. Diversification across asset classes reduces overall risk. Consider Ethiopia's growing sectors like agriculture, technology, and financial services.</p></div>
            </div>
          </motion.div>
        </div>
      )}

      {activeTab === 'allocation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-blue-600" /> National Economy Overview</h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {[{label:'GDP',value:`$${economy?.gdp || 155.8}B`,color:'text-blue-600'},{label:'Growth',value:`${economy?.gdpGrowth || 6.4}%`,color:'text-green-600'},{label:'Inflation',value:`${economy?.inflation || 23.5}%`,color:'text-red-600'},{label:'GDP/Capita',value:`$${economy?.gdpPerCapita || 1123}`,color:'text-purple-600'}].map((s, i) => <div key={i} className="p-3 bg-gray-50 rounded-xl text-center"><div className={`text-lg font-bold ${s.color}`}>{s.value}</div><div className="text-xs text-gray-500">{s.label}</div></div>)}
            </div>
            <h4 className="text-xs font-semibold text-gray-500 mb-2 uppercase">GDP by Sector</h4>
            <div className="grid grid-cols-3 gap-2">{sectorData.map(([name, val]) => <div key={name} className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl text-center"><div className="text-sm font-bold text-blue-700">{val}%</div><div className="text-xs text-blue-600 capitalize">{name}</div></div>)}</div>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-green-600" /> Where to Allocate</h3>
            <p className="text-sm text-gray-500 mb-4">Based on Ethiopia's current economic landscape, these sectors show strong potential:</p>
            <div className="space-y-3">
              {[{sector:'Agriculture (Coffee, Teff, Wheat)',desc:'Ethiopia\'s backbone - growing export demand',alloc:'15-25%'},{sector:'Technology & Digital',desc:'Rapidly growing sector with govt support',alloc:'10-20%'},{sector:'Real Estate & Construction',desc:'Urbanization driving demand',alloc:'20-30%'},{sector:'Precious Metals (Gold)',desc:'Hedge against inflation',alloc:'5-15%'},{sector:'Government Bonds',desc:'Stable returns, low risk',alloc:'10-20%'}].map((item, i) => <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"><div><h4 className="text-sm font-semibold text-gray-800">{item.sector}</h4><p className="text-xs text-gray-500">{item.desc}</p></div><span className="text-sm font-bold text-blue-600">{item.alloc}</span></div>)}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'news' && (
        <div className="space-y-3">
          {news.length === 0 ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><Newspaper className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">No business news available.</p></div> : news.map((article, i) => <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition"><div className="flex justify-between"><div className="flex-1"><h3 className="font-semibold text-gray-900">{article.title}</h3><p className="text-sm text-gray-500 mt-1">{article.description}</p><div className="flex items-center gap-3 mt-2 text-xs text-gray-400"><span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded capitalize">{article.category}</span><span>{article.source}</span><span>{new Date(article.publishedAt).toLocaleDateString()}</span></div></div><a href={article.url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 ml-4 flex-shrink-0"><ExternalLink className="w-4 h-4" /></a></div></motion.div>)}
        </div>
      )}
    </div>
  )
}
