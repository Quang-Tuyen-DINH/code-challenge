import type { Asset } from '../types/asset'

export function getLatestPrices(assets: Asset[]): Record<string, number> {
  const map: Record<string, { price: number; date: number }> = {}
  assets.forEach(a => {
    const ts = Date.parse(a.date)
    const prev = map[a.currency]
    if (!prev || ts > prev.date) {
      map[a.currency] = { price: a.price, date: ts }
    }
  })
  const result: Record<string, number> = {}
  Object.entries(map).forEach(([k, v]) => { result[k] = v.price })
  return result
}

export const receivedFromSend = (amount: number | "", fromAsset: string, toAsset: string, prices: Record<string, number>): number | "" => {
  if (amount === "" || !fromAsset || !toAsset) return ""
  const pf = prices[fromAsset]
  const pt = prices[toAsset]
  if (!pf || !pt) return ""
  const received = (Number(amount) * pf) / pt
  return Number.isFinite(received) ? Number(received) : ""
}

export const sendFromReceived = (receivedAmount: number | "", fromSend: string, toReceive: string, prices: Record<string, number>): number | "" => {
  if (receivedAmount === "" || !fromSend || !toReceive) return ""
  const ps = prices[fromSend]
  const pt = prices[toReceive]
  if (!ps || !pt) return ""
  const sendNeeded = (Number(receivedAmount) * pt) / ps
  return Number.isFinite(sendNeeded) ? Number(sendNeeded) : ""
}
