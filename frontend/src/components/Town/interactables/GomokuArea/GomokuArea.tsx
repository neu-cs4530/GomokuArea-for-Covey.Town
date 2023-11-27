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

// chat room imports
import ChatRoom from '../../../ChatRoom/ChatRoom';
import TextConversation from '../../../../classes/TextConversation';

function GomokuArea({ interactableID }: { interactableID: InteractableID }): JSX.Element {
  const gameAreaController = useInteractableAreaController<GomokuAreaController>(interactableID);
  const townController = useTownController();
  const toast = useToast();

  // State for controlling the visibility of the chat room
  const [isChatOpen, setIsChatOpen] = useState(false);
  const toggleChat = () => setIsChatOpen(!isChatOpen);

  // Create a TextConversation instance or retrieve from state/context
  const conversation = new TextConversation(townController);

  const [gameStatus, setGameStatus] = useState<GameStatus>(gameAreaController.status);
  const [joiningGame, setJoiningGame] = useState(false);
  const [blackPlayer, setBlackPlayer] = useState(gameAreaController.black);
  const [whitePlayer, setWhitePlayer] = useState(gameAreaController.white);

  const updateGameState = () => {
    setGameStatus(gameAreaController.status || 'WAITING_TO_START');
    setBlackPlayer(gameAreaController.black);
    setWhitePlayer(gameAreaController.white);
  };

  useEffect(() => {
    gameAreaController.addListener('gameUpdated', updateGameState);

    // Listen for game state updates
    gameAreaController.addListener('gameUpdated', updateGameState);

    // Listen for the end of the game to determine the winner
    const onGameEnd = () => {
      const winner = gameAreaController.winner;
      if (!winner) {
        toast({
          title: 'Game over',
          description: 'The game ended in a tie',
          status: 'info',
        });
      } else if (winner.id === townController.ourPlayer.id) {
        toast({
          title: 'Game over',
          description: 'Congratulations, you won!',
          status: 'success',
        });
      } else {
        toast({
          title: 'Game over',
          description: `Oh no, you lost! Better luck next time!`,
          status: 'error',
        });
      }
    };

    gameAreaController.addListener('gameEnd', onGameEnd);

    return () => {
      gameAreaController.removeListener('gameUpdated', updateGameState);
      gameAreaController.removeListener('gameEnd', onGameEnd);
    };
  }, [townController, gameAreaController, toast, updateGameState]);

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
    <Box display="flex" justifyContent="space-between">
      <Container>
        <Heading as='h3'>Gomoku Game</Heading>
        <List aria-label='list of players in the game'>
          <ListItem>Black: {blackPlayer?.userName || '(No player yet!)'}</ListItem>
          <ListItem>White: {whitePlayer?.userName || '(No player yet!)'}</ListItem>
        </List>
        {gameStatusText}
        <GomokuBoard gameAreaController={gameAreaController} />
      </Container>
      <Button onClick={toggleChat} size="sm" m="4">
        {isChatOpen ? 'Close Chat' : 'Open Chat'}
      </Button>
      {isChatOpen && (
        <Box width="350px" height="100vh" overflow="auto">
          <ChatRoom conversation={conversation} />
        </Box>
      )}
    </Box>
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
