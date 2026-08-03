'use client';

import React, { useEffect, useState } from 'react';
import { App, Avatar, Button, Form, Input, Select, Space, Upload } from 'antd';
import type { UploadFile } from 'antd';
import { SaveOutlined, UploadOutlined, UserOutlined } from '@ant-design/icons';
import { apiRequest } from '@/src/lib/api.client';
import { useCurrentRole } from '@/src/hooks/useCurrentRole';
import '@/src/features/dashboard/components/dashboard.css';

type UserGender = 'male' | 'female' | 'other';

interface UserProfile {
  id: string;
  email: string;
  name: string;
  gender: UserGender | null;
  dateOfBirth: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

interface ProfileFormValues {
  name: string;
  gender?: UserGender;
  dateOfBirth?: string;
  phone?: string;
  avatar?: UploadFile[];
}

interface PasswordFormValues {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

function toFormData(values: ProfileFormValues) {
  const data = new FormData();
  ['name', 'gender', 'dateOfBirth', 'phone'].forEach((key) => {
    const value = values[key as keyof ProfileFormValues];
    if (typeof value === 'string' && value.trim()) data.append(key, value.trim());
  });
  const file = values.avatar?.[0]?.originFileObj;
  if (file) data.append('avatar', file);
  return data;
}

export default function ProfilePage() {
  const { message } = App.useApp();
  const { user: currentUser } = useCurrentRole();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileForm] = Form.useForm<ProfileFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();

  useEffect(() => {
    apiRequest<UserProfile>('/users/me')
      .then((data) => {
        setProfile(data);
        profileForm.setFieldsValue({
          name: data.name,
          gender: data.gender ?? undefined,
          dateOfBirth: data.dateOfBirth ?? undefined,
          phone: data.phone ?? undefined,
        });
      })
      .catch(() => message.error('Cannot load profile'));
  }, [message, profileForm]);

  const updateProfile = async (values: ProfileFormValues) => {
    try {
      const data = await apiRequest<UserProfile>('/users/me', {
        method: 'PATCH',
        body: toFormData(values),
      });
      setProfile(data);
      message.success('Profile updated');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Cannot update profile');
    }
  };

  const changePassword = async (values: PasswordFormValues) => {
    try {
      await apiRequest('/users/me/password', {
        method: 'PATCH',
        body: JSON.stringify(values),
      });
      passwordForm.resetFields();
      message.success('Password changed');
    } catch (error) {
      message.error(error instanceof Error ? error.message : 'Cannot change password');
    }
  };

  return (
    <div className="dashboard-page page-fade-in">
      <div className="dashboard-header" style={{ marginBottom: 16 }}>
        <div>
          <h1 className="dashboard-title">Profile</h1>
          <p className="dashboard-subtitle">Update your account details and password.</p>
        </div>
      </div>

      <Space orientation="vertical" size={16} style={{ width: '100%', maxWidth: 560 }}>
        <Space>
          <Avatar size={48} src={profile?.avatarUrl} icon={<UserOutlined />} />
          <div>
            <div style={{ fontWeight: 600 }}>{profile?.name ?? currentUser?.name}</div>
            <div style={{ color: '#6b7280' }}>{profile?.email ?? currentUser?.email}</div>
          </div>
        </Space>

        <Form form={profileForm} layout="vertical" onFinish={updateProfile}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
          </Form.Item>
          <Form.Item name="dateOfBirth" label="Date of birth">
            <Input type="date" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item
            name="avatar"
            label="Avatar"
            valuePropName="fileList"
            getValueFromEvent={(event: { fileList?: UploadFile[] } | UploadFile[]) =>
              Array.isArray(event) ? event : (event?.fileList ?? [])
            }
          >
            <Upload beforeUpload={() => false} maxCount={1} accept="image/*" listType="picture">
              <Button icon={<UploadOutlined />}>Choose image</Button>
            </Upload>
          </Form.Item>
          <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
            Save profile
          </Button>
        </Form>

        <Form form={passwordForm} layout="vertical" onFinish={changePassword}>
          <Form.Item name="currentPassword" label="Current password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="newPassword"
            label="New password"
            rules={[{ required: true, min: 8, max: 32 }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            name="confirmNewPassword"
            label="Confirm new password"
            rules={[{ required: true, min: 8, max: 32 }]}
          >
            <Input.Password />
          </Form.Item>
          <Button htmlType="submit">Change password</Button>
        </Form>
      </Space>
    </div>
  );
}
