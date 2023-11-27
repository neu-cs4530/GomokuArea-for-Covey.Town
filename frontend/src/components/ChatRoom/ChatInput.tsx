import React, { useState, useRef } from 'react';
import TextareaAutosize from '@material-ui/core/TextareaAutosize';
import TextConversation from '../../classes/TextConversation';

interface ChatInputProps {
  conversation: TextConversation;
  isChatWindowOpen: boolean;
}

const ChatInput = ({ conversation }: ChatInputProps) => {
  const [messageBody, setMessageBody] = useState('');
  const textInputRef = useRef(null);

  const handleSendMessage = () => {
    if (/\S/.test(messageBody)) {
      conversation.sendMessage(messageBody.trim());
      setMessageBody('');
    }
  };

  const handleReturnKeyPress = (event: {
    key: string;
    shiftKey: unknown;
    preventDefault: () => void;
  }) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <form
      onSubmit={e => {
        e.preventDefault();
        handleSendMessage();
      }}
      className='chat-input-form'>
      <TextareaAutosize
        minRows={1}
        maxRows={3}
        className='chat-input'
        placeholder='Write a message...'
        onKeyPress={handleReturnKeyPress}
        onChange={e => setMessageBody(e.target.value)}
        value={messageBody}
        ref={textInputRef}
      />
      <button type='submit' className='send-button'>
        Send
      </button>
    </form>
  );
};

export default ChatInput;
