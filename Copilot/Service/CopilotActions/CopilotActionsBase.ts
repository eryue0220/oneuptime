import NotImplementedException from "Common/Types/Exception/NotImplementedException";
import LlmType from "../../Types/LlmType";
import CopilotActionType from "Common/Types/Copilot/CopilotActionType";
import LLM from "../LLM/LLM";
import { GetLlmType } from "../../Config";
import Text from "Common/Types/Text";
import LocalFile from "CommonServer/Utils/LocalFile";
import CodeRepositoryFile from "CommonServer/Utils/CodeRepository/CodeRepositoryFile";
import Dictionary from "Common/Types/Dictionary";
import { CopilotPromptResult } from "../LLM/LLMBase";
import BadDataException from "Common/Types/Exception/BadDataException";
import logger from "CommonServer/Utils/Logger";
import CodeRepositoryUtil, { RepoScriptType } from "../../Utils/CodeRepository";

export interface CopilotActionRunResult {
  files: Dictionary<CodeRepositoryFile>;
}

export enum PromptRole {
  System = "system",
  User = "user",
  Assistant = "assistant",
}

export interface Prompt {
  content: string;
  role: PromptRole;
}

export interface CopilotActionPrompt {
  messages: Array<Prompt>;
  timeoutInMinutes?: number | undefined;
}

export interface CopilotActionVars {
  currentFilePath: string;
  files: Dictionary<CodeRepositoryFile>;
}

export interface CopilotProcess {
  result: CopilotActionRunResult;
  input: CopilotActionVars;
}

export default class CopilotActionBase {
  public llmType: LlmType = LlmType.Llama;

  public copilotActionType: CopilotActionType =
    CopilotActionType.IMPROVE_COMMENTS; // temp value which will be overridden in the constructor

  public acceptFileExtentions: string[] = [];

  public constructor() {
    this.llmType = GetLlmType();
  }

  public async validateExecutionStep(data: CopilotProcess): Promise<boolean> {
    if (!this.copilotActionType) {
      throw new BadDataException("Copilot Action Type is not set");
    }

    // check if the file extension is accepted or not

    if (
      !this.acceptFileExtentions.find((item: string) => {
        return item.includes(
          LocalFile.getFileExtension(data.input.currentFilePath),
        );
      })
    ) {
      logger.info(
        `The file extension ${data.input.currentFilePath.split(".").pop()} is not accepted by the copilot action ${this.copilotActionType}. Ignore this file...`,
      );

      return false;
    }

    return true;
  }

  public async onAfterExecute(data: CopilotProcess): Promise<CopilotProcess> {
    // do nothing
    return data;
  }

  public async onBeforeExecute(data: CopilotProcess): Promise<CopilotProcess> {
    // do nothing
    return data;
  }

  public async getBranchName(): Promise<string> {
    const randomText: string = Text.generateRandomText(5);
    const bracnhName: string = `${Text.pascalCaseToDashes(this.copilotActionType).toLowerCase()}-${randomText}`;
    // replace -- with - in the branch name
    return Text.replaceAll(bracnhName, "--", "-");
  }

  public async getPullRequestTitle(data: CopilotProcess): Promise<string> {
    return `[OneUptime Copilot] ${this.copilotActionType} on ${data.input.currentFilePath}`;
  }

  public async getPullRequestBody(data: CopilotProcess): Promise<string> {
    return `OneUptime Copilot: ${this.copilotActionType} on ${data.input.currentFilePath}
    
${await this.getDefaultPullRequestBody()}
    `;
  }

  public async getDefaultPullRequestBody(): Promise<string> {
    return `
    
#### Warning
This PR is generated by OneUptime Copilot. OneUptime Copilot is an AI tool that improves your code. Please do not rely on it completely. Always review the changes before merging. 

#### Feedback
If you have  any feedback or suggestions, please let us know. We would love to hear from you. Please contact us at copilot@oneuptime.com.

    `;
  }

  public async getCommitMessage(data: CopilotProcess): Promise<string> {
    return `OneUptime Copilot: ${this.copilotActionType} on ${data.input.currentFilePath}`;
  }

