import { Button, chakra, Container, useToast } from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import GomokuAreaController, {
  GomokuCell,
} from '../../../../classes/interactable/GomokuAreaController';
import { GomokuGridPosition } from '../../../../types/CoveyTownSocket';

export type GomokuGameProps = {
  gameAreaController: GomokuAreaController;
};

const StyledGomokuSquare = chakra(Button, {
  baseStyle: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '10',
    height: '20',
    fontSize: '10px',
    border: '1px solid black',
    boxSizing: 'border-box',
    _disabled: {
      opacity: '100%',
    },
  },
});


const StyledGomokuBoard = chakra(Container, {
  baseStyle: {
    display: 'flex',
    width: '1500px',
    height: '1500px',
    padding: '2px',
    flexWrap: 'wrap',
  },
});

export default function GomokuBoard({ gameAreaController }: GomokuGameProps): JSX.Element {
  const [board, setBoard] = useState<GomokuCell[][]>(gameAreaController.board);
  const [isOurTurn, setIsOurTurn] = useState(gameAreaController.isOurTurn);
  const toast = useToast();
  useEffect(() => {
    gameAreaController.addListener('turnChanged', setIsOurTurn);
    gameAreaController.addListener('boardChanged', setBoard);
    return () => {
      gameAreaController.removeListener('boardChanged', setBoard);
      gameAreaController.removeListener('turnChanged', setIsOurTurn);
    };
  }, [gameAreaController]);

  return (
    <StyledGomokuBoard aria-label='Gomoku Board'>
      {board.map((row, rowIndex) => {
        return row.map((cell, colIndex) => {
          return (
            <StyledGomokuSquare
              key={`${rowIndex}.${colIndex}`}
              onClick={async () => {
                try {
                  await gameAreaController.makeMove(
                    rowIndex as GomokuGridPosition,
                    colIndex as GomokuGridPosition,
                  );
                } catch (e) {
                  toast({
                    title: 'Error making move',
                    description: (e as Error).toString(),
                    status: 'error',
                  });
                }
              }}
              disabled={!isOurTurn}
              aria-label={`Cell ${rowIndex},${colIndex}`}>
              {cell}
            </StyledGomokuSquare>
          );
        });
      })}
    </StyledGomokuBoard>
  );
}
