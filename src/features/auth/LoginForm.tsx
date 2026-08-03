'use client';

import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Alert, App } from 'antd';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/src/contexts/AuthContext';
import styles from './login.module.css';

interface FormValues {
  email: string;
  password: string;
}

export function LoginForm() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const { message, modal } = App.useApp();
  const [form] = Form.useForm<FormValues>();

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // If already authenticated, redirect to /dashboard
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = async (values: FormValues) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      await login(values.email, values.password);
      message.success('Login Successfull, Navigating to Dashboard...');
      router.push('/dashboard');
    } catch (err: unknown) {
      const errorMsg =
        err instanceof Error
          ? err.message
          : 'Login Unsuccessfull. Please check your credentials and try again!';
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotClick = () => {
    modal.info({
      title: 'Forgot Your Password?',
      content:
        'Please contact your organization admin or send email to admin@ezchatbot.io to reset your password.',
      okText: 'I Understand',
      centered: true,
    });
  };

  return (
    <div className={styles.loginPage}>
      {/* Brand Logo Top-Left */}
      <div className={styles.brandHeader}>
        <span>EZ-CHATBOT</span>
        <span className={styles.brandDot}>.</span>
      </div>

      {/* Main Login Card */}
      <div className={styles.cardContainer}>
        <h1 className={styles.title}>Login to your account</h1>

        {errorMessage && (
          <Alert
            title={errorMessage}
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
          initialValues={{ email: '', password: '' }}
        >
          {/* Email Field */}
          <Form.Item
            label={<span className={styles.label}>Email</span>}
            name="email"
            rules={[
              { required: true, message: 'Please input your email!' },
              { type: 'email', message: 'Invalid Emal!' },
            ]}
          >
            <Input
              placeholder="admin@ezchatbot.io"
              size="large"
              style={{ borderRadius: '10px', height: '46px' }}
              autoComplete="email"
            />
          </Form.Item>

          {/* Password Field */}
          <Form.Item
            label={<span className={styles.label}>Password</span>}
            name="password"
            rules={[
              { required: true, message: 'Please input your password!' },
              { min: 6, message: 'Password must be at least 6 characters!' },
            ]}
          >
            <Input.Password
              placeholder="Enter your password"
              size="large"
              style={{ borderRadius: '10px', height: '46px' }}
              autoComplete="current-password"
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
              Login now
            </Button>
          </Form.Item>
        </Form>

        {/* Footer Link: Forgot password */}
        <div className={styles.footerText}>
          <button type="button" onClick={handleForgotClick} className={styles.forgotPasswordLink}>
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
