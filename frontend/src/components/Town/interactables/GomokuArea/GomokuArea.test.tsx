import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { mock, mockReset } from 'jest-mock-extended';
import React from 'react';
import { nanoid } from 'nanoid';
import { act } from 'react-dom/test-utils';
import GomokuAreaController, {
  GomokuCell,
} from '../../../../classes/interactable/GomokuAreaController';
import PlayerController from '../../../../classes/PlayerController';
import TownController, * as TownControllerHooks from '../../../../classes/TownController';
import TownControllerContext from '../../../../contexts/TownControllerContext';
import GomokuAreaWrapper from './GomokuArea';
import * as GomokuBoard from './GomokuBoard';
import {
  GameArea,
  GameResult,
  GameStatus,
  GomokuGameState,
  PlayerLocation,
} from '../../../../types/CoveyTownSocket';
import PhaserGameArea from '../GameArea';
import ChatRoom from '../../../ChatRoom/ChatRoom';
import TextConversation from '../../../../classes/TextConversation';

const mockToast = jest.fn();
jest.mock('@chakra-ui/react', () => {
  const ui = jest.requireActual('@chakra-ui/react');
  const mockUseToast = () => mockToast;
  return {
    ...ui,
    useToast: mockUseToast,
  };
});
const mockGameArea = mock<PhaserGameArea>();
mockGameArea.getData.mockReturnValue('Gomoku');
jest.spyOn(TownControllerHooks, 'useInteractable').mockReturnValue(mockGameArea);
const useInteractableAreaControllerSpy = jest.spyOn(
  TownControllerHooks,
  'useInteractableAreaController',
);

const boardComponentSpy = jest.spyOn(GomokuBoard, 'default');
boardComponentSpy.mockReturnValue(<div data-testid='board' />);

const randomLocation = (): PlayerLocation => ({
  moving: Math.random() < 0.5,
  rotation: 'front',
  x: Math.random() * 1000,
  y: Math.random() * 1000,
});

class MockGomokuAreaController extends GomokuAreaController {
  makeMove = jest.fn();

  joinGame = jest.fn();

  mockBoard: GomokuCell[][] = Array.from({ length: 15 }, () => Array(15).fill(undefined));

  mockBlackPlayer: PlayerController | undefined = undefined;

  mockWhitePlayer: PlayerController | undefined = undefined;

  mockMoveCount = 0;

  mockBlack: PlayerController | undefined = undefined;

  mockWhite: PlayerController | undefined = undefined;

  mockWinner: PlayerController | undefined = undefined;

  mockWhoseTurn: PlayerController | undefined = undefined;

  mockStatus: GameStatus = 'WAITING_TO_START';

  mockIsOurTurn = false;

  mockIsPlayer = false;

  public constructor() {
    super(nanoid(), mock<GameArea<GomokuGameState>>(), mock<TownController>());
  }

  get board(): GomokuCell[][] {
    return this.mockBoard;
  }

  get black(): PlayerController | undefined {
    return this.mockBlackPlayer;
  }

  get white(): PlayerController | undefined {
    return this.mockWhitePlayer;
  }

  get moveCount(): number {
    return this.mockMoveCount;
  }

  get winner(): PlayerController | undefined {
    return this.mockWinner;
  }

  get whoseTurn(): PlayerController | undefined {
    return this.mockWhoseTurn;
  }

  get isOurTurn(): boolean {
    return this.mockIsOurTurn;
  }

  get isPlayer(): boolean {
    return this.mockIsPlayer;
  }

  get status(): GameStatus {
    return this.mockStatus;
  }

  public isActive(): boolean {
    return this.mockStatus === 'IN_PROGRESS';
  }

  public mockReset() {
    this.mockBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
    this.makeMove.mockReset();
    this.joinGame.mockReset();
  }
}

