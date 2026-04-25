export function Icon({ name, className = 'w-5 h-5' }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round' }
  switch (name) {
    case 'settings':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z"/></svg>)
    case 'history':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/><path d="M12 7v5l3 2"/></svg>)
    case 'close':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M18 6 6 18M6 6l12 12"/></svg>)
    case 'save':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z"/><path d="M17 21v-8H7v8M7 3v5h8"/></svg>)
    case 'pdf':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/><path d="M14 3v6h6"/><path d="M9 13h6M9 17h4"/></svg>)
    case 'whatsapp':
      return (<svg viewBox="0 0 24 24" className={className} fill="currentColor"><path d="M20.5 3.5A11 11 0 0 0 3.3 17.4L2 22l4.7-1.2a11 11 0 0 0 5.3 1.3h.1a11 11 0 0 0 8.4-18.6Zm-8.4 17a9 9 0 0 1-4.6-1.3l-.3-.2-2.8.7.7-2.7-.2-.3a9 9 0 1 1 7.2 3.8Zm5-6.7c-.3-.1-1.7-.9-2-1-.3-.1-.5-.2-.7.2s-.8 1-.9 1.1c-.2.2-.3.2-.6.1a7.4 7.4 0 0 1-3.7-3.2c-.3-.5.3-.5.8-1.6.1-.2 0-.3 0-.5 0-.1-.7-1.6-.9-2.1-.2-.6-.5-.5-.7-.5h-.6a1.1 1.1 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.5c0 1.5 1.1 2.9 1.2 3.1.1.2 2.1 3.3 5.2 4.6.7.3 1.3.5 1.7.6a4 4 0 0 0 1.9.1 3 3 0 0 0 2-1.4c.3-.5.3-1 .2-1.1 0-.2-.3-.3-.6-.4Z"/></svg>)
    case 'trash':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/></svg>)
    case 'calculator':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><rect x="4" y="3" width="16" height="18" rx="3"/><path d="M8 7h8M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h4"/></svg>)
    case 'plus':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M12 5v14M5 12h14"/></svg>)
    case 'minus':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M5 12h14"/></svg>)
    case 'check':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M20 6 9 17l-5-5"/></svg>)
    case 'sun':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>)
    case 'moon':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>)
    case 'user':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="M20 21a8 8 0 1 0-16 0"/><circle cx="12" cy="7" r="4"/></svg>)
    case 'chevron-down':
      return (<svg viewBox="0 0 24 24" className={className} {...common}><path d="m6 9 6 6 6-6"/></svg>)
    default: return null
  }
}
