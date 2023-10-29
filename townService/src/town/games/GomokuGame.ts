import InvalidParametersError, {
  BOARD_POSITION_NOT_EMPTY_MESSAGE,
  GAME_FULL_MESSAGE,
  GAME_NOT_IN_PROGRESS_MESSAGE,
  MOVE_NOT_YOUR_TURN_MESSAGE,
  PLAYER_ALREADY_IN_GAME_MESSAGE,
  PLAYER_NOT_IN_GAME_MESSAGE,
} from '../../lib/InvalidParametersError';
import Player from '../../lib/Player';
import { GameMove, GomokuGameState, GomokuMove } from '../../types/CoveyTownSocket';
import Game from './Game';

/**
 * A TicTacToeGame is a Game that implements the rules of Tic Tac Toe.
 * @see https://en.wikipedia.org/wiki/Gomoku
 */
export default class GomokuGame extends Game<GomokuGameState, GomokuMove> {
  public constructor() {
    super({
      moves: [],
      status: 'WAITING_TO_START',
    });
  }

  private get _board() {
    const { moves } = this.state;
    const board: string[][] = Array.from({ length: 15 }, () => Array(15).fill(''));
    for (const move of moves) {
      board[move.row][move.col] = move.gamePiece;
    }
    return board;
  }

