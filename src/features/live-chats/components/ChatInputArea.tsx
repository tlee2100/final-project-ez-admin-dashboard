'use client';

import React, { useState } from 'react';
import { Button, Input, Upload, Image, message } from 'antd';
import {
  SendOutlined,
  PictureOutlined,
  LoadingOutlined,
  CloseCircleFilled,
} from '@ant-design/icons';
import { chatUploadService } from '../services/chatUpload.service';

const { TextArea } = Input;

interface ChatInputAreaProps {
  conversationId: string;
  isSending: boolean;
  isPaused: boolean;
  isConnected: boolean;
  onSendMessage: (content: string) => Promise<void>;
  onTyping: () => void;
}

export function ChatInputArea({
  conversationId,
  isSending,
  isPaused,
  isConnected,
  onSendMessage,
  onTyping,
}: ChatInputAreaProps) {
  const [inputValue, setInputValue] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [attachments, setAttachments] = useState<Array<{ file: File; previewUrl: string }>>([]);

  const handleFileSelect = (file: File) => {
    setAttachments((prev) => [...prev, { file, previewUrl: URL.createObjectURL(file) }]);
    return false; // Prevent automatic upload
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => {
      const newAttachments = [...prev];
      URL.revokeObjectURL(newAttachments[index].previewUrl);
      newAttachments.splice(index, 1);
      return newAttachments;
    });
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text && attachments.length === 0) return;

    let finalMessage = text;

    if (attachments.length > 0) {
      setIsUploading(true);
      try {
        const files = attachments.map((a) => a.file);
        const uploadedMarkdowns = await chatUploadService.uploadMultipleImages(
          conversationId,
          files,
        );
        const imagesText = uploadedMarkdowns.join('\n\n');
        finalMessage = finalMessage ? `${imagesText}\n\n${finalMessage}` : imagesText;
      } catch {
        message.error('Failed to upload one or more images');
        setIsUploading(false);
        return;
      }
    }

    setInputValue('');
    attachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setAttachments([]);
    setIsUploading(false);
    await onSendMessage(finalMessage);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          handleFileSelect(file);
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        padding: '14px 20px',
      }}
    >
      {attachments.length > 0 && (
        <div style={{ display: 'flex', gap: 8, marginLeft: 30, flexWrap: 'wrap' }}>
          {attachments.map((att, index) => (
            <div key={index} style={{ position: 'relative', width: 60, height: 60 }}>
              <Image
                src={att.previewUrl}
                width={60}
                height={60}
                style={{ objectFit: 'cover', borderRadius: 8 }}
                preview={true}
                alt="Attachment preview"
              />
              <CloseCircleFilled
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  color: '#ff4d4f',
                  cursor: 'pointer',
                  fontSize: 16,
                  background: 'white',
                  borderRadius: '50%',
                }}
                onClick={() => removeAttachment(index)}
              />
            </div>
          ))}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          background: '#ffffff',
          borderRadius: 24,
          padding: '4px 6px',
          border: '1px solid #e5e7eb',
          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        }}
      >
        <Upload
          beforeUpload={handleFileSelect}
          showUploadList={false}
          accept="image/*"
          disabled={isSending || isPaused || isUploading}
        >
          <Button
            type="text"
            icon={
              isUploading ? (
                <LoadingOutlined style={{ fontSize: 20 }} />
              ) : (
                <PictureOutlined style={{ fontSize: 20 }} />
              )
            }
            disabled={isSending || isPaused || isUploading}
            style={{
              padding: '4px 8px',
              color: '#6b7280',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 36,
            }}
          />
        </Upload>
        <TextArea
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            onTyping();
          }}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={
            isPaused
              ? 'Conversation is paused'
              : 'Type your reply… (Enter to send, Shift+Enter for new line)'
          }
          autoSize={{ minRows: 1, maxRows: 4 }}
          variant="borderless"
          style={{
            flex: 1,
            resize: 'none',
            padding: '6px 0',
            background: 'transparent',
            boxShadow: 'none',
          }}
          disabled={isSending || isPaused || isUploading}
        />
        <Button
          type="primary"
          shape="circle"
          icon={<SendOutlined style={{ color: '#ffffff', fontSize: 16 }} />}
          onClick={handleSend}
          loading={isSending || isUploading}
          disabled={
            (inputValue.trim() === '' && attachments.length === 0) ||
            !isConnected ||
            isPaused ||
            isUploading
          }
          style={{
            background: '#6366f1',
            borderColor: '#6366f1',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            minWidth: 36,
            marginBottom: 2,
          }}
        />
      </div>
    </div>
  );
}
