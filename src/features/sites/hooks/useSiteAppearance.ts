import { useState, useCallback } from 'react';
import { Form, notification, message } from 'antd';
import { useUpdate } from '@refinedev/core';
import type { Site } from '../types/site.types';
import type { AppearancePreviewProps } from '../components/configuration/LiveAppearancePreview';
import { siteService } from '../services/site.service';

export interface UseSiteAppearanceOptions {
  site: Site;
  onSave?: (updatedData: Partial<Site>) => void;
}

export type AppearanceFormField = 'botAvatar' | 'launcherIcon';

export interface UploadOptions {
  file: unknown;
  onSuccess?: (body: unknown) => void;
  onError?: (err: Error) => void;
}

const extractColorHex = (colorValue: unknown, fallback?: string): string | undefined => {
  if (typeof colorValue === 'string') return colorValue;
  if (
    colorValue &&
    typeof colorValue === 'object' &&
    'toHexString' in colorValue &&
    typeof (colorValue as { toHexString: () => string }).toHexString === 'function'
  ) {
    return (colorValue as { toHexString: () => string }).toHexString();
  }
  return fallback;
};

export function useSiteAppearance({ site, onSave }: UseSiteAppearanceOptions) {
  const [form] = Form.useForm<AppearancePreviewProps>();
  const { mutate: updateSite, mutation: updateMutation } = useUpdate<Site>();
  const isUpdating = updateMutation.isPending;

  const [uploadingState, setUploadingState] = useState<{
    botAvatar: boolean;
    launcherIcon: boolean;
  }>({
    botAvatar: false,
    launcherIcon: false,
  });

  const initialValues: AppearancePreviewProps = {
    primaryColor: site.primaryColor || '#10b981',
    backgroundColor: site.backgroundColor || '#ffffff',
    botAvatar: site.botAvatar,
    launcherIcon: site.launcherIcon,
    defaultGreetingMessage: site.defaultGreetingMessage || '',
    chatButtonPosition: site.chatButtonPosition || 'Bottom Right',
    chatWindowTitle: site.chatWindowTitle || '',
    chatButtonText: site.chatButtonText || '',
    showAvatar: site.showAvatar ?? true,
  };

  const [liveSettings, setLiveSettings] = useState<AppearancePreviewProps>(initialValues);

  const handleValuesChange = (_: unknown, allValues: AppearancePreviewProps) => {
    setLiveSettings(allValues);
  };

  const handleSubmit = (values: AppearancePreviewProps) => {
    const payload: Partial<Site> = {
      ...values,
      primaryColor: extractColorHex(values.primaryColor, site.primaryColor || '#10b981'),
      backgroundColor: extractColorHex(values.backgroundColor, site.backgroundColor || '#ffffff'),
    };

    updateSite(
      {
        resource: 'sites',
        id: site.id,
        values: payload,
      },
      {
        onSuccess: () => {
          notification.success({
            message: 'Appearance Settings Updated',
            description: 'The appearance settings have been successfully saved.',
          });
          onSave?.(payload);
        },
        onError: (error) => {
          notification.error({
            message: 'Update Failed',
            description: error?.message || 'Failed to save appearance settings.',
          });
        },
      },
    );
  };

  const handleCustomUpload = useCallback(
    (fieldName: AppearanceFormField) => async (options: UploadOptions) => {
      const { file, onSuccess, onError } = options;
      setUploadingState((prev) => ({ ...prev, [fieldName]: true }));

      try {
        const response = await siteService.uploadImage(site.id, file as Blob);

        form.setFieldsValue({ [fieldName]: response.url });
        setLiveSettings((prev) => ({ ...prev, [fieldName]: response.url }));

        if (typeof onSuccess === 'function') {
          onSuccess(response.url);
        }
        message.success('Image uploaded successfully');
      } catch (err: unknown) {
        if (typeof onError === 'function') {
          onError(err as Error);
        }
        message.error((err as Error).message || 'Failed to upload image');
      } finally {
        setUploadingState((prev) => ({ ...prev, [fieldName]: false }));
      }
    },
    [form, site.id],
  );

  return {
    form,
    initialValues,
    liveSettings,
    isUpdating,
    uploadingState,
    handleValuesChange,
    handleSubmit,
    handleCustomUpload,
  };
}
