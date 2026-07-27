'use client';

import { Button, Card, Flex, Tag, Typography } from 'antd';

export default function Home() {
  return (
    <main className="dashboard">
      <Card>
        <Flex vertical gap={16} align="flex-start">
          <Tag color="blue">Phase 1A</Tag>
          <Typography.Title level={1}>ez-chatbot Admin</Typography.Title>
          <Typography.Text type="secondary">
            Baseline Next.js và Ant Design đã sẵn sàng để phát triển feature.
          </Typography.Text>
          <Button type="primary">Bắt đầu</Button>
        </Flex>
      </Card>
    </main>
  );
}
