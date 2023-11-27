import React, { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core';
import TextConversation from '../../classes/TextConversation';
import ChatInput from './ChatInput';
import { ChatMessage } from '../../types/CoveyTownSocket'; // Assuming this is where ChatMessage type is defined

const useStyles = makeStyles(() => ({
  chatRoomContainer: {
    position: 'relative',
    display: 'flex',
    width: '100%', // Adjusted to take 100% of the parent width
    height: '100%', // Adjusted to take the full height of the viewport
    flexDirection: 'column',
    background: 'white',
    borderRadius: '0.375rem',
    boxShadow: '0 0 2rem 0 rgba(136, 152, 170, 0.15)',
    zIndex: 100,
    border: 'none',
  },
  chatHeader: {
    position: 'relative',
    background: 'linear-gradient(to right, #E2E8F0, #EDF2F7)',
    padding: '0.5rem 1rem',
    boxShadow: 'inset 0 -1px 0 #E2E8F0',
  },
  messageList: {
    overflowY: 'auto',
    flex: 1,
    padding: '1rem',
    border: '1px solid #E2E8F0',
  },
  chatFooter: {
    position: 'relative',
    padding: '1rem',
    borderTop: '1px solid #E2E8F0',
  },
}));

interface ChatRoomProps {
  conversation: TextConversation;
}

const ChatRoom = ({ conversation }: ChatRoomProps) => {
  const classes = useStyles();

  // Now messages is explicitly an array of ChatMessage objects
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setParticipants] = useState<Set<string>>(new Set());

  // Fetch messages from the server and update the state
  const receiveMessage = useCallback((newMessage: ChatMessage) => {
    setMessages(prevMessages => [...prevMessages, newMessage]);
    // Update participants set
    setParticipants(prevParticipants => {
      const newParticipants = new Set(prevParticipants);
      newParticipants.add(newMessage.author);
      return newParticipants;
    });
  }, []);

  // Subscribe to message updates from TextConversation
  useEffect(() => {
    conversation.onMessageAdded(receiveMessage);
    return () => {
      conversation.offMessageAdded(receiveMessage);
    };
  }, [conversation, receiveMessage]);

  return (
    <div className={classes.chatRoomContainer}>
      <div className={classes.chatHeader}>Chat Room</div>
      <div className={classes.messageList}>
        {messages.map((message, index) => (
          <div key={index} className='message'>
            <strong>{message.author}</strong>: {message.body}
          </div>
        ))}
      </div>
      <div className={classes.chatFooter}>
        <ChatInput conversation={conversation} isChatWindowOpen={true} />
      </div>
    </div>
  );
};

export default ChatRoom;
