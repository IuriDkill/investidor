import { act, renderHook } from '@testing-library/react'
import { ASSUMPTION_DEFAULTS } from '@/config/rates'
import { useAssumptions } from './useAssumptions'

beforeEach(() => {
  localStorage.clear()
})

test('começa com os padrões', () => {
  const { result } = renderHook(() => useAssumptions())
  expect(result.current.values).toEqual(ASSUMPTION_DEFAULTS)
  expect(result.current.assumptions?.cdiAnnual).toBe(0.1365)
})

test('uma alteração sobrevive a uma nova visita', () => {
  const first = renderHook(() => useAssumptions())
  act(() => first.result.current.update('cdiAnnual', '10'))
  first.unmount()

  const second = renderHook(() => useAssumptions())
  expect(second.result.current.values.cdiAnnual).toBe('10')
  expect(second.result.current.assumptions?.cdiAnnual).toBe(0.1)
})

test('salva só o que difere do padrão, para novos padrões chegarem ao visitante', () => {
  const { result } = renderHook(() => useAssumptions())
  act(() => result.current.update('cdiAnnual', '10'))
  expect(JSON.parse(localStorage.getItem('assumptions') ?? '{}')).toEqual({ cdiAnnual: '10' })
})

test('campo inválido anula as premissas sem perder o texto', () => {
  const { result } = renderHook(() => useAssumptions())
  act(() => result.current.update('selicAnnual', 'abc'))
  expect(result.current.values.selicAnnual).toBe('abc')
  expect(result.current.assumptions).toBeNull()
})

test('restaurar volta aos padrões e limpa o que foi salvo', () => {
  const { result } = renderHook(() => useAssumptions())
  act(() => result.current.update('cdiAnnual', '10'))
  act(() => result.current.reset())
  expect(result.current.values).toEqual(ASSUMPTION_DEFAULTS)
  expect(localStorage.getItem('assumptions')).toBeNull()
})

test.each(['não é json', 'null', '[1]', '{"cdiAnnual":5,"desconhecido":"1"}'])(
  'dado salvo inválido (%s) cai nos padrões',
  (stored) => {
    localStorage.setItem('assumptions', stored)
    const { result } = renderHook(() => useAssumptions())
    expect(result.current.values).toEqual(ASSUMPTION_DEFAULTS)
  },
)