  public async onExecutionStep(data: CopilotProcess): Promise<CopilotProcess> {
    return Promise.resolve(data);
  }

  public async isActionComplete(_data: CopilotProcess): Promise<boolean> {
    return true; // by default the action is completed
  }

  public async getNextFilePath(_data: CopilotProcess): Promise<string | null> {
    return null;
  }

  public async execute(data: CopilotProcess): Promise<CopilotProcess | null> {
    logger.info(
      "Executing Copilot Action (this will take several minutes to complete): " +
        this.copilotActionType,
    );
    logger.info("Current File Path: " + data.input.currentFilePath);

    const onBeforeExecuteActionScript: string | null =
      await CodeRepositoryUtil.getRepoScript({
        scriptType: RepoScriptType.OnBeforeCopilotAction,
      });

    if (!onBeforeExecuteActionScript) {
      logger.debug(
        "No on-before-copilot-action script found for this repository.",
      );
    } else {
      logger.info("Executing on-before-copilot-action script.");
      await CodeRepositoryUtil.executeScript({
        script: onBeforeExecuteActionScript,
      });
      logger.info("on-before-copilot-action script executed successfully");
    }

    data = await this.onBeforeExecute(data);

    if (!data.result) {
      data.result = {
        files: {},
      };
    }

    if (!data.result.files) {
      data.result.files = {};
    }

    let isActionComplete: boolean = false;

    while (!isActionComplete) {
      if (!(await this.validateExecutionStep(data))) {
        // execution step not valid
        // return data as it is

        return data;
      }

      data = await this.onExecutionStep(data);

      isActionComplete = await this.isActionComplete(data);
    }

    const onAfterExecuteActionScript: string | null =
      await CodeRepositoryUtil.getRepoScript({
        scriptType: RepoScriptType.OnAfterCopilotAction,
      });

    if (!onAfterExecuteActionScript) {
      logger.debug(
        "No on-after-copilot-action script found for this repository.",
      );
    }

    if (onAfterExecuteActionScript) {
      logger.info("Executing on-after-copilot-action script.");
      await CodeRepositoryUtil.executeScript({
        script: onAfterExecuteActionScript,
      });
      logger.info("on-after-copilot-action script executed successfully");
    }

    return await this.onAfterExecute(data);
  }

  protected async _getPrompt(
    data: CopilotProcess,
    inputCode: string,
  ): Promise<CopilotActionPrompt | null> {
    const prompt: CopilotActionPrompt | null = await this._getPrompt(
      data,
      inputCode,
    );

    if (!prompt) {
      return null;
    }

    return prompt;
  }

  public async getPrompt(
    _data: CopilotProcess,
    _inputCode: string,
  ): Promise<CopilotActionPrompt | null> {
    throw new NotImplementedException();
  }

  public async askCopilot(
    prompt: CopilotActionPrompt,
  ): Promise<CopilotPromptResult> {
    return await LLM.getResponse(prompt);
  }

  public async getInputCode(data: CopilotProcess): Promise<string> {
    return data.input.files[data.input.currentFilePath]?.fileContent as string;
  }

  public async splitInputCode(data: {
    copilotProcess: CopilotProcess;
    itemSize: number;
  }): Promise<string[]> {
    const inputCode: string = await this.getInputCode(data.copilotProcess);

    const items: Array<string> = [];

    const linesInInputCode: Array<string> = inputCode.split("\n");

    let currentItemSize: number = 0;
    const maxItemSize: number = data.itemSize;

    let currentItem: string = "";

    for (const line of linesInInputCode) {
      const words: Array<string> = line.split(" ");

      // check if the current item size is less than the max item size
      if (currentItemSize + words.length < maxItemSize) {
        currentItem += line + "\n";
        currentItemSize += words.length;
      } else {
        // start a new item
        items.push(currentItem);
        currentItem = line + "\n";
        currentItemSize = words.length;
      }
    }

    if (currentItem) {
      items.push(currentItem);
    }

    return items;
  }
}
