import { BaseCallbackHandler } from '@langchain/core/callbacks/base';
import type {
    Serialized,
    SerializedNotImplemented,
    SerializedSecret,
} from '@langchain/core/load/serializable';
import type { BaseMessage } from '@langchain/core/messages';
import type { LLMResult } from '@langchain/core/outputs';
import type { IDataObject, ISupplyDataFunctions, JsonObject } from 'n8n-workflow';
import { NodeConnectionTypes, NodeError, NodeOperationError } from 'n8n-workflow';

type TokensUsageParser = (result: LLMResult) => {
    completionTokens: number;
    promptTokens: number;
    totalTokens: number;
};

type RunDetail = {
    index: number;
    messages: BaseMessage[] | string[] | string;
    options: SerializedSecret | SerializedNotImplemented | Record<string, any>;
};

function estimateTokensFromStringList(list: string[]): number {
    const totalChars = list.join('').length;
    return Math.ceil(totalChars / 4);
}

function logAiEvent(executionFunctions: ISupplyDataFunctions, eventType: string, data: any) {
    executionFunctions.logger.info(`🤖 AI事件: ${eventType}`, data);
}

export class N8nLlmTracing extends BaseCallbackHandler {
    name = 'N8nLlmTracing';

    awaitHandlers = true;

    connectionType = NodeConnectionTypes.AiLanguageModel;

    promptTokensEstimate = 0;

    completionTokensEstimate = 0;

    #parentRunIndex?: number;

    runsMap: Record<string, RunDetail> = {};

    options = {
        tokensUsageParser: (result: LLMResult) => {
            const completionTokens = (result?.llmOutput?.tokenUsage?.completionTokens as number) ?? 0;
            const promptTokens = (result?.llmOutput?.tokenUsage?.promptTokens as number) ?? 0;
            return {
                completionTokens,
                promptTokens,
                totalTokens: completionTokens + promptTokens,
            };
        },
        errorDescriptionMapper: (error: NodeError) => error.description,
    };

    constructor(
        private executionFunctions: ISupplyDataFunctions,
        options?: {
            tokensUsageParser?: TokensUsageParser;
            errorDescriptionMapper?: (error: NodeError) => string;
        },
    ) {
        super();
        this.options = { ...this.options, ...options };
    }

    estimateTokensFromGeneration(generations: LLMResult['generations']): number {
        const messages = generations.flatMap((gen) => gen.map((g) => g.text));
        return estimateTokensFromStringList(messages);
    }

    async handleLLMEnd(output: LLMResult, runId: string) {
        const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length };

        output.generations = output.generations.map((gen) =>
            gen.map((g: any) => ({ text: g.text, generationInfo: g.generationInfo })),
        );

        const tokenUsageEstimate = {
            completionTokens: 0,
            promptTokens: 0,
            totalTokens: 0,
        };
        const tokenUsage = this.options.tokensUsageParser(output);

        if (output.generations.length > 0) {
            tokenUsageEstimate.completionTokens = this.estimateTokensFromGeneration(
                output.generations,
            );

            tokenUsageEstimate.promptTokens = this.promptTokensEstimate;
            tokenUsageEstimate.totalTokens =
                tokenUsageEstimate.completionTokens + this.promptTokensEstimate;
        }
        const response: {
            response: { generations: LLMResult['generations'] };
            tokenUsageEstimate?: typeof tokenUsageEstimate;
            tokenUsage?: typeof tokenUsage;
        } = {
            response: { generations: output.generations },
        };

        if (tokenUsage.completionTokens > 0) {
            response.tokenUsage = tokenUsage;
        } else {
            response.tokenUsageEstimate = tokenUsageEstimate;
        }

        const parsedMessages =
            typeof runDetails.messages === 'string'
                ? runDetails.messages
                : runDetails.messages.map((message) => {
                    if (typeof message === 'string') return message;
                    if (typeof (message as any)?.toJSON === 'function') return (message as any).toJSON();
                    return message as any;
                });

        const sourceNodeRunIndex =
            this.#parentRunIndex !== undefined ? this.#parentRunIndex + runDetails.index : undefined;

        this.executionFunctions.addOutputData(
            this.connectionType,
            runDetails.index,
            [[{ json: { ...response } }]],
            undefined,
            sourceNodeRunIndex,
        );

        const responseText = output.generations.flatMap((gen) => gen.map((g) => g.text)).join('\n');
        this.executionFunctions.logger.info(`✅ Kimi LLM处理完成 - 响应长度: ${responseText.length}字符`, {
            runId,
            responseLength: responseText.length,
            tokenUsage: response.tokenUsage || response.tokenUsageEstimate,
            response: responseText.substring(0, 500) + (responseText.length > 500 ? '...' : ''),
            timestamp: new Date().toISOString(),
        });

        logAiEvent(this.executionFunctions, 'ai-llm-generated-output', {
            messages: parsedMessages,
            options: runDetails.options,
            response,
        });
    }

    async handleLLMStart(llm: Serialized, prompts: string[], runId: string) {
        const estimatedTokens = estimateTokensFromStringList(prompts);
        const sourceNodeRunIndex =
            this.#parentRunIndex !== undefined
                ? this.#parentRunIndex + this.executionFunctions.getNextRunIndex()
                : undefined;

        const options = llm.type === 'constructor' ? (llm as any).kwargs : llm;
        const { index } = this.executionFunctions.addInputData(
            this.connectionType,
            [
                [
                    {
                        json: {
                            messages: prompts,
                            estimatedTokens,
                            options,
                        },
                    },
                ],
            ],
            sourceNodeRunIndex,
        );

        this.runsMap[runId] = {
            index,
            options,
            messages: prompts,
        };
        this.promptTokensEstimate = estimatedTokens;

        const modelName = (llm as any).id?.[(llm as any).id.length - 1] || 'Kimi LLM';
        const promptText = prompts.join('\n');

        this.executionFunctions.logger.info(`🚀 Kimi LLM开始处理 - 模型: ${modelName}`, {
            model: modelName,
            runId,
            promptLength: promptText.length,
            estimatedTokens,
            prompt: promptText.substring(0, 300) + (promptText.length > 300 ? '...' : ''),
            timestamp: new Date().toISOString(),
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async handleLLMError(error: IDataObject | Error, runId: string, _parentRunId?: string) {
        const runDetails = this.runsMap[runId] ?? { index: Object.keys(this.runsMap).length };

        if (typeof error === 'object' && Object.prototype.hasOwnProperty.call(error, 'headers')) {
            const errorWithHeaders = error as { headers: Record<string, unknown> };
            Object.keys(errorWithHeaders.headers).forEach((key) => {
                if (!key.startsWith('x-')) {
                    delete (errorWithHeaders.headers as any)[key];
                }
            });
        }

        if (error instanceof NodeError) {
            if (this.options.errorDescriptionMapper) {
                error.description = this.options.errorDescriptionMapper(error);
            }
            this.executionFunctions.addOutputData(this.connectionType, runDetails.index, error);
        } else {
            this.executionFunctions.addOutputData(
                this.connectionType,
                runDetails.index,
                new NodeOperationError(this.executionFunctions.getNode(), error as JsonObject, {
                    functionality: 'configuration-node',
                }),
            );
        }

        this.executionFunctions.logger.error('❌ Kimi LLM发生错误', {
            runId,
            error: (error as any)?.message ?? String(error),
            timestamp: new Date().toISOString(),
        });
    }

    setParentRunIndex(runIndex: number) {
        this.#parentRunIndex = runIndex;
    }
}