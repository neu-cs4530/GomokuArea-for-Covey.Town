import React, { useState, useEffect, useCallback } from 'react';
import { makeStyles } from '@material-ui/core';
import TextConversation from '../../classes/TextConversation';
import useTownController from '../../hooks/useTownController';
import ChatInput from './ChatInput';
import { ChatMessage } from '../../types/CoveyTownSocket'; // Assuming this is where ChatMessage type is defined

const useStyles = makeStyles((theme) => ({
  chatRoomContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 300,
    background: 'white',
    border: '1px solid #ddd',
    zIndex: 100,
  }
}))

interface ChatRoomProps {
  conversation: TextConversation;
}

const ChatRoom = ({ conversation }: ChatRoomProps) => {
  const classes = useStyles();

  // Now messages is explicitly an array of ChatMessage objects
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<Set<string>>(new Set());
  const coveyTownController = useTownController();

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
      conversation.offMessageAdded(receiveMessage); // Unsubscribe on component unmount
    };
  }, [conversation, receiveMessage]);

  return (
    <div className={classes.chatRoomContainer}>
      <div className="chat-header">
        Chat Room
        <button onClick={() => coveyTownController.unPause()}>Back to Game</button>
      </div>
      <div className="message-list">
        {messages.map((message, index) => (
          <div key={index} className="message">
            <strong>{message.author}</strong>: {message.body}
          </div>
        ))}
      </div>
      <div className="chat-footer">
        <ChatInput conversation={conversation} isChatWindowOpen={true} />
      </div>
    </div>
  );
};

export default ChatRoom;
