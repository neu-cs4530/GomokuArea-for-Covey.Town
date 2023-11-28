import { fireEvent, render, screen } from '@testing-library/react';
import TextConversation from '../../classes/TextConversation';
import ChatInput from './ChatInput';
import { mock } from 'jest-mock-extended';
import PlayerController from '../../classes/PlayerController';
import TownController from '../../classes/TownController';
import React from 'react';

describe('Content in the Chat room', () => {
  let ourPlayer: PlayerController;
  const townController = mock<TownController>();
  Object.defineProperty(townController, 'ourPlayer', { get: () => ourPlayer });
  describe('Chat input', () => {
    it('inputs keyboard text correctly into chat input', () => {
      const mockConversation = new TextConversation(townController);
      render(<ChatInput conversation={mockConversation} isChatWindowOpen={false} />);

      const chatInput = screen.getByPlaceholderText('Write a message...') as HTMLTextAreaElement;
      expect(chatInput).toBeInTheDocument();

      const testMessage = 'Hello World';
      fireEvent.change(chatInput, { target: { value: testMessage } });

      expect(chatInput.value).toBe(testMessage);

      jest.spyOn(mockConversation, 'sendMessage');
      expect(mockConversation.sendMessage).not.toHaveBeenCalled();
    });
    it('sends message on Send button click', () => {
      const mockConversation = new TextConversation(townController);
      jest.spyOn(mockConversation, 'sendMessage');

      render(<ChatInput conversation={mockConversation} isChatWindowOpen={true} />);

      const chatInput = screen.getByPlaceholderText('Write a message...') as HTMLTextAreaElement;
      const testMessage = 'Test Message';
      fireEvent.change(chatInput, { target: { value: testMessage } });

      const sendButton = screen.getByText('Send');
      fireEvent.click(sendButton);

      expect(mockConversation.sendMessage).toHaveBeenCalledWith(testMessage.trim());

      expect(chatInput.value).toBe('');
    });
    it('responds to Enter key press', () => {
      const mockConversation = new TextConversation(townController);
      jest.spyOn(mockConversation, 'sendMessage');

      render(<ChatInput conversation={mockConversation} isChatWindowOpen={true} />);

      const chatInput = screen.getByPlaceholderText('Write a message...') as HTMLTextAreaElement;
      const testMessage = 'Test Message';
      fireEvent.change(chatInput, { target: { value: testMessage } });

      fireEvent.keyPress(chatInput, { key: 'Enter', code: 'Enter', charCode: 13 });

      expect(mockConversation.sendMessage).toHaveBeenCalledWith(testMessage.trim());

      expect(chatInput.value).toBe('');
    });

    it('does not send message on Shift+Enter key press', () => {
      const mockConversation = new TextConversation(townController);
      jest.spyOn(mockConversation, 'sendMessage');

      render(<ChatInput conversation={mockConversation} isChatWindowOpen={true} />);

      const chatInput = screen.getByPlaceholderText('Write a message...') as HTMLTextAreaElement;
      const testMessage = 'Another Test Message';
      fireEvent.change(chatInput, { target: { value: testMessage } });

      fireEvent.keyPress(chatInput, {
        key: 'Enter',
        code: 'Enter',
        charCode: 13,
        shiftKey: true,
      });

      expect(mockConversation.sendMessage).not.toHaveBeenCalled();
    });
  });
});
