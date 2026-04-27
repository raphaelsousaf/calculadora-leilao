export function calculate({ arremate, commissionPct, suretyPct, installments }) {
  const bid = Number(arremate) || 0
  const cPct = Number(commissionPct) || 0
  const sPct = Number(suretyPct) || 0
  const n = Math.max(1, Math.floor(Number(installments) || 1))

  const entry = bid * 0.25
  const commission = bid * (cPct / 100)
  const surety = bid * (sPct / 100)
  const upfront = entry + commission + surety
  const remaining = bid * 0.75
  const installment = remaining / n
  const total = bid + commission

  return {
    bid,
    commissionPct: cPct,
    suretyPct: sPct,
    installments: n,
    entry,
    commission,
    surety,
    upfront,
    remaining,
    installment,
    total,
  }
}
