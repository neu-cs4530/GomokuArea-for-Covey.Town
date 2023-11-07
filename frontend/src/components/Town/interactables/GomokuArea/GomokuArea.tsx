import {
    Box,
    Button,
    Container,
    Heading,
    List,
    ListItem,
    Modal,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    useToast,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useState } from 'react';
import GomokuAreaController from '../../../../classes/interactable/GomokuAreaController';
import { useInteractable, useInteractableAreaController } from '../../../../classes/TownController';
import useTownController from '../../../../hooks/useTownController';
import { GameStatus, InteractableID } from '../../../../types/CoveyTownSocket';
import GameAreaInteractable from '../GameArea';
import GomokuBoard from './GomokuBoard';

function GomokuArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
    const gameAreaController = useInteractableAreaController<GomokuAreaController>(interactableID);
    const townController = useTownController();
    const toast = useToast();

    const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
    const [joiningGame, setJoiningGame] = useState(false);
    const [blackPlayer, setBlackPlayer] = useState(gameAreaController.black);
    const [whitePlayer, setWhitePlayer] = useState(gameAreaController.white);

    useEffect(() => {
        const updateGameState = () => {
            setGameStatus(gameAreaController.status || 'WAITING_TO_START');
            setBlackPlayer(gameAreaController.black);
            setWhitePlayer(gameAreaController.white);
        };

        gameAreaController.addListener('gameUpdated', updateGameState);
        gameAreaController.addListener('gameEnd', updateGameState);

        return () => {
            gameAreaController.removeListener('gameUpdated', updateGameState);
            gameAreaController.removeListener('gameEnd', updateGameState);
        };
    }, [townController, gameAreaController, toast]);

    let gameStatusText = <></>;
    if (gameStatus === 'IN_PROGRESS') {
        const isOurTurn = gameAreaController.isOurTurn;
        gameStatusText = (
            <>
                Game in progress, {gameAreaController.moveCount} moves in, currently{' '}
                {isOurTurn ? 'your' : gameAreaController.whoseTurn?.userName + "'s"} turn
            </>
        );
    } else {
        let joinGameButton = <></>;
        if (
            (gameAreaController.status === 'WAITING_TO_START' && !gameAreaController.isPlayer) ||
            gameAreaController.status === 'OVER'
        ) {
            joinGameButton = (
                <Button
                    onClick={async () => {
                        setJoiningGame(true);
                        try {
                            await gameAreaController.joinGame();
                            updateGameState();
                        } catch (err) {
                            toast({
                                title: 'Error joining game',
                                description: (err as Error).toString(),
                                status: 'error',
                            });
                        }
                        setJoiningGame(false);
                    }}
                    isLoading={joiningGame}
                    disabled={joiningGame}>
                    Join New Game
                </Button>
            );
        }
        gameStatusText = (
            <Box>
                Game {gameStatus === 'WAITING_TO_START' ? 'not yet started' : 'over'}. {joinGameButton}
            </Box>
        );
    }

    return (
        <Container>
            <Heading as='h3'>Gomoku Game</Heading>
            <List aria-label='list of players in the game'>
                <ListItem>Black: {blackPlayer?.userName || '(No player yet!)'}</ListItem>
                <ListItem>White: {whitePlayer?.userName || '(No player yet!)'}</ListItem>
            </List>
            {gameStatusText}
            <GomokuBoard gameAreaController={gameAreaController} />
        </Container>
    );
}

export default function GomokuAreaWrapper(): JSX.Element {
    const gameArea = useInteractable<GameAreaInteractable>('gameArea');
    const townController = useTownController();
    const closeModal = useCallback(() => {
        if (gameArea) {
            townController.interactEnd(gameArea);
            const controller = townController.getGameAreaController(gameArea);
            controller.leaveGame();
        }
    }, [townController, gameArea]);

    if (gameArea && gameArea.getData('type') === 'Gomoku') {
        return (
            <Modal isOpen={true} onClose={closeModal} closeOnOverlayClick={false}>
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader>{gameArea.name}</ModalHeader>
                    <ModalCloseButton />
                    <GomokuArea interactableID={gameArea.name} />
                </ModalContent>
            </Modal>
        );
    }
    return <></>;
}

