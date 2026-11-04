import { clampShift } from './position'

test.each([
  [{ left: 100, right: 300 }, { left: 8, right: 1272 }, 0],
  [{ left: 1100, right: 1380 }, { left: 8, right: 1272 }, -108],
  [{ left: -20, right: 200 }, { left: 8, right: 1272 }, 28],
  [{ left: 0, right: 400 }, { left: 8, right: 312 }, 8],
])('desloca a caixa %o para caber em %o', (box, bounds, shift) => {
  expect(clampShift(box, bounds)).toBe(shift)
})
