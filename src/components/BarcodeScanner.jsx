import { useEffect, useRef, useState } from 'react'

// ZXing is ~200KB, so it is imported dynamically — only paid for when the scanner opens.
async function createReader() {
  const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
    import('@zxing/browser'),
    import('@zxing/library'),
  ])
  const hints = new Map()
  // Restricting the formats to the ones on food packaging makes decoding noticeably faster.
  hints.set(DecodeHintType.POSSIBLE_FORMATS, [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
  ])
  return new BrowserMultiFormatReader(hints)
}

export default function BarcodeScanner({ onDetected, onError }) {
  const videoRef = useRef(null)
  const [status, setStatus] = useState('starting')
  const [message, setMessage] = useState(null)

  useEffect(() => {
    let controls = null
    let cancelled = false

    async function start() {
      try {
        const reader = await createReader()
        if (cancelled) return
        controls = await reader.decodeFromConstraints(
          { video: { facingMode: 'environment' } },
          videoRef.current,
          (result) => {
            if (result && !cancelled) {
              cancelled = true
              controls?.stop()
              onDetected(result.getText())
            }
          }
        )
        if (cancelled) controls?.stop()
        else setStatus('running')
      } catch (e) {
        if (cancelled) return
        setStatus('failed')
        // The realistic failure here is a denied or unavailable camera, which reads as a
        // permissions error rather than anything the user can act on directly.
        const text =
          e?.name === 'NotAllowedError'
            ? 'Kein Kamerazugriff. Erlaube ihn in den iOS-Einstellungen unter Safari bzw. für diese App.'
            : `Kamera konnte nicht gestartet werden: ${e?.message ?? e}`
        setMessage(text)
        onError?.(text)
      }
    }

    start()
    return () => {
      cancelled = true
      controls?.stop()
    }
  }, [onDetected, onError])

  return (
    <div className="scanner">
      <video ref={videoRef} className="scanner-video" muted playsInline />
      {status === 'running' && <div className="scanner-frame" />}
      {status === 'starting' && <p className="empty-state scanner-hint">Kamera wird gestartet…</p>}
      {status === 'failed' && <p role="alert">{message}</p>}
    </div>
  )
}
