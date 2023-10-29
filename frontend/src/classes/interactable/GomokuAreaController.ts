import _ from "lodash";
import { GomokuGameState, GameStatus, GameArea } from "../../types/CoveyTownSocket";
import PlayerController from "../PlayerController";
import GameAreaController, { GameEventTypes } from "./GameAreaController";

export const PLAYER_NOT_IN_GAME_ERROR = 'Player is not in game';
export const NO_GAME_IN_PROGRESS_ERROR = 'No game in progress';

export type GomokuCell = 'Black' | 'White' | undefined;

export type GomokuEvents = GameEventTypes & {
    boardChanged: (board: GomokuCell[][]) => void;
    turnChanged: (isOurTurn: boolean) => void;
};

export default class GomokuAreaController extends GameAreaController<GomokuGameState, GomokuEvents> {
    protected _board: GomokuCell[][] = Array.from({ length: 15 }, () => Array(15).fill(undefined));

    get board(): GomokuCell[][] {
        return this._board;
    }

    get black(): PlayerController | undefined {
        const black = this._model.game?.state.black;
        return black ? this.occupants.find(eachOccupant => eachOccupant.id === black) : undefined;
    }

    get white(): PlayerController | undefined {
        const white = this._model.game?.state.white;
        return white ? this.occupants.find(eachOccupant => eachOccupant.id === white) : undefined;
    }

    get moveCount(): number {
        return this._model.game?.state.moves.length || 0;
    }

    get winner(): PlayerController | undefined {
        const winner = this._model.game?.state.winner;
        return winner ? this.occupants.find(eachOccupant => eachOccupant.id === winner) : undefined;
    }

    get whoseTurn(): PlayerController | undefined {
        const black = this.black;
        const white = this.white;
        if (!black || !white || this._model.game?.state.status !== 'IN_PROGRESS') {
            return undefined;
        }
        return this.moveCount % 2 === 0 ? black : white;
    }

    get isOurTurn(): boolean {
        return this.whoseTurn?.id === this._townController.ourPlayer.id;
    }

    get isPlayer(): boolean {
        return this._model.game?.players.includes(this._townController.ourPlayer.id) || false;
    }

    get gamePiece(): 'Black' | 'White' {
        if (this.black?.id === this._townController.ourPlayer.id) {
            return 'Black';
        } else if (this.white?.id === this._townController.ourPlayer.id) {
            return 'White';
        }
        throw new Error(PLAYER_NOT_IN_GAME_ERROR);
    }

    get status(): GameStatus {
        return this._model.game?.state.status || 'WAITING_TO_START';
    }

    public isActive(): boolean {
        return this._model.game?.state.status === 'IN_PROGRESS';
    }

    protected _updateFrom(newModel: GameArea<GomokuGameState>): void {
        const wasOurTurn = this.whoseTurn?.id === this._townController.ourPlayer.id;
        super._updateFrom(newModel);
        const newState = newModel.game;
        if (newState) {
            const newBoard = Array.from({ length: 15 }, () => Array(15).fill(undefined));
            newState.state.moves.forEach(move => {
                newBoard[move.row][move.col] = move.gamePiece;
            });
            if (!_.isEqual(newBoard, this._board)) {
                this._board = newBoard;
                this.emit('boardChanged', this._board);
            }
        }
        const isOurTurn = this.whoseTurn?.id === this._townController.ourPlayer.id;
        if (wasOurTurn !== isOurTurn) this.emit('turnChanged', isOurTurn);
    }

    public async makeMove(row: number, col: number) {
        const instanceID = this._instanceID;
        if (!instanceID || this._model.game?.state.status !== 'IN_PROGRESS') {
            throw new Error(NO_GAME_IN_PROGRESS_ERROR);
        }
        await this._townController.sendInteractableCommand(this.id, {
            type: 'GameMove',
            gameID: instanceID,
            move: {
                row,
                col,
                gamePiece: this.gamePiece,
            },
        });
    }
}
