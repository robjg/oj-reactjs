import type { Meta, StoryObj } from '@storybook/react';

import { InvokeForm } from './InvokeForm';

const meta = {
  title: 'WithServer/InvokeForm',
  component: InvokeForm
} satisfies Meta<typeof InvokeForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    url: 'http://localhost:8080/invoke'
  }
};

