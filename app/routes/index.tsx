import { useState } from 'react'
import { tictactoeAI } from '../../ann/tictactoeAI'

export default function Index() {
  const [gameState, setGameState] = useState<(1 | 0 | -1)[]>([0, 0, 0, 0, 0, 0, 0, 0, 0])
  const executePlayerMove = (moveIdx: number) => {
    if (gameState[moveIdx] === 0) {
      const newState = [...gameState]
      newState[moveIdx] = 1
      const aiResponse = tictactoeAI(newState).reduce(
        (response, probability, idx) => {
          if (newState[idx] === 0 && probability > response.probability) {
            response.index = idx
            response.probability = probability
          }
          return response
        },
        { index: -1, probability: 0 },
      ).index
      newState[aiResponse] = -1
      setGameState(newState)
    }
  }
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', lineHeight: '1.4' }}>
      <div className="grid grid-cols-3 gap-1 w-80 m-auto mt-80 bg-slate-600">
        {gameState.map((x, i) => (
          <div
            key={i}
            className="col-span-1 cursor-pointer bg-white hover:bg-slate-100 h-20 grid place-items-center text-6xl"
            onClick={() => executePlayerMove(i)}
          >
            {x === 0 ? '' : x === 1 ? '×' : 'o'}
          </div>
        ))}
      </div>
      <div className="grid place-items-center mt-20">
        <button
          className="bg-slate-400 hover:bg-slate-500 text-white font-bold py-2 px-4 rounded text-2xl"
          onClick={() => {
            setGameState([0, 0, 0, 0, 0, 0, 0, 0, 0])
          }}
        >
          Reset
        </button>
      </div>
    </div>
  )
}
