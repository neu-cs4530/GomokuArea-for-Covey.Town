import React from 'react';
import { render, screen } from '@testing-library/react';
import ChatRoom from './ChatRoom';
import TextConversation from '../../classes/TextConversation';
import PlayerController from '../../classes/PlayerController';
import TownController from '../../classes/TownController';
import { mock } from 'jest-mock-extended';
import { nanoid } from 'nanoid';

describe('ChatRoom', () => {
  const currentUser = 'Current User';
  const otherUser = 'Other User';
  const userMessage = 'This is a message from the current user';
  const otherUserMessage = 'This is a message from another user';

  const thirdUser = 'Third User';
  const fourthUser = 'Fourth User';
  const thirdUserMessage = 'Message from the third user';
  const fourthUserMessage = 'Message from the fourth user';

  const nonExistingUser = 'Non Existing User';
  const nonExistingMessage = 'This is a non-existing message';

  let mockConversation: TextConversation;

  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });

  beforeEach(() => {
    mockConversation = new TextConversation(townController);
    mockConversation.sendMessage = jest.fn();
    mockConversation.onMessageAdded = jest.fn(callback => {
      callback({
        author: currentUser,
        body: userMessage,
        sid: nanoid(),
        dateCreated: new Date(),
      });
      callback({
        author: otherUser,
        body: otherUserMessage,
        sid: nanoid(),
        dateCreated: new Date(),
      });
      callback({
        author: thirdUser,
        body: thirdUserMessage,
        sid: nanoid(),
        dateCreated: new Date(),
      });
      callback({
        author: fourthUser,
        body: fourthUserMessage,
        sid: nanoid(),
        dateCreated: new Date(),
      });
    });
  });

  it('does not display a non-existing participant in the chat room', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const nonExistingUserElement = screen.queryByText(nonExistingUser);
    expect(nonExistingUserElement).not.toBeInTheDocument();
  });

  it('shows the name of the current user for messages sent by them', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const currentUserMessages = screen.getAllByText(currentUser);
    expect(currentUserMessages[0]).toBeInTheDocument();
  });

  it('shows content of the text sent by the current user', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const currentUserMessageElement = screen.getByText((content, element) => {
      return (
        element !== null && element.tagName.toLowerCase() === 'div' && content.includes(userMessage)
      );
    });
    expect(currentUserMessageElement).toBeInTheDocument();
  });

  it('shows the name of other users for messages sent by them', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const otherUserMessages = screen.getAllByText(otherUser);
    expect(otherUserMessages[0]).toBeInTheDocument();
  });

  it('shows content of the text sent by other users', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const otherUserMessageElement = screen.getByText((content, element) => {
      return (
        element !== null &&
        element.tagName.toLowerCase() === 'div' &&
        content.includes(otherUserMessage)
      );
    });
    expect(otherUserMessageElement).toBeInTheDocument();
  });

  it('displays messages from a third participant correctly', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const thirdUserMessageElement = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === 'div' &&
        content.includes(thirdUserMessage),
    );
    expect(thirdUserMessageElement).toBeInTheDocument();
  });

  it('displays messages from a fourth participant correctly', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const fourthUserMessageElement = screen.getByText(
      (content, element) =>
        element !== null &&
        element.tagName.toLowerCase() === 'div' &&
        content.includes(fourthUserMessage),
    );
    expect(fourthUserMessageElement).toBeInTheDocument();
  });

  it('handles multiple participants without interruption', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const allUsers = [currentUser, otherUser, thirdUser, fourthUser];
    allUsers.forEach(user => {
      expect(screen.getByText(user)).toBeInTheDocument();
    });
  });

  it('does not display a non-existing message in the chat room', () => {
    render(<ChatRoom conversation={mockConversation} />);
    const nonExistingMessageElement = screen.queryByText(nonExistingMessage);
    expect(nonExistingMessageElement).not.toBeInTheDocument();
  });
});
