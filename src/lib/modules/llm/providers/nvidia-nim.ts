import { BaseProvider, getOpenAILikeModel } from '~/lib/modules/llm/base-provider';
import type { ModelInfo } from '~/lib/modules/llm/types';
import type { IProviderSetting } from '~/types/model';
import type { LanguageModel } from 'ai';
import type { Env } from '~/types/global';

export default class NvidiaNimProvider extends BaseProvider {
  name = 'Nvidia NIM';
  getApiKeyLink = 'https://build.nvidia.com/explore/discover';

  config = {
    apiTokenKey: 'NVIDIA_NIM_API_KEY',
  };

  staticModels: ModelInfo[] = [
    {
      name: 'meta/llama3-70b-instruct',
      label: 'Llama 3 70B Instruct',
      provider: 'Nvidia NIM',
      maxTokenAllowed: 8000,
    },
    {
      name: 'meta/llama3-8b-instruct',
      label: 'Llama 3 8B Instruct',
      provider: 'Nvidia NIM',
      maxTokenAllowed: 8000,
    },
    {
      name: 'mistralai/mixtral-8x22b-instruct-v0.1',
      label: 'Mixtral 8x22B Instruct',
      provider: 'Nvidia NIM',
      maxTokenAllowed: 8000,
    },
  ];

  getModelInstance(options: {
    model: string;
    serverEnv: Env;
    apiKeys?: Record<string, string>;
    providerSettings?: Record<string, IProviderSetting>;
  }): LanguageModel {
    const { model, serverEnv, apiKeys, providerSettings } = options;
    const envRecord = this.convertEnvToRecord(serverEnv);

    const { apiKey } = this.getProviderBaseUrlAndKey({
      apiKeys,
      providerSettings: providerSettings?.[this.name],
      serverEnv: envRecord,
      defaultBaseUrlKey: '',
      defaultApiTokenKey: 'NVIDIA_NIM_API_KEY',
    });

    if (!apiKey) {
      throw new Error(`Missing API Key for ${this.name} provider`);
    }

    return getOpenAILikeModel('https://integrate.api.nvidia.com/v1', apiKey, model);
  }
}
