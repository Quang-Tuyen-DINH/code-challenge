import { useMemo, useState, useEffect } from 'react'
import "./AssetsSwap.scss"
import type { Asset } from '../shared/types/asset'

type AssetsSwapProps = {
  assetsData: Asset[];
  onExchange?: (summary: ExchangeSummary) => void;
}
    
type AssetSelectDisplayProps = {
  value: string
  options: string[]
  onChange: (val: string) => void
}

type SwapAmountInputProps = {
  label: string
  value: number | ""
  onChange: (val: number | "") => void
  approxUsd?: number
  placeholder?: string
  min?: string
  step?: string
}

export type ExchangeSummary = {
  sendAmount: number
  receiveAmount: number
  approxUsdSendAmount: number
  approxUsdReceiveAmount: number
  sendAsset: string
  receiveAsset: string
}

function AssetsSwap({
  assetsData,
  onExchange
}: AssetsSwapProps) {

  // Removed unused local callback type

  const AssetSelectDisplay = ({ value, options, onChange }: AssetSelectDisplayProps) => {
    return (
      <div className='asset-select-display'>
        <select
          className='asset-select'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        <div className='asset-chip'>{value}</div>
      </div>
    )
  }

  const SwapAmountInput = ({ label, value, onChange, approxUsd, placeholder = '0.0', min, step }: SwapAmountInputProps) => {
    return (
      <div className='swap-row__left'>
        <label className='swap-label'>
          {label}
          <input
            className='swap-amount-input'
            type='number'
            inputMode='decimal'
            value={value}
            onChange={(e) => {
              const v = e.target.value
              const parsed = v === '' ? '' : Number(v)
              onChange(parsed)
            }}
            placeholder={placeholder}
            min={min}
            step={step}
          />
          <div className='swap-approx-usd'>{approxUsd}</div>
        </label>
      </div>
    )
  }

  const handleChangeSendAmount = (parsed: number | "") => {
    setSendAmount(parsed);
    const rec = receivedFromSend(parsed, sendAsset, receiveAsset);
    if (rec !== "" && Number.isFinite(rec as number)) setReceiveAmount(rec);
  }

  const handleChangeReceiveAmount = (parsed: number | "") => {
    setReceiveAmount(parsed);
    const send = sendFromReceived(parsed, sendAsset, receiveAsset);
    if (send !== "" && Number.isFinite(send as number)) setSendAmount(send);
  }

  const approxUsd = (amount: number | "", asset: string) => {
    if (amount === "" || !asset) return 0
    const p = prices[asset]
    if (!p) return 0
    return Number((Number(amount) * p))
  }

  const handleExchange = () => {
    const summary: ExchangeSummary = {
      sendAmount: sendAmount === "" ? 0 : Number(sendAmount),
      receiveAmount: receiveAmount === "" ? 0 : Number(receiveAmount),
      approxUsdSendAmount: approxUsd(sendAmount, sendAsset),
      approxUsdReceiveAmount: approxUsd(receiveAmount, receiveAsset),
      sendAsset,
      receiveAsset,
    }
    if (typeof onExchange === 'function') onExchange(summary)
  }

  const prices = useMemo(() => {
    const map: Record<string, number> = {};
    assetsData.forEach((d) => {
      map[d.currency] = d.price;
    })
    return map;
  }, [assetsData]);
  const options = useMemo(() => Array.from(new Set(assetsData.map((d) => d.currency))), [assetsData]);
  const [sendAmount, setSendAmount] = useState<number | "">("");
  const [receiveAmount, setReceiveAmount] = useState<number | "">("");
  const [sendAsset, setSendAsset] = useState<string>(options[0] ?? "");
  const [receiveAsset, setReceiveAsset] = useState<string>(options[1] ?? "");

  useEffect(() => {
    if (options.length === 0) return;
    if (!sendAsset) {
      setSendAsset(options[0])
    }

    if (!receiveAsset) {
      setReceiveAsset(options[1] ?? options[0])
    }
    if (sendAmount !== "") {
      const rec = receivedFromSend(sendAmount, sendAsset || options[0], receiveAsset || (options[1] ?? options[0]))
      if (rec !== "" && Number.isFinite(rec as number)) setReceiveAmount(rec)
    }
  }, [options])

  const receivedFromSend = (amount: number | "", fromAsset: string, toAsset: string): number | "" => {
    if (amount === "" || !fromAsset || !toAsset) return "";
    const pf = prices[fromAsset];
    const pt = prices[toAsset];
    if (!pf || !pt) return "";
    const received = (Number(amount) * pf) / pt;
    return Number.isFinite(received) ? Number(received) : "";
  }

  const sendFromReceived = (receivedAmount: number | "", fromSend: string, toReceive: string): number | "" => {
    if (receivedAmount === "" || !fromSend || !toReceive) return "";
    const ps = prices[fromSend];
    const pt = prices[toReceive];
    if (!ps || !pt) return "";
    const sendNeeded = (Number(receivedAmount) * pt) / ps;
    return Number.isFinite(sendNeeded) ? Number(sendNeeded) : "";
  }

  return (
    <div className="assets-swap-container">
      <main className='swap-input-container'>
        {/* You send block */}
        <section className='swap-row send-row'>
          <SwapAmountInput
            label='You send'
            value={sendAmount}
            onChange={handleChangeSendAmount}
            approxUsd={approxUsd(sendAmount, sendAsset)}
            placeholder='0.0'
            min='0'
            step='any'
          />
          <div className='swap-row__right'>
            <AssetSelectDisplay
              value={sendAsset}
              options={options}
              onChange={(val) => {
                setSendAsset(val)
                const rec = receivedFromSend(sendAmount, val, receiveAsset)
                if (rec !== "" && Number.isFinite(rec as number)) setReceiveAmount(rec)
              }}
            />
          </div>
        </section>

        {/* You receive block */}
        <section className='swap-row receive-row'>
          <SwapAmountInput
            label='You receive'
            value={receiveAmount}
            onChange={handleChangeReceiveAmount}
            approxUsd={approxUsd(receiveAmount, receiveAsset)}
            placeholder='0.0'
          />
          <div className='swap-row__right'>
            <AssetSelectDisplay
              value={receiveAsset}
              options={options}
              onChange={(val) => {
                setReceiveAsset(val)
                const rec = receivedFromSend(sendAmount, sendAsset, val)
                if (rec !== "" && Number.isFinite(rec as number)) setReceiveAmount(rec)
              }}
            />
          </div>
        </section>
      </main>
      <div className='swap-actions'>
        <button className='exchange-button' onClick={handleExchange}>Exchange</button>
      </div>
    </div>
  )
}

export default AssetsSwap
