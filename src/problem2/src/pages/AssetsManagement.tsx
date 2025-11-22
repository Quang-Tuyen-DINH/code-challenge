import { useEffect, useState } from 'react'
import AssetsSwap from '../components/AssetsSwap'
import type { ExchangeSummary } from '../shared/types/exchange'
import type { Asset } from '../shared/types/asset';
import "./AssetsManagement.scss";

function AssetsManagement() {
  const [assetsData, setAssetsData] = useState<Asset[]>([]);
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [summaryExchange, setSummaryExchange] = useState<ExchangeSummary | null>(null);
  
  useEffect(() => {
    const fetchAssets = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch("https://interview.switcheo.com/prices.json");
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const assets = await response.json();
        setAssetsData(assets);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? String(err))
      } finally {
        setLoading(false)
      }
    };

    fetchAssets();
  }, []);

  return (
    <main className='assets-management-container'>
      {!summaryExchange &&
        <section className='assets-management-container__form'>
          {loading && <div>Loading asset prices…</div>}
          {error && <div className='error'>Error loading prices</div>}
          <AssetsSwap assetsData={assetsData} onExchange={setSummaryExchange} loading={loading} error={error} />
        </section>
      }
      {summaryExchange &&
        <section className='assets-management-container__exchange-summary'>
          <h3>Your transaction has been done!</h3>
          <table className='assets-management-container__exchange-summary__table'>
            <tbody className='assets-management-container__exchange-summary__table__body'>
              <tr className='assets-management-container__exchange-summary__table__body__row'>
                <td className='assets-management-container__exchange-summary__table__body__row__first-col'>Send</td>
                <td className='assets-management-container__exchange-summary__table__body__row__second-col'>{summaryExchange.sendAmount} {summaryExchange.sendAsset}</td>
              </tr>
              <tr className='assets-management-container__exchange-summary__table__body__row'>
                <td className='assets-management-container__exchange-summary__table__body__row__first-col'>Receive</td>
                <td className='assets-management-container__exchange-summary__table__body__row__second-col'>{summaryExchange.receiveAmount} {summaryExchange.receiveAsset}</td>
              </tr>
              <tr className='assets-management-container__exchange-summary__table__body__row'>
                <td className='assets-management-container__exchange-summary__table__body__row__first-col'>Approx USD ({summaryExchange.sendAsset})</td>
                <td className='assets-management-container__exchange-summary__table__body__row__second-col'>${summaryExchange.approxUsdSendAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
              </tr>
              <tr className='assets-management-container__exchange-summary__table__body__row'>
                <td className='assets-management-container__exchange-summary__table__body__row__first-col'>Approx USD ({summaryExchange.receiveAsset})</td>
                <td className='assets-management-container__exchange-summary__table__body__row__second-col'>${summaryExchange.approxUsdReceiveAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
          <div className='assets-management-container__exchange-summary__actions'>
            <button onClick={() => setSummaryExchange(null)}>Make another transaction</button>
          </div>
        </section>
      }
    </main>
  )
}

export default AssetsManagement
