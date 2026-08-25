import React from 'react';
import { Form, Upload, Button, FormInstance } from 'antd';
import { UploadOutlined, LoadingOutlined } from '@ant-design/icons';
import type { UploadRequestOption } from 'rc-upload/lib/interface';

export interface AppearanceImageUploaderProps {
  name: string;
  label: string;
  uploadText: string;
  changeText: string;
  uploading: boolean;
  form: FormInstance;
  customRequest: (options: UploadRequestOption) => void;
  alt?: string;
}

export function AppearanceImageUploader({
  name,
  label,
  uploadText,
  changeText,
  uploading,
  form,
  customRequest,
  alt = 'Image Preview',
}: AppearanceImageUploaderProps) {
  const currentValue = form.getFieldValue(name);

  return (
    <Form.Item label={label}>
      <Form.Item name={name} noStyle>
        <input type="hidden" />
      </Form.Item>
      <Upload
        accept="image/*"
        showUploadList={false}
        customRequest={customRequest as unknown as (options: unknown) => void}
      >
        <Button icon={uploading ? <LoadingOutlined /> : <UploadOutlined />} disabled={uploading}>
          {currentValue ? changeText : uploadText}
        </Button>
      </Upload>
      <Form.Item
        shouldUpdate={(prevValues, currentValues) => prevValues[name] !== currentValues[name]}
        noStyle
      >
        {({ getFieldValue }) => {
          const imageUrl = getFieldValue(name);
          return imageUrl ? (
            <div className="appearance-thumbnail-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={alt} className="appearance-thumbnail-image" />
            </div>
          ) : null;
        }}
      </Form.Item>
    </Form.Item>
  );
}
