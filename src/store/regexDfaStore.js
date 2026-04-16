import { create } from 'zustand'
import { convertRegexToDfa } from '../logic/regexToDfa'

const defaultRegex = '(a|b)*'

const formatTransitions = (transitions) =>
  transitions.map((transition) => `${transition.from},${transition.symbol}=${transition.to}`).join('\n')

export const useRegexDfaStore = create((set, get) => ({
  regex: defaultRegex,
  machineError: null,
  statesInput: '',
  startState: '',
  acceptStatesInput: '',
  transitionsInput: '',
  postfix: '',
  converted: false,
  setField: (field, value) =>
    set({
      [field]: value,
      machineError: null,
    }),
  convert: () => {
    try {
      const { regex } = get()
      const result = convertRegexToDfa(regex)

      set({
        machineError: null,
        postfix: result.postfix,
        statesInput: result.dfa.states.join(', '),
        startState: result.dfa.startState,
        acceptStatesInput: result.dfa.acceptStates.join(', '),
        transitionsInput: formatTransitions(result.dfa.transitions),
        converted: true,
      })
    } catch (error) {
      set({
        machineError: error.message,
        converted: false,
        statesInput: '',
        startState: '',
        acceptStatesInput: '',
        transitionsInput: '',
        postfix: '',
      })
    }
  },
  reset: () =>
    set({
      regex: defaultRegex,
      machineError: null,
      statesInput: '',
      startState: '',
      acceptStatesInput: '',
      transitionsInput: '',
      postfix: '',
      converted: false,
    }),
}))
