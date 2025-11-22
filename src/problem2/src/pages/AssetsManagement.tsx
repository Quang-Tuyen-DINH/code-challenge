import { useEffect, useState } from 'react'
import AssetsSwap, { type ExchangeSummary } from '../components/AssetsSwap'
import type { Asset } from '../shared/types/asset';

function AssetsManagement() {
  const [assetsData, setAssetsData] = useState<Asset[]>([]);
  const [summaryExchange, setSummaryExchange] = useState<ExchangeSummary | null>(null);
  
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const response = await fetch("https://interview.switcheo.com/prices.json");
        const assets = await response.json();
        setAssetsData(assets);
      } catch (error) {
        console.error(error);
      }
    };

    fetchAssets();
  }, []);

  return (
    <main>
      {!summaryExchange &&
        <section>
          <AssetsSwap assetsData={assetsData} onExchange={setSummaryExchange} />
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
