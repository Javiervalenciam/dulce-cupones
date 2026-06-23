const INSTAGRAM = process.env.NEXT_PUBLIC_INSTAGRAM || 'https://instagram.com/dulcemezcla.reposteria'
const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || 'https://wa.me/573143495267'

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.9" />
      <circle cx="17.2" cy="6.8" r="1.2" fill="currentColor" />
    </svg>
  )
}

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M5.4 18.7 6.3 15A7.2 7.2 0 1 1 9 17.7l-3.6 1Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.4 8.4c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.6 1.4c.1.2.1.4-.1.6l-.4.5c-.1.1-.2.3 0 .5.5.9 1.2 1.6 2.1 2.1.2.1.4.1.5 0l.6-.7c.2-.2.4-.2.6-.1l1.5.7c.2.1.3.3.3.5 0 .5-.3 1.2-.7 1.5-.6.4-1.5.4-2.5.1-1.8-.6-3.9-2.2-5.1-4.2-.7-1.2-.8-2.1-.5-2.7l.4-.7Z"
        fill="currentColor"
      />
    </svg>
  )
}

export default function SocialFooter() {
  return (
    <footer className="social" aria-labelledby="social-title">
      <p id="social-title" className="social-title">
        Síguenos y escríbenos
      </p>
      <div className="social-row">
        <a
          className="social-link social-link--instagram"
          href={INSTAGRAM}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Abrir Instagram de Dulce Mezcla"
        >
          <InstagramIcon />
          <span>Instagram</span>
        </a>
        <a
          className="social-link social-link--whatsapp"
          href={WHATSAPP}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Escribir a Dulce Mezcla por WhatsApp"
        >
          <WhatsAppIcon />
          <span>WhatsApp</span>
        </a>
      </div>
    </footer>
  )
}
