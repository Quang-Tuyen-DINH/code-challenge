import React, { useEffect, useState } from 'react'
import AssetsSwap from '../components/AssetsSwap'
import type { Asset } from '../shared/types/asset';

function AssetsManagement() {
  const [assetsData, setAssetsData] = useState<Asset[]>([]);
  
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
      <section>
        <AssetsSwap assetsData={assetsData}/>
      </section>
    </main>
  )
}

export default AssetsManagement
