// Componente de Calculadora Flutuante
'use client'

import { useState } from 'react'
import { Dialog } from '@headlessui/react'
import { CalculatorIcon } from '@heroicons/react/24/outline'

export default function Calculator() {
  const [isOpen, setIsOpen] = useState(false)
  const [display, setDisplay] = useState('0')
  const [previousValue, setPreviousValue] = useState<number | null>(null)
  const [operation, setOperation] = useState<string | null>(null)

  const handleNumber = (num: string) => {
    if (display === '0') {
      setDisplay(num)
    } else {
      setDisplay(display + num)
    }
  }

  const handleOperation = (op: string) => {
    setPreviousValue(parseFloat(display))
    setOperation(op)
    setDisplay('0')
  }

  const handleEquals = () => {
    if (previousValue !== null && operation) {
      const current = parseFloat(display)
      let result = 0

      switch (operation) {
        case '+':
          result = previousValue + current
          break
        case '-':
          result = previousValue - current
          break
        case '*':
          result = previousValue * current
          break
        case '/':
          result = previousValue / current
          break
      }

      setDisplay(result.toString())
      setPreviousValue(null)
      setOperation(null)
    }
  }

  const handleClear = () => {
    setDisplay('0')
    setPreviousValue(null)
    setOperation(null)
  }

  const handleDecimal = () => {
    if (!display.includes('.')) {
      setDisplay(display + '.')
    }
  }

  return (
    <>
      {/* Botão Flutuante */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all hover:scale-110 z-50"
        aria-label="Abrir calculadora"
      >
        <CalculatorIcon className="w-8 h-8" />
      </button>

      {/* Modal da Calculadora */}
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-gray-800 rounded-2xl shadow-2xl w-80">
            <Dialog.Title className="text-xl font-bold text-white text-center py-4">
              Calculadora
            </Dialog.Title>

            {/* Display */}
            <div className="bg-gray-900 text-white text-right text-3xl p-6 rounded-t-xl font-mono">
              {display}
            </div>

            {/* Botões */}
            <div className="grid grid-cols-4 gap-2 p-4">
              {/* Linha 1 */}
              <button
                onClick={handleClear}
                className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg"
              >
                C
              </button>
              <button
                onClick={() => handleOperation('/')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg"
              >
                ÷
              </button>
              <button
                onClick={() => handleOperation('*')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg"
              >
                ×
              </button>

              {/* Linha 2 */}
              <button
                onClick={() => handleNumber('7')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                7
              </button>
              <button
                onClick={() => handleNumber('8')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                8
              </button>
              <button
                onClick={() => handleNumber('9')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                9
              </button>
              <button
                onClick={() => handleOperation('-')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg"
              >
                −
              </button>

              {/* Linha 3 */}
              <button
                onClick={() => handleNumber('4')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                4
              </button>
              <button
                onClick={() => handleNumber('5')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                5
              </button>
              <button
                onClick={() => handleNumber('6')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                6
              </button>
              <button
                onClick={() => handleOperation('+')}
                className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-lg"
              >
                +
              </button>

              {/* Linha 4 */}
              <button
                onClick={() => handleNumber('1')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                1
              </button>
              <button
                onClick={() => handleNumber('2')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                2
              </button>
              <button
                onClick={() => handleNumber('3')}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                3
              </button>
              <button
                onClick={handleEquals}
                className="row-span-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg"
              >
                =
              </button>

              {/* Linha 5 */}
              <button
                onClick={() => handleNumber('0')}
                className="col-span-2 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                0
              </button>
              <button
                onClick={handleDecimal}
                className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-lg"
              >
                .
              </button>
            </div>

            {/* Botão Fechar */}
            <div className="p-4">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 rounded-lg"
              >
                Fechar
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  )
}
