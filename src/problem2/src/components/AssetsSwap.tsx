import { useMemo, useState } from 'react'
import "./AssetsSwap.scss"
import type { Asset } from '../shared/types/asset'

type AssetsSwapProps = {
  assetsData: Asset[];
}
    
type AssetSelectDisplayProps = {
  value: string
  options: string[]
  onChange: (val: string) => void
}

function AssetsSwap({
  assetsData
}: AssetsSwapProps) {

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
    const prices = useMemo(() => {
      const map: Record<string, number> = {};
      assetsData.forEach((d) => {
        map[d.currency] = d.price;
      })
      return map;
    }, [assetsData]);
    const options = useMemo(() => Array.from(new Set(assetsData.map((d) => d.currency))), [assetsData]);

    const [sendAmount, setSendAmount] = useState<number | "">(0.5);
    const [sendAsset, setSendAsset] = useState<string>(options[0] ?? "");
    const [receiveAsset, setReceiveAsset] = useState<string>(options[1] ?? options[0] ?? "");

    const approxUsd = (amount: number | "", asset: string) => {
      if (!amount || !asset) return "-";
      const p = prices[asset]
      if (!p) return "-";

      try {
        return `$${(Number(amount) * p).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
      } catch {
        return "-"
      }
    }

    const estimateReceived = (amount: number | "", from: string, to: string) => {
      if (!amount || !from || !to) return ""
      const pf = prices[from]
      const pt = prices[to]
      if (!pf || !pt) return ""
      const usd = Number(amount) * pf
      const received = usd / pt
      return received
    }

    return (
      <div className="assets-swap-container">
        <main className='swap-input-container'>
          {/* You send block */}
          <section className='swap-row send-row'>
            <div className='swap-row__left'>
              <label className='swap-label'>You send</label>
              <input
                className='swap-amount-input'
                type='number'
                inputMode='decimal'
                value={sendAmount}
                onChange={(e) => {
                  const v = e.target.value
                  setSendAmount(v === "" ? "" : Number(v))
                }}
                placeholder='0.0'
                min='0'
                step='any'
              />
              <div className='swap-approx-usd'>{approxUsd(sendAmount, sendAsset)}</div>
            </div>

            <div className='swap-row__right'>
              <AssetSelectDisplay value={sendAsset} options={options} onChange={setSendAsset} />
            </div>
          </section>

          {/* You receive block */}
          <section className='swap-row receive-row'>
            <div className='swap-row__left'>
              <label className='swap-label'>You receive</label>
              <input
                className='swap-amount-input'
                type='number'
                inputMode='decimal'
                value={estimateReceived(sendAmount, sendAsset, receiveAsset) || ""}
                readOnly
                placeholder='0.0'
              />
              <div className='swap-approx-usd'>
                {approxUsd(estimateReceived(sendAmount, sendAsset, receiveAsset) as number, receiveAsset)}
              </div>
            </div>

            <div className='swap-row__right'>
              <AssetSelectDisplay value={receiveAsset} options={options} onChange={setReceiveAsset} />
            </div>
          </section>
        </main>
      </div>
    )
}

export default AssetsSwap
