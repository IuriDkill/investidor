import { adviseBudget } from './budget'

const ids = (input: Parameters<typeof adviseBudget>[0]) => adviseBudget(input).advice.map((item) => item.id)

test('só com o salário, divide em 50/30/20', () => {
  const r = adviseBudget({ salary: 5000, expensiveDebt: false })
  expect(r.essentialsKnown).toBe(false)
  expect(r.essentials).toBe(2500)
  expect(r.wants).toBe(1500)
  expect(r.invest).toBe(1000)
})

test('quem gasta pouco com essenciais investe mais que 20%', () => {
  const r = adviseBudget({ salary: 5000, essentials: 1500, expensiveDebt: false })
  expect(r.invest).toBe(2000)
  expect(r.wants).toBe(1500)
})

test('essenciais altos reduzem os desejos antes do investimento e geram alerta', () => {
  const r = adviseBudget({ salary: 5000, essentials: 3500, expensiveDebt: false })
  expect(r.invest).toBe(1000)
  expect(r.wants).toBe(500)
  const advice = r.advice.find((item) => item.id === 'essentials-high')
  expect(advice?.tone).toBe('warning')
  expect(advice?.title).toContain('70%')
})

test('com quase tudo comprometido, investe o que sobra', () => {
  const r = adviseBudget({ salary: 5000, essentials: 4500, expensiveDebt: false })
  expect(r.invest).toBe(500)
  expect(r.wants).toBe(0)
})

test('dívida cara vem primeiro e recebe o valor de investir', () => {
  const r = adviseBudget({ salary: 5000, expensiveDebt: true })
  expect(r.invest).toBe(0)
  expect(r.toDebt).toBe(1000)
  expect(r.advice[0]).toMatchObject({ id: 'expensive-debt', tone: 'alert' })
  expect(ids({ salary: 5000, expensiveDebt: true })).not.toContain('reserve-building')
})

test('gastos acima do salário geram déficit', () => {
  const r = adviseBudget({ salary: 5000, essentials: 4000, debtPayments: 1500, expensiveDebt: false })
  expect(r.deficit).toBe(500)
  expect(r.invest).toBe(0)
  expect(r.wants).toBe(0)
  expect(r.advice[0]).toMatchObject({ id: 'deficit', tone: 'alert' })
})

test('parcelas acima de 30% do salário geram alerta', () => {
  expect(ids({ salary: 5000, debtPayments: 2000, expensiveDebt: false })).toContain('debt-load')
  expect(ids({ salary: 5000, debtPayments: 1500, expensiveDebt: false })).not.toContain('debt-load')
})

test('mostra quanto a reserva cobre e quando ela se completa', () => {
  const r = adviseBudget({ salary: 5000, essentials: 2000, reserve: 3000, expensiveDebt: false })
  expect(r.reserve.target).toBe(12000)
  expect(r.reserve.monthsCovered).toBe(1.5)
  expect(r.invest).toBe(1500)
  expect(r.reserve.monthsToComplete).toBe(6)
  expect(r.reserve.complete).toBe(false)
  expect(r.advice.map((item) => item.id)).toContain('reserve-building')
})

test('reserva completa aponta para os objetivos', () => {
  const r = adviseBudget({ salary: 5000, essentials: 2000, reserve: 15000, expensiveDebt: false })
  expect(r.reserve.complete).toBe(true)
  expect(r.reserve.monthsToComplete).toBe(0)
  expect(r.advice.map((item) => item.id)).toContain('reserve-complete')
  expect(r.advice.map((item) => item.id)).not.toContain('reserve-building')
})

test('sem sobra para investir, a reserva não tem prazo', () => {
  const r = adviseBudget({ salary: 5000, essentials: 5000, expensiveDebt: false })
  expect(r.invest).toBe(0)
  expect(r.reserve.monthsToComplete).toBeNull()
})

test.each([
  { salary: 5000 },
  { salary: 3200, essentials: 1000 },
  { salary: 3200, essentials: 2900, debtPayments: 100 },
  { salary: 12000, essentials: 4000, debtPayments: 1500 },
])('sem déficit, as partes somam o salário (%o)', (input) => {
  for (const expensiveDebt of [false, true]) {
    const r = adviseBudget({ ...input, expensiveDebt })
    expect(r.essentials + r.debtPayments + r.wants + r.invest + r.toDebt).toBeCloseTo(input.salary, 9)
  }
})
