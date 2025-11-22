import { useEffect, useState } from 'react'
import AssetsSwap from '../components/AssetsSwap'
import type { ExchangeSummary } from '../shared/types/exchange'
import type { Asset } from '../shared/types/asset';

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
    <main>
      {!summaryExchange &&
        <section>
          {loading && <div>Loading asset prices…</div>}
          {error && <div className='error'>Error loading prices: {error}</div>}
          <AssetsSwap assetsData={assetsData} onExchange={setSummaryExchange} loading={loading} error={error} />
        </section>
      }
      {summaryExchange &&
        <section>
          <h3>Review exchange before making transaction</h3>
          <table>
            <tbody>
              <tr>
                <td>Send</td>
                <td>{summaryExchange.sendAmount} {summaryExchange.sendAsset}</td>
              </tr>
              <tr>
                <td>Receive</td>
                <td>{summaryExchange.receiveAmount} {summaryExchange.receiveAsset}</td>
              </tr>
              <tr>
                <td>Approx USD (send)</td>
                <td>${summaryExchange.approxUsdSendAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
              </tr>
              <tr>
                <td>Approx USD (receive)</td>
                <td>${summaryExchange.approxUsdReceiveAmount.toLocaleString(undefined, {maximumFractionDigits:2})}</td>
              </tr>
            </tbody>
          </table>
          <div>
            <button>Make transaction</button>
          </div>
        </section>
      }
    </main>
  )
}

export default AssetsManagement