  private _validateMove(move: GomokuMove) {
    // A move is valid if the space is empty
    for (const m of this.state.moves) {
      if (m.col === move.col && m.row === move.row) {
        throw new InvalidParametersError(BOARD_POSITION_NOT_EMPTY_MESSAGE);
      }
    }

    // A move is only valid if it is the player's turn
    if (move.gamePiece === 'Black' && this.state.moves.length % 2 === 1) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    } else if (move.gamePiece === 'White' && this.state.moves.length % 2 === 0) {
      throw new InvalidParametersError(MOVE_NOT_YOUR_TURN_MESSAGE);
    }
    // A move is valid only if game is in progress
    if (this.state.status !== 'IN_PROGRESS') {
      throw new InvalidParametersError(GAME_NOT_IN_PROGRESS_MESSAGE);
    }
  }

  private _applyMove(move: GomokuMove): void {
    this.state = {
      ...this.state,
      moves: [...this.state.moves, move],
    };
    this._checkForGameEnding();
  }

  private _setWinner(piece: string) {
    this.state = {
      ...this.state,
      status: 'OVER',
      winner: piece === 'Black' ? this.state.black : this.state.white,
    };
  }

  private _checkForGameEnding(): void {
    const board = this._board;

    // Check horizontal lines
    for (let x = 0; x < 15; x++) {
      for (let y = 0; y <= 10; y++) {
        const piece = board[x][y];
        if (
          piece !== '' &&
          board[x][y + 1] === piece &&
          board[x][y + 2] === piece &&
          board[x][y + 3] === piece &&
          board[x][y + 4] === piece
        ) {
          this._setWinner(piece);
          return;
        }
      }
    }

    // Check vertical lines
    for (let x = 0; x <= 10; x++) {
      for (let y = 0; y < 15; y++) {
        const piece = board[x][y];
        if (
          piece !== '' &&
          board[x + 1][y] === piece &&
          board[x + 2][y] === piece &&
          board[x + 3][y] === piece &&
          board[x + 4][y] === piece
        ) {
          this._setWinner(piece);
          return;
        }
      }
    }

    // Check diagonals (top-left to bottom-right)
    for (let x = 0; x <= 10; x++) {
      for (let y = 0; y <= 10; y++) {
        const piece = board[x][y];
        if (
          piece !== '' &&
          board[x + 1][y + 1] === piece &&
          board[x + 2][y + 2] === piece &&
          board[x + 3][y + 3] === piece &&
          board[x + 4][y + 4] === piece
        ) {
          this._setWinner(piece);
          return;
        }
      }
    }

    // Check sub-diagonals (bottom-left to top-right)
    for (let x = 14; x >= 4; x--) {
      for (let y = 0; y <= 10; y++) {
        const piece = board[x][y];
        if (
          piece !== '' &&
          board[x - 1][y + 1] === piece &&
          board[x - 2][y + 2] === piece &&
          board[x - 3][y + 3] === piece &&
          board[x - 4][y + 4] === piece
        ) {
          this._setWinner(piece);
          return;
        }
      }
    }

    let isBoardFull = true;
    for (let x = 0; x < 15; x++) {
      for (let y = 0; y < 15; y++) {
        if (board[x][y] === '') {
          isBoardFull = false;
          break;
        }
      }
    }

    if (isBoardFull) {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: undefined,
      };
    }
  }

  /*
   * Applies a player's move to the Gomoku game.
   * Uses the player's ID to determine which game piece they are using (Black or White).
   * Validates the move before applying it. If the move is invalid, throws an InvalidParametersError with
   * the appropriate error message.
   * A move is invalid if:
   *    - The move is out of bounds (not in the 15x15 grid - use MOVE_OUT_OF_BOUNDS_MESSAGE)
   *    - The move is on a space that is already occupied (use BOARD_POSITION_NOT_EMPTY_MESSAGE)
   *    - The move is not the player's turn (MOVE_NOT_YOUR_TURN_MESSAGE)
   *    - The game is not in progress (GAME_NOT_IN_PROGRESS_MESSAGE)
   *
   * If the move is valid, applies the move to the game and updates the game state.
   *
   * If the move ends the game, updates the game's state.
   * If the move results in a win, updates the game's state to set the status to OVER and sets the winner to the player who made the move.
   * A player wins if they have 5 in a row (horizontally, vertically, or diagonally).
   *
   * @param move The move to apply to the game
   * @throws InvalidParametersError if the move is invalid
   */
  public applyMove(move: GameMove<GomokuMove>): void {
    let gamePiece: 'White' | 'Black';
    if (move.playerID === this.state.white) {
      gamePiece = 'White';
    } else {
      gamePiece = 'Black';
    }
    const cleanMove = {
      gamePiece,
      col: move.move.col,
      row: move.move.row,
    };
    this._validateMove(cleanMove);
    this._applyMove(cleanMove);
  }

  /**
   * Adds a player to the game.
   * Updates the game's state to reflect the new player.
   * If the game is now full (has two players), updates the game's state to set the status to IN_PROGRESS.
   *
   * @param player The player to join the game
   * @throws InvalidParametersError if the player is already in the game (PLAYER_ALREADY_IN_GAME_MESSAGE)
   *  or the game is full (GAME_FULL_MESSAGE)
   */
  protected _join(player: Player): void {
    if (this.state.black === player.id || this.state.white === player.id) {
      throw new InvalidParametersError(PLAYER_ALREADY_IN_GAME_MESSAGE);
    }
    if (!this.state.black) {
      this.state = {
        ...this.state,
        black: player.id,
      };
    } else if (!this.state.white) {
      this.state = {
        ...this.state,
        white: player.id,
      };
    } else {
      throw new InvalidParametersError(GAME_FULL_MESSAGE);
    }
    if (this.state.black && this.state.white) {
      this.state = {
        ...this.state,
        status: 'IN_PROGRESS',
      };
    }
  }

  /**
   * Removes a player from the game.
   * Updates the game's state to reflect the player leaving.
   * If the game has two players in it at the time of call to this method,
   *   updates the game's status to OVER and sets the winner to the other player.
   * If the game does not yet have two players in it at the time of call to this method,
   *   updates the game's status to WAITING_TO_START.
   *
   * @param player The player to remove from the game
   * @throws InvalidParametersError if the player is not in the game (PLAYER_NOT_IN_GAME_MESSAGE)
   */
  protected _leave(player: Player): void {
    if (this.state.black !== player.id && this.state.white !== player.id) {
      throw new InvalidParametersError(PLAYER_NOT_IN_GAME_MESSAGE);
    }
    if (this.state.white === undefined) {
      this.state = {
        moves: [],
        status: 'WAITING_TO_START',
      };
      return;
    }
    if (this.state.black === player.id) {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.white,
      };
    } else {
      this.state = {
        ...this.state,
        status: 'OVER',
        winner: this.state.black,
      };
    }
  }
}
