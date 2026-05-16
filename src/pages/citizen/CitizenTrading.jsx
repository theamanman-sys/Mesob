import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, DollarSign, Wallet, BarChart3, PieChart, RefreshCw, ArrowUpRight, ArrowDownRight, Plus, Minus, X, Copy, Check, Activity, LineChart, CandlestickChart } from 'lucide-react'
import { citizenService } from '../../services/citizenService'

const format = (n) => (n || 0).toLocaleString()

export default function CitizenTrading() {
  const [account, setAccount] = useState(null)
  const [commodities, setCommodities] = useState([])
  const [rates, setRates] = useState([])
  const [orders, setOrders] = useState([])
  const [portfolio, setPortfolio] = useState(null)
  const [allOrders, setAllOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('markets')
  const [tradeModal, setTradeModal] = useState(null)
  const [tradeType, setTradeType] = useState('buy')
  const [tradeQty, setTradeQty] = useState(1)
  const [depositModal, setDepositModal] = useState(false)
  const [depositAmount, setDepositAmount] = useState('')
  const [msg, setMsg] = useState('')

  const fetchAll = () => {
    setLoading(true)
    Promise.all([
      citizenService.getTradingAccount().catch(() => null),
      citizenService.getCommodities().catch(() => []),
      citizenService.getExchangeRates().catch(() => []),
      citizenService.getMyOrders().catch(() => []),
      citizenService.getPortfolio().catch(() => null),
      citizenService.getAllOrders().catch(() => [])
    ]).then(([a, c, r, o, p, ao]) => { setAccount(a); setCommodities(c); setRates(r); setOrders(o); setPortfolio(p); setAllOrders(ao) }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreateAccount = async () => { try { const r = await citizenService.createTradingAccount(); setAccount(r); setMsg('Account created!') } catch (err) { setMsg(err.response?.data?.message || err.message) } }
  const handleDeposit = async (e) => { e.preventDefault(); try { const r = await citizenService.depositTrading(Number(depositAmount)); setAccount(r.account || r); setDepositModal(false); setDepositAmount(''); setMsg(`${depositAmount} ETB deposited!`) } catch (err) { setMsg(err.response?.data?.message || err.message) } }
  const handleTrade = async (e) => { e.preventDefault(); try { const r = await citizenService.placeOrder(tradeModal.id, tradeType, tradeQty, tradeModal.currentPrice); setAccount(r.account); setPortfolio(r.portfolio); setTradeModal(null); setTradeQty(1); setMsg(`${tradeType} order filled!`) } catch (err) { setMsg(err.response?.data?.message || err.message) } }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin w-10 h-10 border-b-2 border-blue-600 rounded-full" /></div>

  if (!account) return <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center max-w-md mx-auto mt-12"><Wallet className="w-16 h-16 mx-auto mb-4 text-blue-600" /><h2 className="text-xl font-bold text-gray-900 mb-2">MESOB Trading</h2><p className="text-gray-500 mb-6">Open a trading account to trade commodities, stocks, and bonds.</p><button onClick={handleCreateAccount} className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700">Open Trading Account</button>{msg && <p className="text-sm text-green-600 mt-3">{msg}</p>}</div>

  const portfolioValue = portfolio?.totalValue || 0
  const totalReturn = portfolio?.totalReturn || account?.totalReturn || 0

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-black text-gray-900">MESOB Trading</h1><p className="text-gray-500 text-sm mt-1">Trade commodities, manage your portfolio</p></div>
        <div className="text-right"><p className="text-sm text-gray-500">Account</p><p className="text-sm font-semibold text-gray-800">{account.accountNumber}</p></div>
      </div>

      {msg && <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 text-green-700 px-4 py-2 rounded-xl text-sm mb-4 flex items-center justify-between"><span>{msg}</span><button onClick={() => setMsg('')}><X className="w-4 h-4" /></button></motion.div>}

      <div className="grid md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Cash Balance</p><p className="text-xl font-bold text-blue-600">{format(account.balance)} ETB</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Portfolio Value</p><p className="text-xl font-bold text-green-600">{format(portfolioValue)} ETB</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Total Return</p><p className={`text-xl font-bold ${totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>{totalReturn >= 0 ? '+' : ''}{format(totalReturn)} ETB</p></div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200"><p className="text-xs text-gray-500">Holdings</p><p className="text-xl font-bold text-purple-600">{portfolio?.holdings?.length || 0}</p></div>
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => setDepositModal(true)} className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 flex items-center gap-1"><Plus className="w-3.5 h-3.5" />Deposit</button>
      </div>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[{id:'markets',label:'Markets',icon:Activity},{id:'portfolio',label:'Portfolio',icon:PieChart},{id:'orders',label:'My Orders',icon:BarChart3},{id:'alltrades',label:'All Trades',icon:CandlestickChart},{id:'exchange',label:'Exchange Rates',icon:DollarSign}].map(t => <button key={t.id} onClick={() => setActiveTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}><t.icon className="w-4 h-4" />{t.label}</button>)}
      </div>

      {activeTab === 'markets' && (
        <div className="space-y-3">{commodities.map(c => <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex justify-between items-center"><div><h3 className="font-semibold text-gray-900">{c.name}</h3><p className="text-xs text-gray-500">{c.symbol} <span className="mx-1">•</span>{c.category.replace('_',' ')} <span className="mx-1">•</span>per {c.unit}</p></div><div className="text-right"><p className="text-lg font-bold">{format(c.currentPrice)} ETB</p><p className={`text-xs flex items-center gap-1 justify-end ${c.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{c.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}{c.change >= 0 ? '+' : ''}{c.change}%</p></div></div><div className="flex gap-2 mt-3 justify-end"><button onClick={() => { setTradeModal(c); setTradeType('buy'); setTradeQty(1) }} className="text-xs px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700">Buy</button><button onClick={() => { setTradeModal(c); setTradeType('sell'); setTradeQty(1) }} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Sell</button></div></motion.div>)}</div>
      )}

      {activeTab === 'portfolio' && (
        <div>
          {!portfolio?.holdings?.length ? <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm"><PieChart className="w-12 h-12 mx-auto mb-3 text-gray-300" /><p className="text-gray-400">No holdings yet. Start trading!</p></div> : <div className="space-y-3">{portfolio.holdings.map(h => <motion.div key={h.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"><div className="flex justify-between"><div><h3 className="font-semibold text-gray-900">{h.commodityName}</h3><p className="text-xs text-gray-500">{h.quantity} units @ avg {format(h.avgPrice)} ETB</p></div><div className="text-right"><p className="text-lg font-bold">{format(h.quantity * h.currentPrice)} ETB</p><p className={`text-xs ${h.currentPrice >= h.avgPrice ? 'text-green-600' : 'text-red-600'}`}>{h.currentPrice >= h.avgPrice ? '+' : ''}{format((h.currentPrice - h.avgPrice) * h.quantity)} ETB</p></div></div><div className="flex gap-2 mt-3 justify-end"><button onClick={() => { const c = commodities.find(cm => cm.id === h.commodityId); if (c) { setTradeModal(c); setTradeType('sell'); setTradeQty(1) } }} className="text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700">Sell</button></div></motion.div>)}</div>}
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {orders.length === 0 ? <div className="p-12 text-center text-gray-400"><BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No orders yet.</p></div> : <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-semibold text-gray-600">Commodity</th><th className="text-left p-3 font-semibold text-gray-600">Type</th><th className="text-right p-3 font-semibold text-gray-600">Qty</th><th className="text-right p-3 font-semibold text-gray-600">Price</th><th className="text-right p-3 font-semibold text-gray-600">Total</th><th className="text-left p-3 font-semibold text-gray-600">Date</th></tr></thead><tbody>{orders.map(o => <tr key={o.id} className="border-b border-gray-50"><td className="p-3">{o.commodityName}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{o.type.toUpperCase()}</span></td><td className="p-3 text-right">{o.quantity}</td><td className="p-3 text-right">{format(o.price)}</td><td className="p-3 text-right font-medium">{format(o.total)} ETB</td><td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}
        </div>
      )}

      {activeTab === 'alltrades' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {allOrders.length === 0 ? <div className="p-12 text-center text-gray-400"><CandlestickChart className="w-10 h-10 mx-auto mb-2 opacity-50" /><p>No trades yet.</p></div> : <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-semibold text-gray-600">Trader</th><th className="text-left p-3 font-semibold text-gray-600">Commodity</th><th className="text-left p-3 font-semibold text-gray-600">Type</th><th className="text-right p-3 font-semibold text-gray-600">Qty</th><th className="text-right p-3 font-semibold text-gray-600">Price</th><th className="text-right p-3 font-semibold text-gray-600">Total</th><th className="text-left p-3 font-semibold text-gray-600">Date</th></tr></thead><tbody>{allOrders.slice(0, 30).map(o => <tr key={o.id} className="border-b border-gray-50"><td className="p-3 text-xs">Trader #{o.citizenId}</td><td className="p-3">{o.commodityName}</td><td className="p-3"><span className={`text-xs px-2 py-0.5 rounded-full font-medium ${o.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{o.type.toUpperCase()}</span></td><td className="p-3 text-right">{o.quantity}</td><td className="p-3 text-right">{format(o.price)}</td><td className="p-3 text-right font-medium">{format(o.total)} ETB</td><td className="p-3 text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table>}
        </div>
      )}

      {activeTab === 'exchange' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="border-b bg-gray-50"><th className="text-left p-3 font-semibold text-gray-600">Pair</th><th className="text-right p-3 font-semibold text-gray-600">Rate</th><th className="text-right p-3 font-semibold text-gray-600">Change</th></tr></thead><tbody>{rates.map(r => <tr key={r.pair} className="border-b border-gray-50"><td className="p-3 font-medium">{r.pair}</td><td className="p-3 text-right font-bold">{format(r.rate)}</td><td className="p-3 text-right"><span className={`${r.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.change >= 0 ? '+' : ''}{r.change}</span></td></tr>)}</tbody></table>
        </div>
      )}

      {depositModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDepositModal(false)}><div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">Deposit Funds</h3><button onClick={() => setDepositModal(false)}><X className="w-5 h-5 text-gray-400" /></button></div><form onSubmit={handleDeposit}><input type="number" value={depositAmount} onChange={e => setDepositAmount(e.target.value)} placeholder="Amount (ETB)" min="100" required className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-4" /><button type="submit" className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700">Deposit</button></form></div></div>}

      {tradeModal && <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setTradeModal(null)}><div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-gray-900">{tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeModal.name}</h3><button onClick={() => setTradeModal(null)}><X className="w-5 h-5 text-gray-400" /></button></div><p className="text-sm text-gray-500 mb-4">Price: {format(tradeModal.currentPrice)} ETB / {tradeModal.unit}</p><form onSubmit={handleTrade}><div className="flex gap-2 mb-4"><button type="button" onClick={() => setTradeType('buy')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tradeType === 'buy' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Buy</button><button type="button" onClick={() => setTradeType('sell')} className={`flex-1 py-2 rounded-lg text-sm font-medium ${tradeType === 'sell' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-600'}`}>Sell</button></div><input type="number" value={tradeQty} onChange={e => setTradeQty(Math.max(1, Number(e.target.value)))} min="1" className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm mb-3" /><p className="text-sm text-gray-600 mb-4">Total: <strong>{format(tradeQty * tradeModal.currentPrice)} ETB</strong></p><button type="submit" className={`w-full py-2.5 rounded-xl font-semibold text-sm text-white ${tradeType === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>{tradeType === 'buy' ? 'Buy' : 'Sell'} {tradeQty} {tradeModal.unit}(s)</button></form></div></div>}
    </div>
  )
}
