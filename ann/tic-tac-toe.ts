import * as brain from 'brain.js'
import { writeFileSync } from 'fs'
import { shuffle, fill, flatten } from 'lodash'

type AI = brain.NeuralNetwork<number[], number[]>

type Playthrough = {
  gameStates: {
    player: number
    state: number[]
    probabilityMap: number[] | null
    moveSelection: number
  }[]
  winner: number
}

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
  } as Playthrough
}

const conductIntelligentPlaythrough = (net: AI) => {
  const gameStates = []
  let player = 1
  let state = [0, 0, 0, 0, 0, 0, 0, 0, 0]
  let winner = null
  do {
    let probabilityMap = player === 1 ? net.run(state) : net.run(flipStatePlayers(state))
    // if (typeof probabilityMap === 'object') {
    //   probabilityMap = Object.values(probabilityMap)
    // }

    const { index: moveSelection } = probabilityMap
      .map((value, index) => (state[index] === 0 ? value : 0))
      .reduce(
        (highestIndex, probability, index) => {
          if (probability > highestIndex.probability) {
            highestIndex = { index, probability }
          }
          return highestIndex
        },
        { index: -1, probability: 0 },
      )

    gameStates.push({
      player,
      state: [...state],
      probabilityMap,
      moveSelection,
    })
    state[moveSelection] = player
    player = player === 1 ? -1 : 1
    winner = isWinner(state)
  } while (winner === null)
  return {
    gameStates,
    winner,
  } as Playthrough
}

// const flipStatePlayers = (state: number[]) => state.map(m => (m === 0 ? 0 : m === 1 ? -1 : 1))
const flipStatePlayers = (state: number[]) => state.map(m => m * -1 + 0)

const generateOutput = (state: number[], moveSelection: number, outcome: number) => {
  const output = fill(new Array(9), 0.5)
  for (let x = 0; x < state.length; x++) {
    if (state[x] !== 0) {
      output[x] = 0
    }
  }
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

const net: AI = new brain.NeuralNetwork({ hiddenLayers: [3] })

for (let x = 1; x <= 1000; x++) {
  console.log(x)
  const playthrough: Playthrough = x === 1 ? generateRandomPlaythrough() : conductIntelligentPlaythrough(net)
  const xTurns = playthrough.gameStates.filter(s => s.player === 1)
  // .map(s => ({ state: s.state, moveSelection: s.moveSelection }))
  const oTurns = playthrough.gameStates.filter(s => s.player === -1)
  // .map(s => ({ state: flipStatePlayers(s.state), moveSelection: s.moveSelection }))

  const trainingData = [
    ...xTurns.map(xTurn => ({
      input: xTurn.state,
      output: generateOutput(xTurn.state, xTurn.moveSelection, playthrough.winner),
    })),
    ...oTurns.map(oTurn => ({
      input: oTurn.state,
      output: generateOutput(oTurn.state, oTurn.moveSelection, playthrough.winner * -1),
    })),
  ]

  net.train(trainingData)
}

writeFileSync(
  'ann/tictactoeAI.ts',
  `export ${net.toFunction().toString().replace('anonymous(input', 'tictactoeAI(input: number[]')}`,
)

console.log(
  net.run(
    flatten([
      [1, -1, 0],
      [0, 1, 0],
      [-1, -1, 0],
    ]),
  ),
)
