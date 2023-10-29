import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';
import {
  GameArea,
  GameResult,
  GameStatus,
  GomokuGameState,
  GomokuGridPosition,
  GomokuMove,
} from '../../types/CoveyTownSocket';
import PlayerController from '../PlayerController';
import TownController from '../TownController';
import GameAreaController from './GameAreaController';
import GomokuAreaController, { NO_GAME_IN_PROGRESS_ERROR } from './GomokuAreaController';
import assert from 'assert';

describe('GomokuAreaController', () => {
  const ourPlayer = new PlayerController(nanoid(), nanoid(), {
    x: 0,
    y: 0,
    moving: false,
    rotation: 'front',
  });
  const otherPlayers = [
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
    new PlayerController(nanoid(), nanoid(), { x: 0, y: 0, moving: false, rotation: 'front' }),
  ];

  const mockTownController = mock<TownController>();
  Object.defineProperty(mockTownController, 'ourPlayer', {
    get: () => ourPlayer,
  });
  Object.defineProperty(mockTownController, 'players', {
    get: () => [ourPlayer, ...otherPlayers],
  });
  mockTownController.getPlayer.mockImplementation(playerID => {
    const p = mockTownController.players.find(player => player.id === playerID);
    assert(p);
    return p;
  });

  function gomokuAreaControllerWithProp({
    _id,
    history,
    black,
    white,
    undefinedGame,
    status,
    moves,
    winner,
  }: {
    _id?: string;
    history?: GameResult[];
    black?: string;
    white?: string;
    undefinedGame?: boolean;
    status?: GameStatus;
    moves?: GomokuMove[];
    winner?: string;
  }) {
    const id = _id || nanoid();
    const players = [];
    if (black) players.push(black);
    if (white) players.push(white);
    const ret = new GomokuAreaController(
      id,
      {
        id,
        occupants: players,
        history: history || [],
        type: 'GomokuArea',
        game: undefinedGame
          ? undefined
          : {
              id,
              players: players,
              state: {
                status: status || 'IN_PROGRESS',
                black: black,
                white: white,
                moves: moves || [],
                winner: winner,
              },
            },
      },
      mockTownController,
    );
    if (players) {
      ret.occupants = players
        .map(eachID => mockTownController.players.find(eachPlayer => eachPlayer.id === eachID))
        .filter(eachPlayer => eachPlayer) as PlayerController[];
    }
    return ret;
  }

  describe('Basic Properties', () => {
    it('should correctly identify if the game is active', () => {
      const controller = gomokuAreaControllerWithProp({ status: 'IN_PROGRESS' });
      expect(controller.isActive()).toBe(true);

      const controller2 = gomokuAreaControllerWithProp({ status: 'OVER' });
      expect(controller2.isActive()).toBe(false);
    });

    it('should correctly identify if the current player is a player in the game', () => {
      const controller = gomokuAreaControllerWithProp({ black: ourPlayer.id });
      expect(controller.isPlayer).toBe(true);

      const controller2 = gomokuAreaControllerWithProp({
        black: otherPlayers[0].id,
        white: otherPlayers[1].id,
      });
      expect(controller2.isPlayer).toBe(false);
    });

    it('should throw an error if the current player is not a player in this game', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: otherPlayers[0].id,
        white: otherPlayers[1].id,
      });
      expect(() => controller.gamePiece).toThrowError();
    });
  });
  describe('status', () => {
    it('should return the status of the game', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
      });
      expect(controller.status).toBe('IN_PROGRESS');
    });
    it('should return WAITING_TO_START if the game is not defined', () => {
      const controller = gomokuAreaControllerWithProp({
        undefinedGame: true,
      });
      expect(controller.status).toBe('WAITING_TO_START');
    });
  });
  describe('whoseTurn', () => {
    it('should return the player whose turn it is initially', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      expect(controller.whoseTurn).toBe(ourPlayer);
    });
    it('should return the player whose turn it is after a move', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
        moves: [
          {
            gamePiece: 'Black',
            row: 0,
            col: 0,
          },
        ],
      });
      expect(controller.whoseTurn).toBe(otherPlayers[0]);
    });
    it('should return undefined if the game is not in progress', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'OVER',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      expect(controller.whoseTurn).toBe(undefined);
    });
  });
  describe('gamePiece', () => {
    it('should return the game piece of the current player if the current player is a player in this game', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
      });
      expect(controller.gamePiece).toBe('Black');

      //check O
      const controller2 = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        white: ourPlayer.id,
      });
      expect(controller2.gamePiece).toBe('White');
    });
    it('should throw an error if the current player is not a player in this game', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: otherPlayers[0].id,
        white: otherPlayers[1].id,
      });
      expect(() => controller.gamePiece).toThrowError();
    });
  });
  describe('isOurTurn', () => {
    it('should return true if it is our turn', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      expect(controller.isOurTurn).toBe(true);
    });
    it('should return false if it is not our turn', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: otherPlayers[0].id,
        white: ourPlayer.id,
      });
      expect(controller.isOurTurn).toBe(false);
    });
  });
  describe('moveCount', () => {
    it('should return the number of moves that have been made', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
        moves: [
          {
            gamePiece: 'Black',
            row: 0,
            col: 0,
          },
        ],
      });
      expect(controller.moveCount).toBe(1);
    });
  });
  describe('board', () => {
    it('should return an empty board by default', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      const expectedBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
      expect(controller.board).toEqual(expectedBoard);
    });
  });
  describe('black', () => {
    it('should return the black player if there is one', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      expect(controller.black).toBe(ourPlayer);
    });
    it('should return undefined if there is no black player and the game is waiting to start', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'WAITING_TO_START',
      });
      expect(controller.black).toBe(undefined);
    });
    it('should return undefined if there is no black player', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        white: otherPlayers[0].id,
      });
      expect(controller.black).toBe(undefined);
    });
  });
  describe('white', () => {
    it('should return the white player if there is one', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        white: ourPlayer.id,
        black: otherPlayers[0].id,
      });
      expect(controller.white).toBe(ourPlayer);
    });
    it('should return undefined if there is no white player and the game is waiting to start', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'WAITING_TO_START',
      });
      expect(controller.white).toBe(undefined);
    });
    it('should return undefined if there is no white player', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: otherPlayers[0].id,
      });
      expect(controller.white).toBe(undefined);
    });
  });
  describe('winner', () => {
    it('should return the winner if there is one', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'OVER',
        black: otherPlayers[0].id,
        white: ourPlayer.id,
        winner: ourPlayer.id,
      });
      expect(controller.winner).toBe(ourPlayer);
    });
    it('should return undefined if there is no winner', () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'OVER',
        black: otherPlayers[0].id,
        white: ourPlayer.id,
      });
      expect(controller.winner).toBe(undefined);
    });
  });
  describe('makeMove', () => {
    it('should throw an error if the game is not in progress', async () => {
      const controller = gomokuAreaControllerWithProp({});
      await expect(async () => controller.makeMove(0, 0)).rejects.toEqual(
        new Error(NO_GAME_IN_PROGRESS_ERROR),
      );
    });
    it('Should call townController.sendInteractableCommand', async () => {
      const controller = gomokuAreaControllerWithProp({
        status: 'IN_PROGRESS',
        black: ourPlayer.id,
        white: otherPlayers[0].id,
      });
      // Simulate joining the game for real
      const instanceID = nanoid();
      mockTownController.sendInteractableCommand.mockImplementationOnce(async () => {
        return { gameID: instanceID };
      });
      await controller.joinGame();
      mockTownController.sendInteractableCommand.mockReset();
      await controller.makeMove(2, 1);
      expect(mockTownController.sendInteractableCommand).toHaveBeenCalledWith(controller.id, {
        type: 'GameMove',
        gameID: instanceID,
        move: {
          row: 2,
          col: 1,
          gamePiece: 'Black',
        },
      });
    });
  });
  describe('_updateFrom', () => {
    describe('if the game is in progress', () => {
      let controller: GomokuAreaController;
      beforeEach(() => {
        controller = gomokuAreaControllerWithProp({
          status: 'IN_PROGRESS',
          black: ourPlayer.id,
          white: otherPlayers[0].id,
        });
      });
      it('should emit a boardChanged event with the new board', () => {
        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
          {
            gamePiece: 'White',
            row: 1 as GomokuGridPosition,
            col: 1 as GomokuGridPosition,
          },
        ];
        assert(model.game);
        const newModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const boardChangedCall = emitSpy.mock.calls.find(call => call[0] === 'boardChanged');
        expect(boardChangedCall).toBeDefined();
        if (boardChangedCall) {
          const expectedBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
          expectedBoard[0][0] = 'Black';
          expectedBoard[1][1] = 'White';
          expect(boardChangedCall[1]).toEqual(expectedBoard);
        }
      });
      it('should emit a turnChanged event with true if it is our turn', () => {
        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
          {
            gamePiece: 'White',
            row: 1 as GomokuGridPosition,
            col: 1 as GomokuGridPosition,
          },
        ];
        assert(model.game);
        const newModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: [newMoves[0]],
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const testModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(testModel, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).toBeDefined();
        if (turnChangedCall) expect(turnChangedCall[1]).toEqual(true);
      });
      it('should emit a turnChanged event with false if it is not our turn', () => {
        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
        ];
        expect(controller.isOurTurn).toBe(true);
        assert(model.game);
        const newModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).toBeDefined();
        if (turnChangedCall) expect(turnChangedCall[1]).toEqual(false);
      });
      it('should not emit a turnChanged event if the turn has not changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);
        expect(controller.isOurTurn).toBe(true);
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(model, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'turnChanged');
        expect(turnChangedCall).not.toBeDefined();
      });
      it('should not emit a boardChanged event if the board has not changed', () => {
        const model = controller.toInteractableAreaModel();
        assert(model.game);

        const newMoves: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
          {
            gamePiece: 'White',
            row: 1 as GomokuGridPosition,
            col: 1 as GomokuGridPosition,
          },
        ];
        const newModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));

        const newMovesWithShuffle: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'White',
            row: 1 as GomokuGridPosition,
            col: 1 as GomokuGridPosition,
          },
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
        ];

        const newModelWithSuffle: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMovesWithShuffle,
            },
          },
        };
        const emitSpy = jest.spyOn(controller, 'emit');
        controller.updateFrom(newModelWithSuffle, otherPlayers.concat(ourPlayer));
        const turnChangedCall = emitSpy.mock.calls.find(call => call[0] === 'boardChanged');
        expect(turnChangedCall).not.toBeDefined();
      });
      it('should update the board returned by the board property', () => {
        const model = controller.toInteractableAreaModel();
        const newMoves: ReadonlyArray<GomokuMove> = [
          {
            gamePiece: 'Black',
            row: 0 as GomokuGridPosition,
            col: 0 as GomokuGridPosition,
          },
          {
            gamePiece: 'White',
            row: 1 as GomokuGridPosition,
            col: 1 as GomokuGridPosition,
          },
        ];
        assert(model.game);
        const newModel: GameArea<GomokuGameState> = {
          ...model,
          game: {
            ...model.game,
            state: {
              ...model.game?.state,
              moves: newMoves,
            },
          },
        };
        controller.updateFrom(newModel, otherPlayers.concat(ourPlayer));
        const expectedBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
        expectedBoard[0][0] = 'Black';
        expectedBoard[1][1] = 'White';

        expect(controller.board).toEqual(expectedBoard);
      });
    });
    it('should call super._updateFrom', () => {
      //eslint-disable-next-line @typescript-eslint/ban-ts-comment
      //@ts-ignore - we are testing spying on a private method
      const spy = jest.spyOn(GameAreaController.prototype, '_updateFrom');
      const controller = gomokuAreaControllerWithProp({});
      const model = controller.toInteractableAreaModel();
      controller.updateFrom(model, otherPlayers.concat(ourPlayer));
      expect(spy).toHaveBeenCalled();
    });
  });
});
