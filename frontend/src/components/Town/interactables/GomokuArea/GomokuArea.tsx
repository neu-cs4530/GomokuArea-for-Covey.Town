import {
  Box,
  Button,
  Container,
  Flex,
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
  const [moveCount, setMoveCount] = useState(gameAreaController.moveCount);
  const [isOurTurn, setIsOurTurn] = useState(gameAreaController.isOurTurn);

  const updateGameState = () => {
    setGameStatus(gameAreaController.status || 'WAITING_TO_START');
    setBlackPlayer(gameAreaController.black);
    setWhitePlayer(gameAreaController.white);
    setMoveCount(gameAreaController.moveCount);
    setIsOurTurn(gameAreaController.isOurTurn);
  };

  useEffect(() => {
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
  }, [townController, toast, gameAreaController]);

  let gameStatusText = <></>;
  if (gameStatus === 'IN_PROGRESS') {
    const isOurTurn = gameAreaController.isOurTurn;
    gameStatusText = (
      <>
        Game in progress, {moveCount} moves in, currently{' '}
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
      <div>
        <Box>Game {gameStatus === 'WAITING_TO_START' ? 'not yet started' : 'over'}.</Box>
        {joinGameButton}
      </div>
    );
  }

  return (
    <Container maxW='container.xl'>
      <Flex direction={{ base: 'column', md: 'row' }} mt='4' align='flex-start' h='100%'>
        <Box flex='1' minW='0'>
          <List aria-label='list of players in the game'>
            <ListItem>Black: {blackPlayer?.userName || '(No player yet!)'}</ListItem>
            <ListItem>White: {whitePlayer?.userName || '(No player yet!)'}</ListItem>
          </List>
          <Flex alignItems='center' justifyContent='space-between'>
            <Box flexGrow={1}>{gameStatusText}</Box>
            <Button onClick={toggleChat} size='sm' ml='4' bg='blue.500' color='white'>
              {isChatOpen ? 'Close Chat' : 'Open Chat'}
            </Button>
          </Flex>
          <Box mt='4'>
            <GomokuBoard gameAreaController={gameAreaController} />
          </Box>
        </Box>

        {isChatOpen && (
          <Box
            position='relative'
            flex='0.5'
            ml={{ md: '4' }}
            h='100%'
            w={{ base: 'full', md: '350px' }}>
            <ChatRoom conversation={conversation} />
          </Box>
        )}
      </Flex>
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
        <ModalContent minW='60vw' minH='80vh'>
          <ModalHeader>{gameArea.name}</ModalHeader>
          <ModalCloseButton />
          <GomokuArea interactableID={gameArea.name} />
        </ModalContent>
      </Modal>
    );
  }
  return <></>;
}