describe('[G1] GomokuArea', () => {
  // Spy on console.error and intercept react key warnings to fail test
  let consoleErrorSpy: jest.SpyInstance<void, [message?: any, ...optionalParms: any[]]>;
  beforeAll(() => {
    // Spy on console.error and intercept react key warnings to fail test
    consoleErrorSpy = jest.spyOn(global.console, 'error');
    consoleErrorSpy.mockImplementation((message?, ...optionalParams) => {
      const stringMessage = message as string;
      if (stringMessage.includes && stringMessage.includes('children with the same key,')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      } else if (stringMessage.includes && stringMessage.includes('warning-keys')) {
        throw new Error(stringMessage.replace('%s', optionalParams[0]));
      }
      // eslint-disable-next-line no-console -- we are wrapping the console with a spy to find react warnings
      console.warn(message, ...optionalParams);
    });
  });
  afterAll(() => {
    consoleErrorSpy.mockRestore();
  });

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  let gameAreaController = new MockGomokuAreaController();
  let joinGameResolve: () => void;
  let joinGameReject: (err: Error) => void;

  function renderGomokuArea() {
    return render(
      <ChakraProvider>
        <TownControllerContext.Provider value={townController}>
          <GomokuAreaWrapper />
        </TownControllerContext.Provider>
      </ChakraProvider>,
    );
  }
  beforeEach(() => {
    ourPlayer = new PlayerController('player Black', 'player Black', randomLocation());
    mockGameArea.name = nanoid();
    mockReset(townController);
    gameAreaController.mockReset();
    useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
    mockToast.mockClear();
    gameAreaController.joinGame.mockReset();
    gameAreaController.makeMove.mockReset();

    gameAreaController.joinGame.mockImplementation(
      () =>
        new Promise<void>((resolve, reject) => {
          joinGameResolve = resolve;
          joinGameReject = reject;
        }),
    );
  });
  describe('[G1.1] Game update listeners', () => {
    it('Registers exactly two listeners when mounted: one for gameUpdated and one for gameEnd', () => {
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();

      renderGomokuArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      expect(addListenerSpy).toHaveBeenCalledWith('gameUpdated', expect.any(Function));
      expect(addListenerSpy).toHaveBeenCalledWith('gameEnd', expect.any(Function));
    });

    it('Does not register listeners on every render', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderGomokuArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      addListenerSpy.mockClear();

      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <GomokuAreaWrapper />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );

      expect(addListenerSpy).not.toBeCalled();
      expect(removeListenerSpy).not.toBeCalled();
    });

    it('Removes the listeners when the component is unmounted', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderGomokuArea();
      expect(addListenerSpy).toBeCalledTimes(2);
      const addedListeners = addListenerSpy.mock.calls;
      const addedGameUpdateListener = addedListeners.find(call => call[0] === 'gameUpdated');
      const addedGameEndedListener = addedListeners.find(call => call[0] === 'gameEnd');
      expect(addedGameEndedListener).toBeDefined();
      expect(addedGameUpdateListener).toBeDefined();
      renderData.unmount();
      expect(removeListenerSpy).toBeCalledTimes(2);
      const removedListeners = removeListenerSpy.mock.calls;
      const removedGameUpdateListener = removedListeners.find(call => call[0] === 'gameUpdated');
      const removedGameEndedListener = removedListeners.find(call => call[0] === 'gameEnd');
      expect(removedGameUpdateListener).toEqual(addedGameUpdateListener);
      expect(removedGameEndedListener).toEqual(addedGameEndedListener);
    });
    it('Creates new listeners if the gameAreaController changes', () => {
      const removeListenerSpy = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy = jest.spyOn(gameAreaController, 'addListener');
      addListenerSpy.mockClear();
      removeListenerSpy.mockClear();
      const renderData = renderGomokuArea();
      expect(addListenerSpy).toBeCalledTimes(2);

      gameAreaController = new MockGomokuAreaController();
      const removeListenerSpy2 = jest.spyOn(gameAreaController, 'removeListener');
      const addListenerSpy2 = jest.spyOn(gameAreaController, 'addListener');

      useInteractableAreaControllerSpy.mockReturnValue(gameAreaController);
      renderData.rerender(
        <ChakraProvider>
          <TownControllerContext.Provider value={townController}>
            <GomokuAreaWrapper />
          </TownControllerContext.Provider>
        </ChakraProvider>,
      );
      expect(removeListenerSpy).toBeCalledTimes(2);

      expect(addListenerSpy2).toBeCalledTimes(2);
      expect(removeListenerSpy2).not.toBeCalled();
    });
  });

  describe('[G1.2] Rendering and initial state', () => {
    it('should render correctly with initial states', () => {
      // Test rendering and initial states
    });
  });

  describe('[G1.3] Join game button', () => {
    it('Is not shown when the player is in a not-yet-started game', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockBlack = ourPlayer;
      gameAreaController.mockIsPlayer = true;
      renderGomokuArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
    it('Is not shown if the game is in progress', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockBlack = new PlayerController(
        'player Black',
        'player White',
        randomLocation(),
      );
      gameAreaController.mockWhite = new PlayerController(
        'player Black',
        'player White',
        randomLocation(),
      );
      gameAreaController.mockIsPlayer = false;
      renderGomokuArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
    it('Is enabled when the player is not in a game and the game is not in progress', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockBlack = undefined;
      gameAreaController.mockWhite = new PlayerController(
        'player White',
        'player White',
        randomLocation(),
      );
      gameAreaController.mockIsPlayer = false;
      renderGomokuArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    describe('When clicked', () => {
      it('Calls joinGame on the gameAreaController', () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        renderGomokuArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
      });
      it('Displays a toast with the error message if there is an error joining the game', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        const errorMessage = nanoid();
        renderGomokuArea();
        const button = screen.getByText('Join New Game');
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
        act(() => {
          joinGameReject(new Error(errorMessage));
        });
        await waitFor(() => {
          expect(mockToast).toBeCalledWith(
            expect.objectContaining({
              description: `Error: ${errorMessage}`,
              status: 'error',
            }),
          );
        });
      });

      it('Is disabled and set to loading when the player is joining a game', async () => {
        gameAreaController.mockStatus = 'WAITING_TO_START';
        gameAreaController.mockIsPlayer = false;
        renderGomokuArea();
        const button = screen.getByText('Join New Game');
        expect(button).toBeEnabled();
        expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
        fireEvent.click(button);
        expect(gameAreaController.joinGame).toBeCalled();
        expect(button).toBeDisabled();
        expect(within(button).queryByText('Loading...')).toBeInTheDocument(); //Check that the loading text is displayed
        act(() => {
          joinGameResolve();
        });
        await waitFor(() => expect(button).toBeEnabled());
        expect(within(button).queryByText('Loading...')).not.toBeInTheDocument(); //Check that the loading text is not displayed
      });
    });
    it('Adds the display of the button when a game becomes possible to join', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockBlack = new PlayerController(
        'player Black',
        'player Black',
        randomLocation(),
      );
      gameAreaController.mockWhite = new PlayerController(
        'player White',
        'player White',
        randomLocation(),
      );
      renderGomokuArea();
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'OVER';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
    });
    it('Removes the display of the button when a game becomes no longer possible to join', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockBlack = undefined;
      gameAreaController.mockWhite = new PlayerController(
        'player White',
        'player White',
        randomLocation(),
      );
      renderGomokuArea();
      expect(screen.queryByText('Join New Game')).toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockWhite = new PlayerController(
          'player X',
          'player X',
          randomLocation(),
        );
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.queryByText('Join New Game')).not.toBeInTheDocument();
    });
  });

  describe('[G1.4] Players in the game text', () => {
    it('Displays the username of the Black player if the Black player is in the game', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockBlack = new PlayerController(nanoid(), nanoid(), randomLocation());
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`Black: ${gameAreaController.mockBlack?.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays the username of the White player if the White player is in the game', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockWhite = new PlayerController(nanoid(), nanoid(), randomLocation());
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(
        within(listOfPlayers).getByText(`White: ${gameAreaController.mockWhite?.userName}`),
      ).toBeInTheDocument();
    });
    it('Displays "Black: (No player yet!)" if the Black player is not in the game', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockBlack = undefined;
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`Black: (No player yet!)`)).toBeInTheDocument();
    });
    it('Displays "White: (No player yet!)" if the White player is not in the game', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      gameAreaController.mockWhite = undefined;
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`White: (No player yet!)`)).toBeInTheDocument();
    });
    it('Updates the Black player when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`Black: (No player yet!)`)).toBeInTheDocument();
      act(() => {
        gameAreaController.mockBlack = new PlayerController(nanoid(), nanoid(), randomLocation());
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`Black: ${gameAreaController.mockBlack?.userName}`),
      ).toBeInTheDocument();
    });
    it('Updates the White player when the game is updated', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      gameAreaController.mockIsPlayer = false;
      renderGomokuArea();
      const listOfPlayers = screen.getByLabelText('list of players in the game');
      expect(within(listOfPlayers).getByText(`White: (No player yet!)`)).toBeInTheDocument();
      act(() => {
        gameAreaController.mockWhite = new PlayerController(nanoid(), nanoid(), randomLocation());
        gameAreaController.emit('gameUpdated');
      });
      expect(
        within(listOfPlayers).getByText(`White: ${gameAreaController.mockWhite?.userName}`),
      ).toBeInTheDocument();
    });
  });

  describe('[G1.5] Game status text', () => {
    it('Displays the correct text when the game is waiting to start', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      renderGomokuArea();
      expect(screen.getByText('Game not yet started', { exact: false })).toBeInTheDocument();
    });
    it('Displays the correct text when the game is in progress', () => {
      gameAreaController.mockStatus = 'IN_PROGRESS';
      renderGomokuArea();
      expect(screen.getByText('Game in progress', { exact: false })).toBeInTheDocument();
    });
    it('Displays the correct text when the game is over', () => {
      gameAreaController.mockStatus = 'OVER';
      renderGomokuArea();
      expect(screen.getByText('Game over', { exact: false })).toBeInTheDocument();
    });
    describe('When a game is in progress', () => {
      beforeEach(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockMoveCount = 2;
        gameAreaController.mockBlack = ourPlayer;
        gameAreaController.mockWhite = new PlayerController(
          'player White',
          'player White',
          randomLocation(),
        );
        gameAreaController.mockWhoseTurn = gameAreaController.mockBlack;
        gameAreaController.mockIsOurTurn = true;
      });

      it('Displays a message "Game in progress, {numMoves} moves in" and indicates whose turn it is when it is our turn', () => {
        renderGomokuArea();
        expect(
          screen.getByText(`Game in progress, 2 moves in, currently your turn`, { exact: false }),
        ).toBeInTheDocument();
      });

      it('Displays a message "Game in progress, {numMoves} moves in" and indicates whose turn it is when it is the other player\'s turn', () => {
        gameAreaController.mockMoveCount = 1;
        gameAreaController.mockWhoseTurn = gameAreaController.mockWhite;
        gameAreaController.mockIsOurTurn = false;
        renderGomokuArea();
        expect(
          screen.getByText(
            `Game in progress, 1 moves in, currently ${gameAreaController.white?.userName}'s turn`,
            { exact: false },
          ),
        ).toBeInTheDocument();
      });

      it('Updates the move count when the game is updated', () => {
        renderGomokuArea();
        expect(
          screen.getByText(`Game in progress, 2 moves in`, { exact: false }),
        ).toBeInTheDocument();
        act(() => {
          gameAreaController.mockMoveCount = 3;
          gameAreaController.mockWhoseTurn = gameAreaController.mockWhite;
          gameAreaController.mockIsOurTurn = false;
          gameAreaController.emit('gameUpdated');
        });
        expect(
          screen.getByText(`Game in progress, 3 moves in`, { exact: false }),
        ).toBeInTheDocument();
      });
      it('Updates the whose turn it is when the game is updated', () => {
        renderGomokuArea();
        expect(screen.getByText(`, currently your turn`, { exact: false })).toBeInTheDocument();
        act(() => {
          gameAreaController.mockMoveCount = 3;
          gameAreaController.mockWhoseTurn = gameAreaController.mockWhite;
          gameAreaController.mockIsOurTurn = false;
          gameAreaController.emit('gameUpdated');
        });
        expect(
          screen.getByText(`, currently ${gameAreaController.mockWhite?.userName}'s turn`, {
            exact: false,
          }),
        ).toBeInTheDocument();
      });
    });
    it('Updates the game status text when the game is updated', () => {
      gameAreaController.mockStatus = 'WAITING_TO_START';
      renderGomokuArea();
      expect(screen.getByText('Game not yet started', { exact: false })).toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.getByText('Game in progress', { exact: false })).toBeInTheDocument();
      act(() => {
        gameAreaController.mockStatus = 'OVER';
        gameAreaController.emit('gameUpdated');
      });
      expect(screen.getByText('Game over', { exact: false })).toBeInTheDocument();
    });
    describe('When the game ends', () => {
      it('Displays a toast with the winner', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockIsPlayer = false;
        gameAreaController.mockBlack = ourPlayer;
        gameAreaController.mockWhite = new PlayerController(
          'player White',
          'player White',
          randomLocation(),
        );
        gameAreaController.mockWinner = ourPlayer;
        renderGomokuArea();
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: `You won!`,
          }),
        );
      });
      it('Displays a toast with the loser', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockIsPlayer = false;
        gameAreaController.mockBlack = ourPlayer;
        gameAreaController.mockWhite = new PlayerController(
          'player White',
          'player White',
          randomLocation(),
        );
        gameAreaController.mockWinner = gameAreaController.mockWhite;
        renderGomokuArea();
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: `You lost :(`,
          }),
        );
      });
      it('Displays a toast with a tie', () => {
        gameAreaController.mockStatus = 'IN_PROGRESS';
        gameAreaController.mockIsPlayer = false;
        gameAreaController.mockBlack = ourPlayer;
        gameAreaController.mockWhite = new PlayerController(
          'player White',
          'player White',
          randomLocation(),
        );
        gameAreaController.mockWinner = undefined;
        renderGomokuArea();
        act(() => {
          gameAreaController.emit('gameEnd');
        });
        expect(mockToast).toBeCalledWith(
          expect.objectContaining({
            description: `Game ended in a tie`,
          }),
        );
      });
    });
  });

  describe('[G1.6] Chat room functionality', () => {
    it('should toggle chat room on button click', () => {
      // Test chat room toggle functionality
    });

    it('should display the correct content in the chat room', () => {
      // Test chat room content
    });
  });
});
