export type ExchangeSummary = {
  sendAmount: number
  receiveAmount: number
  approxUsdSendAmount: number
  approxUsdReceiveAmount: number
  sendAsset: string
  receiveAsset: string
  timestamp?: string
}
