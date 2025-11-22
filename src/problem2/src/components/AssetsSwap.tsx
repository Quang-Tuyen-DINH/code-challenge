import React, { useMemo, useEffect, useRef, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import "./AssetsSwap.scss"
import type { Asset } from '../shared/types/asset'
import type { ExchangeSummary } from '../shared/types/exchange'
import { getLatestPrices, receivedFromSend as calcReceivedFromSend, sendFromReceived as calcSendFromReceived } from '../shared/utils/swap'

type AssetsSwapProps = {
  assetsData: Asset[];
  loading?: boolean;
  error?: string | null;
  onExchange?: (summary: ExchangeSummary) => void;
}
    
type AssetSelectDisplayProps = {
  value: string;
  options: string[];
  onChange: (val: string) => void;
}

type SwapAmountInputProps = {
  label: string;
  value: number | "";
  onChange: (val: number | "") => void;
  approxUsd?: string | number;
  placeholder?: string;
  min?: string;
  step?: string;
}

const iconFiles = import.meta.glob('../assets/icons/tokens/*.svg', { eager: true, as: 'url' }) as Record<string, string> | Record<string, unknown>;
const ICONS: Record<string, string> = {};
Object.entries(iconFiles).forEach(([path, url]) => {
  const name = path.split('/').pop()?.replace('.svg', '').toLowerCase() ?? '';
  if (typeof url === 'string' && name) ICONS[name] = url;
});

const getIconSrc = (value?: string) => {
  if (!value) return '';
  return ICONS[value.toLowerCase()] ?? '';
}

const AssetSelectDisplay = React.memo(({ value, options, onChange }: AssetSelectDisplayProps) => {
  return (
      <div className='swap-row__asset-select-container'>
        <div className='asset-select-chip'>
          <img className='asset-icon' src={getIconSrc(value)} alt={`${value} icon`} />
        </div>
        <select
          name='asset-select-dropdown'
          className='asset-select-dropdown'
          value={value}
          onChange={(e) => onChange(e.target.value)}
        >
          {/* Sorry I am over 30 and I don't have enough time to customize the options' styles :D */}
          {options.map((opt) => (
            <option key={`'asset-select-option-${opt}`} className='asset-select-option' value={opt}>{opt}</option>
          ))}
        </select>
      </div>
  )
})

const SwapAmountInput = React.memo(({ label, value, onChange, approxUsd, placeholder = '0.0', min, step }: SwapAmountInputProps) => {
  return (
    <div className='swap-row__input-container'>
      <label className='swap-label'>
        <div className='swap-label__value'>{label}</div>
        <input
          className='swap-amount-input'
          name='swap-amount-input'
          type='number'
          inputMode='decimal'
          value={value === "" ? "" : String(value)}
          onChange={(e) => {
            const v = e.target.value
            const parsed = v === '' ? '' : Number(v)
            onChange(parsed)
          }}
          placeholder={placeholder}
          min={min}
          step={step}
        />
        <div className='swap-approx-usd'>{approxUsd ?? ''}</div>
      </label>
    </div>
  )
})

function AssetsSwap({
  assetsData,
  onExchange
}: AssetsSwapProps) {
  const { watch, setValue, getValues } = useForm<{
    sendAmount: number | "";
    receiveAmount: number | "";
    sendAsset: string;
    receiveAsset: string
  }>({
    defaultValues: {
      sendAmount: "",
      receiveAmount: "",
      sendAsset: "",
      receiveAsset: "",
    }
  })

  const sendAmount = watch('sendAmount');
  const receiveAmount = watch('receiveAmount');
  const sendAsset = watch('sendAsset');
  const receiveAsset = watch('receiveAsset');

  const lastChanged = useRef<'send'|'receive'|null>(null);

  const handleChangeSendAmount = (parsed: number | "") => {
    lastChanged.current = 'send';
    setValue('sendAmount', parsed);
    debouncedCalcReceive(parsed, getValues('sendAsset') || sendAsset, getValues('receiveAsset') || receiveAsset);
  }

  const handleChangeReceiveAmount = (parsed: number | "") => {
    lastChanged.current = 'receive';
    setValue('receiveAmount', parsed);
    debouncedCalcSend(parsed, getValues('sendAsset') || sendAsset, getValues('receiveAsset') || receiveAsset);
  }

  const approxUsd = (amount: number | "", asset: string) => {
    if (amount === "" || !asset) return 0;
    const p = prices[asset];
    if (!p) return 0;
    return Number((Number(amount) * p));
  }

  const formatUsd = (v: number | "") => {
    if (v === "" || v === undefined || v === null) return ''
    try {
      return Number(v).toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 })
    } catch (e) { return String(v) }
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
    return getLatestPrices(assetsData);
  }, [assetsData]);
  const options = useMemo(() => Array.from(new Set(assetsData.map((d) => d.currency))), [assetsData]);

  useEffect(() => {
    if (options.length === 0) return;
    if (!sendAsset) {
      setValue('sendAsset', options[0]);
    }

    if (!receiveAsset) {
      setValue('receiveAsset', options[1] ?? options[0]);
    }

    if (sendAmount !== "") {
      const rec = calcReceivedFromSend(sendAmount, sendAsset || options[0], receiveAsset || (options[1] ?? options[0]), prices)
      if (rec !== "" && Number.isFinite(rec as number)) setValue('receiveAmount', rec);
    }
  }, [options, prices])

  const debouncedRef = useRef<{ t?: number | null }>({ t: null })
  const debouncedCalcReceive = useCallback((amount: number | "", from: string, to: string) => {
    if (debouncedRef.current.t) window.clearTimeout(debouncedRef.current.t)
    debouncedRef.current.t = window.setTimeout(() => {
      const rec = calcReceivedFromSend(amount, from, to, prices)
      if (rec !== "" && Number.isFinite(rec as number)) setValue('receiveAmount', rec)
    }, 250)
  }, [prices, setValue])

  const debouncedCalcSend = useCallback((amount: number | "", from: string, to: string) => {
    if (debouncedRef.current.t) window.clearTimeout(debouncedRef.current.t)
    debouncedRef.current.t = window.setTimeout(() => {
      const send = calcSendFromReceived(amount, from, to, prices)
      if (send !== "" && Number.isFinite(send as number)) setValue('sendAmount', send)
    }, 250)
  }, [prices, setValue])

  // small validation: require positive numbers and different assets
  const isValid = useMemo(() => {
    const sa = sendAmount
    const ra = receiveAmount
    if (sa === "" || ra === "") return false
    if (!sendAsset || !receiveAsset) return false
    if (sendAsset === receiveAsset) return false
    if (Number(sa) <= 0 || Number(ra) <= 0) return false
    return true
  }, [sendAmount, receiveAmount, sendAsset, receiveAsset])

  return (
    <div className="assets-swap-container">
      <main className='swap-inputs-container'>
        {/* You send block */}
        <section className='swap-row send-row'>
          <SwapAmountInput
            label='You send'
            value={sendAmount}
            onChange={handleChangeSendAmount}
            approxUsd={formatUsd(approxUsd(sendAmount, sendAsset))}
            placeholder='0.0'
            min='0'
            step='any'
          />
          <AssetSelectDisplay
            value={sendAsset}
            options={options}
            onChange={(val) => {
              setValue('sendAsset', val);
              const rec = calcReceivedFromSend(sendAmount, val, receiveAsset, prices);
              if (rec !== "" && Number.isFinite(rec as number)) setValue('receiveAmount', rec);
            }}
          />
        </section>

        {/* You receive block */}
        <section className='swap-row receive-row'>
          <SwapAmountInput
            label='You receive'
            value={receiveAmount}
            onChange={handleChangeReceiveAmount}
            approxUsd={formatUsd(approxUsd(receiveAmount, receiveAsset))}
            placeholder='0.0'
          />
          <div className='swap-row__right'>
            <AssetSelectDisplay
              value={receiveAsset}
              options={options}
              onChange={(val) => {
                setValue('receiveAsset', val);
                const rec = calcReceivedFromSend(sendAmount, sendAsset, val, prices);
                if (rec !== "" && Number.isFinite(rec as number)) setValue('receiveAmount', rec);
              }}
            />
          </div>
        </section>
      </main>
      <div className='swap-actions'>
        <button
          className='exchange-button'
          onClick={handleExchange}
          disabled={!isValid}
          aria-disabled={!isValid}
        >
          Exchange
        </button>
      </div>
    </div>
  )
}

export default AssetsSwap
