import * as brain from 'brain.js'
import { shuffle, fill } from 'lodash'

// given a current state, determine if there is a winner and return:
// 1: X won
// 0: tie
// -1: O won
// null: game not over
const isWinner = (state: number[]) => {
  const winningStates = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ]
  let result = null
  if (state.filter(num => num === 0).length === 0) {
    result = 0
  }
  for (let w = 0; w < winningStates.length; w++) {
    if (winningStates[w].every(i => state[i] === 1)) {
      result = 1
      break
    }
    if (winningStates[w].every(i => state[i] === -1)) {
      result = -1
      break
    }
  }
  return result
}

// console.log(isWinner([1, 0, -1, 0, 1, -1, -1, 0, 1]), '1 (X) should win')
// console.log(isWinner([-1, -1, -1, 1, 0, 0, 1, 1, 0]), '-1 (O) should win')
// console.log(isWinner([1, -1, 1, 1, -1, -1, -1, 1, 1]), '0 - tie')
// console.log(isWinner([0, 0, 0, 0, 0, 0, 0, 0, 0]), 'null, keep playing')
// console.log(isWinner([-1, -1, 1, 1, 1, 0, -1, 1, 0]), 'null, keep playing')

const getMovePossibilities = (state: number[]) =>
  state.reduce((possibilities, value, idx) => {
    if (value === 0) {
      possibilities.push(idx)
    }
    return possibilities
  }, [] as number[])

const generateRandomPlaythrough = () => {
  const gameStates = []
  let player = 1
  let state = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let winner = null
  do {
    const movePossibilities = getMovePossibilities(state)
    const moveSelection = shuffle(movePossibilities)[0]
    gameStates.push({
      player,
      state: [...state],
      moveSelection,
    })
    state[moveSelection] = player
    player = player === 1 ? -1 : 1
    winner = isWinner(state)
  } while (winner === null)
  return {
    gameStates,
    winner,
  }
}

const flipStatePlayers = (state: number[]) => state.map(m => (m === 0 ? 0 : m === 1 ? -1 : 1))

const generateOutput = (moveSelection: number, outcome: number) => {
  const output = fill(new Array(9), 0.5)
  if (outcome === 1) {
    output[moveSelection] = 0.9
  }
  if (outcome === 0) {
    output[moveSelection] = 0.7
  }
  if (outcome === -1) {
    output[moveSelection] = 0.1
  }
  return output
}

const net = new brain.NeuralNetwork({ hiddenLayers: [3] })

const playthrough = generateRandomPlaythrough()
const xTurns = playthrough.gameStates
  .filter(s => s.player === 1)
  .map(s => ({ state: s.state, moveSelection: s.moveSelection }))
const oTurns = playthrough.gameStates
  .filter(s => s.player === -1)
  .map(s => ({ state: flipStatePlayers(s.state), moveSelection: s.moveSelection }))

const trainingData = [
  ...xTurns.map(xTurn => ({ input: xTurn.state, output: generateOutput(xTurn.moveSelection, playthrough.winner) })),
  ...oTurns.map(oTurn => ({
    input: oTurn.state,
    output: generateOutput(oTurn.moveSelection, playthrough.winner * -1),
  })),
]

// console.log(trainingData)

net.train(trainingData)

console.log(net.run([0, 0, 0, 0, 0, 0, 0, 0, 0]))
