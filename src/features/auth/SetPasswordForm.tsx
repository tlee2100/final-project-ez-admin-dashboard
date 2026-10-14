'use client';

import React, { useState } from 'react';
import { Form, Input, Button, Alert, App, Result } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { LockOutlined, CheckCircleFilled, WarningOutlined } from '@ant-design/icons';
import { activateAccountApi } from '@/src/services/auth.service';
import styles from './login.module.css';

interface SetPasswordValues {
  newPassword: string;
  confirmNewPassword: string;
}

export function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const { message } = App.useApp();
  const [form] = Form.useForm<SetPasswordValues>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (values: SetPasswordValues) => {
    if (!token) {
      setErrorMessage('Missing activation token. Please check your activation link.');
      return;
    }

    setErrorMessage(null);
    setLoading(true);

    try {
      await activateAccountApi({
        token,
        newPassword: values.newPassword,
        confirmNewPassword: values.confirmNewPassword,
      });

      setIsSuccess(true);
      message.success('Account activated successfully!');
      setTimeout(() => {
        router.push('/login');
      }, 2500);
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Failed to activate account. The link may have expired or already been used.';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginPage}>
      {/* Brand Logo Top-Left */}
      <div className={styles.brandHeader}>
        <span>EZ-CHATBOT</span>
        <span className={styles.brandDot}>.</span>
      </div>

      {/* Main Container Card */}
      <div className={styles.cardContainer}>
        {isSuccess ? (
          <Result
            icon={<CheckCircleFilled style={{ color: '#10b981', fontSize: 56 }} />}
            title={
              <span style={{ fontSize: 20, fontWeight: 700, color: '#0f172a' }}>
                Account Activated!
              </span>
            }
            subTitle={
              <span style={{ color: '#475569', fontSize: 14 }}>
                Your password has been set successfully. You can now log in with your new
                credentials.
              </span>
            }
            extra={[
              <Button
                key="login"
                type="primary"
                size="large"
                block
                className={styles.loginButton}
                onClick={() => router.push('/login')}
              >
                Go to Sign In
              </Button>,
            ]}
          />
        ) : !token ? (
          <div>
            <h1 className={styles.title}>Invalid Link</h1>
            <Alert
              message="Missing Activation Token"
              description="This password setup link is missing an activation token. Please verify the link in your invitation email or contact your administrator."
              type="warning"
              showIcon
              icon={<WarningOutlined />}
              style={{ marginBottom: 24, borderRadius: 8 }}
            />
            <Button
              type="primary"
              size="large"
              block
              className={styles.loginButton}
              onClick={() => router.push('/login')}
            >
              Back to Sign In
            </Button>
          </div>
        ) : (
          <div>
            <h1 className={styles.title}>Set Your Password</h1>
            <p
              style={{
                textAlign: 'center',
                color: '#64748b',
                fontSize: 14,
                marginTop: -16,
                marginBottom: 24,
              }}
            >
              Please choose a secure password to activate your ezChatBot account.
            </p>

            {errorMessage && (
              <Alert
                message={errorMessage}
                type="error"
                showIcon
                closable
                onClose={() => setErrorMessage(null)}
                className={styles.errorAlert}
              />
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={handleSubmit}
              requiredMark={false}
              initialValues={{ newPassword: '', confirmNewPassword: '' }}
            >
              {/* New Password Field */}
              <Form.Item
                label={<span className={styles.label}>New Password</span>}
                name="newPassword"
                rules={[
                  { required: true, message: 'Please enter your new password!' },
                  { min: 8, message: 'Password must be at least 8 characters!' },
                  {
                    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                    message:
                      'Must contain at least 1 lowercase letter, 1 uppercase letter, and 1 number',
                  },
                ]}
                hasFeedback
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Enter new password"
                  size="large"
                  style={{ borderRadius: '10px', height: '46px' }}
                  autoComplete="new-password"
                />
              </Form.Item>

              {/* Confirm Password Field */}
              <Form.Item
                label={<span className={styles.label}>Confirm New Password</span>}
                name="confirmNewPassword"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(
                        new Error('The two passwords that you entered do not match!'),
                      );
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#94a3b8' }} />}
                  placeholder="Confirm new password"
                  size="large"
                  style={{ borderRadius: '10px', height: '46px' }}
                  autoComplete="new-password"
                />
              </Form.Item>

              {/* Submit Button */}
              <Form.Item style={{ marginBottom: 0 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                  className={styles.loginButton}
                >
                  Activate & Set Password
                </Button>
              </Form.Item>
            </Form>

            <div className={styles.footerText}>
              <button
                type="button"
                onClick={() => router.push('/login')}
                className={styles.forgotPasswordLink}
              >
                Already have an active account? Sign In
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
