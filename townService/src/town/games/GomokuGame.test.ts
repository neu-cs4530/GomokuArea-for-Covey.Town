import { createPlayerForTesting } from '../../TestUtils';
import {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import GomokuGame from './GomokuGame';
import Player from '../../lib/Player';
import { GomokuMove } from '../../types/CoveyTownSocket';

describe('GomokuGame', () => {
  let game: GomokuGame;

  beforeEach(() => {
    game = new GomokuGame();
  });

  describe('[T1.1] _join', () => {
    it('should throw an error if the player is already in the game', () => {
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.join(player)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
      const player2 = createPlayerForTesting();
      game.join(player2);
      expect(() => game.join(player2)).toThrowError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    });
    it('should throw an error if the game is full', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      game.join(player1);
      game.join(player2);

      expect(() => game.join(player3)).toThrowError(GAME_FULL_MESSAGE);
    });
    it('should throw an error if the game is full', () => {
      const player1 = createPlayerForTesting();
      const player2 = createPlayerForTesting();
      const player3 = createPlayerForTesting();
      game.join(player2);
      game.join(player3);

      expect(() => game.join(player1)).toThrowError(GAME_FULL_MESSAGE);
    });
    describe('When the player can be added', () => {
      it('makes the first player Black and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.black).toEqual(player.id);
        expect(game.state.white).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      describe('When the second player joins', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
        });
        it('makes the second player White', () => {
          expect(game.state.black).toEqual(player1.id);
          expect(game.state.white).toEqual(player2.id);
        });
        it('sets the game status to IN_PROGRESS', () => {
          expect(game.state.status).toEqual('IN_PROGRESS');
          expect(game.state.winner).toBeUndefined();
          expect(game.state.moves).toHaveLength(0);
        });
      });
    });
    describe('When the player can be added', () => {
      it('makes the first player Black and initializes the state with status WAITING_TO_START', () => {
        const player = createPlayerForTesting();
        game.join(player);
        expect(game.state.black).toEqual(player.id);
        expect(game.state.white).toBeUndefined();
        expect(game.state.moves).toHaveLength(0);
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
      describe('When the second player joins', () => {
        const player1 = createPlayerForTesting();
        const player2 = createPlayerForTesting();
        beforeEach(() => {
          game.join(player1);
          game.join(player2);
        });
        it('makes the second player Black', () => {
          expect(game.state.black).toEqual(player2.id);
          expect(game.state.white).toEqual(player1.id);
        });
        it('sets the game status to IN_PROGRESS', () => {
          expect(game.state.status).toEqual('IN_PROGRESS');
          expect(game.state.winner).toBeUndefined();
          expect(game.state.moves).toHaveLength(0);
        });
      });
    });
  });

  describe('[T1.2] _leave', () => {
    it('should throw an error if the player is not in the game', () => {
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
      // TODO weaker test suite only does one of these - above or below
      const player = createPlayerForTesting();
      game.join(player);
      expect(() => game.leave(createPlayerForTesting())).toThrowError(PLAYER_NOT_IN_GAME_MESSAGE);
    });
    describe('when the player is in the game', () => {
      describe('when the game is in progress, it should set the game status to OVER and declare the other player the winner', () => {
        test('when Black leaves', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          expect(game.state.black).toEqual(player1.id);
          expect(game.state.white).toEqual(player2.id);

          game.leave(player1);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player2.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.black).toEqual(player1.id);
          expect(game.state.white).toEqual(player2.id);
        });
        test('when White leaves', () => {
          const player1 = createPlayerForTesting();
          const player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          expect(game.state.black).toEqual(player1.id);
          expect(game.state.white).toEqual(player2.id);

          game.leave(player2);

          expect(game.state.status).toEqual('OVER');
          expect(game.state.winner).toEqual(player1.id);
          expect(game.state.moves).toHaveLength(0);

          expect(game.state.black).toEqual(player1.id);
          expect(game.state.white).toEqual(player2.id);
        });
      });
      it('when the game is not in progress, it should set the game status to WAITING_TO_START and remove the player', () => {
        const player1 = createPlayerForTesting();
        game.join(player1);
        expect(game.state.black).toEqual(player1.id);
        expect(game.state.white).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
        game.leave(player1);
        expect(game.state.black).toBeUndefined();
        expect(game.state.white).toBeUndefined();
        expect(game.state.status).toEqual('WAITING_TO_START');
        expect(game.state.winner).toBeUndefined();
      });
    });
    describe('applyMove', () => {
      let moves: GomokuMove[] = [];
      describe('when given an invalid move', () => {
        it('should throw an error if the game is not in progress', () => {
          const player1 = createPlayerForTesting();
          game.join(player1);
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: {
                gamePiece: 'Black',
                row: 0,
                col: 0,
              },
            }),
          ).toThrowError(GAME_NOT_IN_PROGRESS_MESSAGE);
        });
      });
      describe('when the game is in progress', () => {
        let player1: Player;
        let player2: Player;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          game.join(player1);
          game.join(player2);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        it('should rely on the player ID to determine whose turn it is', () => {
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row: 0,
                col: 0,
                gamePiece: 'Black',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: {
                row: 0,
                col: 0,
                gamePiece: 'White',
              },
            }),
          ).not.toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });
        it('should throw an error if the move is out of turn for the player ID', () => {
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row: 0,
                col: 0,
                gamePiece: 'Black',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: {
              row: 0,
              col: 0,
              gamePiece: 'Black',
            },
          });
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player1.id,
              move: {
                row: 0,
                col: 1,
                gamePiece: 'Black',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);

          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: {
              row: 0,
              col: 2,
              gamePiece: 'White',
            },
          });
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row: 2,
                col: 1,
                gamePiece: 'White',
              },
            }),
          ).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
        });

        it('should throw an error if the move is on an occupied space', () => {
          const row = 0;
          const col = 0;
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: {
              row,
              col,
              gamePiece: 'Black',
            },
          });
          expect(() =>
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row,
                col,
                gamePiece: 'White',
              },
            }),
          ).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
        });

        it('should not change whose turn it is when an invalid move is made', () => {
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: {
              row: 1,
              col: 1,
              gamePiece: 'Black',
            },
          });
          expect(() => {
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row: 1,
                col: 1,
                gamePiece: 'White',
              },
            });
          }).toThrowError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
          expect(game.state.moves).toHaveLength(1);
          game.applyMove({
            gameID: game.id,
            playerID: player2.id,
            move: {
              row: 1,
              col: 2,
              gamePiece: 'White',
            },
          });
          expect(game.state.moves).toHaveLength(2);
        });

        it('should not prevent the reuse of a space after an invalid move on it', () => {
          expect(() => {
            game.applyMove({
              gameID: game.id,
              playerID: player2.id,
              move: {
                row: 1,
                col: 1,
                gamePiece: 'White',
              },
            });
          }).toThrowError(MOVE_NOT_YOUR_TURN_MESSAGE);
          game.applyMove({
            gameID: game.id,
            playerID: player1.id,
            move: {
              row: 1,
              col: 1,
              gamePiece: 'Black',
            },
          });
        });
      });

      describe('when given a valid move', () => {
        let player1: Player;
        let player2: Player;
        let numMoves = 0;
        beforeEach(() => {
          player1 = createPlayerForTesting();
          player2 = createPlayerForTesting();
          numMoves = 0;
          moves = [];
          game.join(player1);
          game.join(player2);
          expect(game.state.status).toEqual('IN_PROGRESS');
        });
        function makeMoveAndCheckState(
          row: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14,
          col: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14,
          gamePiece: 'Black' | 'White',
          expectedOutcome: 'WIN' | 'TIE' | undefined = undefined,
        ) {
          game.applyMove({
            gameID: game.id,
            playerID: gamePiece === 'Black' ? player1.id : player2.id,
            move: {
              row,
              col,
              gamePiece,
            },
          });
          moves.push({ row, col, gamePiece });
          expect(game.state.moves).toHaveLength(++numMoves);
          for (let i = 0; i < numMoves; i++) {
            expect(game.state.moves[i]).toEqual(moves[i]);
          }
          if (expectedOutcome === 'WIN') {
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toEqual(gamePiece === 'Black' ? player1.id : player2.id);
          } else if (expectedOutcome === 'TIE') {
            expect(game.state.status).toEqual('OVER');
            expect(game.state.winner).toBeUndefined();
          } else {
            expect(game.state.status).toEqual('IN_PROGRESS');
            expect(game.state.winner).toBeUndefined();
          }
        }
        it('[T2.1] should add the move to the game state', () => {
          makeMoveAndCheckState(7, 7, 'Black');
        });
        it('[T2.1] should add the move to the game state', () => {
          makeMoveAndCheckState(8, 7, 'White');
        });

        it('[T2.2] should not end the game if the move does not form a line of 5', () => {
          makeMoveAndCheckState(7, 7, 'Black');
          makeMoveAndCheckState(8, 8, 'White');
          makeMoveAndCheckState(6, 6, 'Black');
          makeMoveAndCheckState(5, 5, 'White');
          // ... More moves, but less than 5 in a row for either player
        });

        describe('[T2.3] when the move ends the game', () => {
          describe('it checks for winning conditions', () => {
            describe('a horizontal win', () => {
              it('Black wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 8, 'White');
                makeMoveAndCheckState(7, 8, 'Black');
                makeMoveAndCheckState(8, 9, 'White');
                makeMoveAndCheckState(7, 9, 'Black');
                makeMoveAndCheckState(8, 10, 'White');
                makeMoveAndCheckState(7, 10, 'Black');
                makeMoveAndCheckState(8, 11, 'White');
                makeMoveAndCheckState(7, 11, 'Black', 'WIN');
              });
              it('White wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(7, 8, 'White');
                makeMoveAndCheckState(8, 8, 'Black');
                makeMoveAndCheckState(7, 9, 'White');
                makeMoveAndCheckState(8, 9, 'Black');
                makeMoveAndCheckState(7, 10, 'White');
                makeMoveAndCheckState(8, 10, 'Black');
                makeMoveAndCheckState(7, 11, 'White');
                makeMoveAndCheckState(8, 11, 'Black');
                makeMoveAndCheckState(7, 12, 'White', 'WIN');
              });
            });

            describe('a vertical win', () => {
              it('Black wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(7, 8, 'White');
                makeMoveAndCheckState(8, 7, 'Black');
                makeMoveAndCheckState(8, 8, 'White');
                makeMoveAndCheckState(9, 7, 'Black');
                makeMoveAndCheckState(9, 8, 'White');
                makeMoveAndCheckState(10, 7, 'Black');
                makeMoveAndCheckState(10, 8, 'White');
                makeMoveAndCheckState(11, 7, 'Black', 'WIN');
              });
              it('White wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 8, 'White');
                makeMoveAndCheckState(7, 9, 'Black');
                makeMoveAndCheckState(9, 8, 'White');
                makeMoveAndCheckState(7, 10, 'Black');
                makeMoveAndCheckState(10, 8, 'White');
                makeMoveAndCheckState(7, 11, 'Black');
                makeMoveAndCheckState(11, 8, 'White');
                makeMoveAndCheckState(7, 13, 'Black');
                makeMoveAndCheckState(12, 8, 'White', 'WIN');
              });
            });

            describe('a diagonal win', () => {
              it('Black wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 9, 'White');
                makeMoveAndCheckState(8, 8, 'Black');
                makeMoveAndCheckState(9, 10, 'White');
                makeMoveAndCheckState(9, 9, 'Black');
                makeMoveAndCheckState(10, 11, 'White');
                makeMoveAndCheckState(10, 10, 'Black');
                makeMoveAndCheckState(11, 12, 'White');
                makeMoveAndCheckState(11, 11, 'Black', 'WIN');
              });
              it('White wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 8, 'White');
                makeMoveAndCheckState(8, 9, 'Black');
                makeMoveAndCheckState(9, 9, 'White');
                makeMoveAndCheckState(9, 10, 'Black');
                makeMoveAndCheckState(10, 10, 'White');
                makeMoveAndCheckState(10, 11, 'Black');
                makeMoveAndCheckState(11, 11, 'White');
                makeMoveAndCheckState(11, 12, 'Black');
                makeMoveAndCheckState(12, 12, 'White', 'WIN');
              });
            });

            describe('an anti-diagonal win', () => {
              it('Black wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 6, 'White');
                makeMoveAndCheckState(8, 8, 'Black');
                makeMoveAndCheckState(9, 7, 'White');
                makeMoveAndCheckState(9, 9, 'Black');
                makeMoveAndCheckState(10, 8, 'White');
                makeMoveAndCheckState(10, 10, 'Black');
                makeMoveAndCheckState(11, 9, 'White');
                makeMoveAndCheckState(11, 11, 'Black', 'WIN');
              });
              it('White wins', () => {
                makeMoveAndCheckState(7, 7, 'Black');
                makeMoveAndCheckState(8, 6, 'White');
                makeMoveAndCheckState(9, 8, 'Black');
                makeMoveAndCheckState(9, 7, 'White');
                makeMoveAndCheckState(10, 9, 'Black');
                makeMoveAndCheckState(10, 8, 'White');
                makeMoveAndCheckState(11, 10, 'Black');
                makeMoveAndCheckState(11, 9, 'White');
                makeMoveAndCheckState(12, 12, 'Black');
                makeMoveAndCheckState(12, 10, 'White', 'WIN');
              });
            });
            describe('if there are no winning conditions but the board is filled', () => {
              it('Declare a tie', () => {
                // First, fill even rows with alternating black and white game pieces
                for (let row = 0; row < 15; row += 2) {
                  for (let col = 0; col < 11; col += 4) {
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: col + 2, gamePiece: 'White' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: col + 1, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: col + 3, gamePiece: 'White' },
                    });
                  }
                }

                // Then, fill odd rows with alternating black and white game pieces
                for (let row = 1; row < 15; row += 2) {
                  for (let col = 0; col < 11; col += 4) {
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: col + 2, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col, gamePiece: 'White' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: col + 3, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: col + 1, gamePiece: 'White' },
                    });
                  }
                }

                // Finally, fill the remaining cells in all rows
                for (let row = 0; row < 15; row++) {
                  if (row % 2 === 0) {
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: 12, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: 13, gamePiece: 'White' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: 14, gamePiece: 'Black' },
                    });
                  } else {
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: 12, gamePiece: 'White' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player1.id,
                      move: { row, col: 13, gamePiece: 'Black' },
                    });
                    game.applyMove({
                      gameID: game.id,
                      playerID: player2.id,
                      move: { row, col: 14, gamePiece: 'White' },
                    });
                  }
                }

                // Assert the game status is 'OVER' and there is no winner
                expect(game.state.status).toEqual('OVER');
                expect(game.state.winner).toBeUndefined();
              });
            });
          });
        });
      });
    });
  });
});
