'use client'

export default function ShareButtons({ url, texto }) {
  const t = encodeURIComponent(texto || '')
  const u = encodeURIComponent(url || '')
  const wa = 'https://wa.me/?text=' + t + '%20' + u
  const tg = 'https://t.me/share/url?url=' + u + '&text=' + t

  async function nativo() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: texto, url })
      } catch (e) {
        /* cancelado */
      }
    }
  }

  const tieneNativo = typeof navigator !== 'undefined' && !!navigator.share

  return (
    <div className="share">
      <a className="share-btn wa" href={wa} target="_blank" rel="noreferrer">
        WhatsApp
      </a>
      <a className="share-btn tg" href={tg} target="_blank" rel="noreferrer">
        Telegram
      </a>
      {tieneNativo && (
        <button type="button" className="share-btn nat" onClick={nativo}>
          Compartir
        </button>
      )}
    </div>
  )
}
