import { axisMargin, linePath, monthTicks, ticksForWidth, tooltipLeft, yDomain } from './geometry'

test('série zerada ainda tem escala', () => {
  expect(yDomain([0, 0, 0])).toEqual([0, 1])
})

test('série sem variação fica abaixo do topo', () => {
  expect(yDomain([1000, 1000])[1]).toBeGreaterThan(1000)
})

test('a escala começa em zero e cobre o maior valor', () => {
  const [min, max] = yDomain([0, 1234])
  expect(min).toBe(0)
  expect(max).toBeGreaterThanOrEqual(1234)
  expect(max).toBeLessThan(2000)
})

test('valores enormes continuam finitos', () => {
  const huge = [1e9, 1e24]
  const domain = yDomain(huge)
  expect(Number.isFinite(domain[1])).toBe(true)
  expect(linePath(huge, 100, 50, domain)).not.toMatch(/NaN|Infinity/)
})

test('desenha a linha de baixo para cima', () => {
  expect(linePath([0, 10], 100, 50, [0, 10])).toBe('M0 50L100 0')
})

test('um ponto só não gera NaN', () => {
  expect(linePath([5], 100, 50, [0, 10])).not.toMatch(/NaN|Infinity/)
})

test('linha reta sem variação não gera NaN', () => {
  expect(linePath([5, 5], 100, 50, [0, 10])).toBe('M0 25L100 25')
})

test.each([
  [100, 200, 500, 112],
  [400, 200, 500, 188],
  [120, 205, 246, 0],
  [150, 205, 246, 0],
  [10, 300, 246, 0],
])('tooltip no ponto %i com largura %i em %i px', (anchor, tooltipWidth, containerWidth, left) => {
  expect(tooltipLeft(anchor, tooltipWidth, containerWidth)).toBe(left)
})

test('a margem do eixo cabe o maior rótulo', () => {
  expect(axisMargin(['R$ 0', 'R$ 22,5 mil'])).toBe(86)
})

test('telas estreitas usam menos marcas', () => {
  expect(monthTicks(60, 3)).toEqual([0, 60])
  expect(monthTicks(12, 3)).toEqual([0, 6, 12])
})

test.each([
  [1, [0, 1]],
  [12, [0, 3, 6, 9, 12]],
  [60, [0, 12, 24, 36, 48, 60]],
  [600, [0, 120, 240, 360, 480, 600]],
])('marcas do eixo para %i meses', (months, ticks) => {
  expect(monthTicks(months)).toEqual(ticks)
})

test.each([
  [600, 90, [600]],
  [60, 180, [0, 60]],
  [60, 800, [0, 12, 24, 36, 48, 60]],
])('escolhe as marcas para %i meses em %i px', (months, plotWidth, ticks) => {
  expect(ticksForWidth(months, plotWidth)).toEqual(ticks)
})
