import { mock } from 'jest-mock-extended';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { nanoid } from 'nanoid';
import GomokuBoard from './GomokuBoard';
import TownController from '../../../../classes/TownController';
import GomokuAreaController, {
  GomokuCell,
} from '../../../../classes/interactable/GomokuAreaController';
import { GomokuGameState, GameArea } from '../../../../types/CoveyTownSocket';
import React from 'react';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});

class MockGomokuAreaController extends GomokuAreaController {
  makeMove = jest.fn();

  mockBoard: GomokuCell[][] = Array.from({ length: 15 }, () => Array(15).fill(undefined));

  mockIsPlayer = false;

  mockIsOurTurn = false;

  public constructor() {
    super(nanoid(), mock<GameArea<GomokuGameState>>(), mock<TownController>());
  }

  get board() {
    return this.mockBoard;
  }

  get isOurTurn() {
    return this.mockIsOurTurn;
  }

  public mockReset() {
    // Reset your mock board and other states here
    this.makeMove.mockReset();
  }
}

describe('GomokuBoard', () => {
  let mockGomokuAreaController: MockGomokuAreaController;

  beforeEach(() => {
    mockGomokuAreaController = new MockGomokuAreaController();
    mockGomokuAreaController.mockReset();
    mockGomokuAreaController.mockIsOurTurn = false;
    mockGomokuAreaController.mockIsPlayer = false;
  });

  it('renders the board with the correct number of cells', () => {
    render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);
    const cells = screen.getAllByRole('button');
    expect(cells).toHaveLength(225); // 15 * 15 = 225

    for (let i = 0; i < 225; i++) {
      const row = Math.floor(i / 15);
      const col = i % 15;
      expect(cells[i]).toHaveAttribute('aria-label', `Cell ${row},${col}`);
    }
  });
  it('does not make a move when a cell is clicked, and cell is disabled', () => {
    render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);
    const cells = screen.getAllByRole('button');

    cells.forEach(cell => {
      expect(cell).toBeDisabled();
    });

    cells.forEach(cell => {
      fireEvent.click(cell);
    });

    expect(mockGomokuAreaController.makeMove).not.toHaveBeenCalled();

    expect(mockToast).not.toHaveBeenCalled();
  });
  it('updates the board displayed in response to boardChanged events', () => {
    render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

    const newMockBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
    newMockBoard[0][0] = 'Black';
    newMockBoard[0][1] = 'White';
    mockGomokuAreaController.mockBoard = newMockBoard;

    act(() => {
      mockGomokuAreaController.emit('boardChanged', newMockBoard);
    });

    const cells = screen.getAllByRole('button');
    expect(cells[0]).toHaveTextContent('Black');
    expect(cells[1]).toHaveTextContent('White');
  });
  describe('When playing the game', () => {
    beforeEach(() => {
      mockGomokuAreaController.mockIsPlayer = true;
      mockGomokuAreaController.mockIsOurTurn = true;
    });

    it("enables cells when it is the player's turn", async () => {
      render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

      const cells = screen.getAllByRole('button');
      cells.forEach(cell => {
        expect(cell).toBeEnabled();
      });

      mockGomokuAreaController.mockIsOurTurn = false;
      act(() => {
        mockGomokuAreaController.emit('turnChanged', mockGomokuAreaController.mockIsOurTurn);
      });

      cells.forEach(cell => {
        expect(cell).toBeDisabled();
      });
    });
    it('makes a move when a cell is clicked', async () => {
      render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

      const cells = screen.getAllByRole('button');

      fireEvent.click(cells[0]);

      expect(mockGomokuAreaController.makeMove).toHaveBeenCalledWith(0, 0);
    });
    it('displays an error toast when an invalid move is made', async () => {
      render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

      const errorMessage = 'Invalid move';
      mockGomokuAreaController.makeMove.mockRejectedValue(new Error(errorMessage));

      const cells = screen.getAllByRole('button');

      fireEvent.click(cells[0]);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'error',
            description: `Error: ${errorMessage}`,
          }),
        );
      });
    });
    it('updates the board in response to boardChanged events', () => {
      render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

      const newMockBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
      newMockBoard[0][0] = 'Black';
      newMockBoard[0][1] = 'White';
      mockGomokuAreaController.mockBoard = newMockBoard;

      act(() => {
        mockGomokuAreaController.emit('boardChanged', newMockBoard);
      });

      const cells = screen.getAllByRole('button');
      expect(cells[0]).toHaveTextContent('Black');
      expect(cells[1]).toHaveTextContent('White');
    });

    it("disables cells when it is not the player's turn", () => {
      render(<GomokuBoard gameAreaController={mockGomokuAreaController} />);

      const cells = screen.getAllByRole('button');
      cells.forEach(cell => {
        expect(cell).toBeEnabled();
      });

      mockGomokuAreaController.mockIsOurTurn = false;
      act(() => {
        mockGomokuAreaController.emit('turnChanged', mockGomokuAreaController.mockIsOurTurn);
      });

      cells.forEach(cell => {
        expect(cell).toBeDisabled();
      });
    });
  });
});
