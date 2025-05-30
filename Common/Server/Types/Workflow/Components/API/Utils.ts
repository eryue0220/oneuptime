import { RunOptions } from "../../ComponentCode";
import HTTPErrorResponse from "../../../../../Types/API/HTTPErrorResponse";
import HTTPResponse from "../../../../../Types/API/HTTPResponse";
import URL from "../../../../../Types/API/URL";
import BadDataException from "../../../../../Types/Exception/BadDataException";
import { JSONObject } from "../../../../../Types/JSON";
import JSONFunctions from "../../../../../Types/JSONFunctions";
import ComponentMetadata, {
  Port,
} from "../../../../../Types/Workflow/Component";
import CaptureSpan from "../../../../Utils/Telemetry/CaptureSpan";

export class ApiComponentUtils {
  @CaptureSpan()
  public static getReturnValues(
    response: HTTPResponse<JSONObject> | HTTPErrorResponse,
  ): JSONObject {
    if (response instanceof HTTPErrorResponse) {
      return {
        "response-status": response.statusCode,
        "response-body": response.jsonData,
        "response-headers": response.headers,
        error: response.message || "Server Error.",
      };
    }

    return {
      "response-status": response.statusCode,
      "response-body": response.jsonData,
      "response-headers": response.headers,
      error: null,
    };
  }

  @CaptureSpan()
  public static sanitizeArgs(
    metadata: ComponentMetadata,
    args: JSONObject,
    options: RunOptions,
  ): { args: JSONObject; successPort: Port; errorPort: Port } {
    const successPort: Port | undefined = metadata.outPorts.find((p: Port) => {
      return p.id === "success";
    });

    if (!successPort) {
      throw options.onError(new BadDataException("Success port not found"));
    }

    const errorPort: Port | undefined = metadata.outPorts.find((p: Port) => {
      return p.id === "error";
    });

    if (!errorPort) {
      throw options.onError(new BadDataException("Error port not found"));
    }

    if (args["request-body"] && typeof args["request-body"] === "string") {
      args["request-body"] = JSONFunctions.parse(
        `${args["request-body"] as string}`,
      );
    }

    if (
      args["request-headers"] &&
      typeof args["request-headers"] === "string"
    ) {
      args["request-headers"] = JSONFunctions.parse(
        args["request-headers"] as string,
      );
    }

    if (!args["url"]) {
      throw options.onError(new BadDataException("URL not found"));
    }

    if (args["url"] && typeof args["url"] !== "string") {
      throw options.onError(new BadDataException("URL is not type of string"));
    }

    args["url"] = URL.fromString(args["url"] as string);

    return { args, successPort, errorPort };
  }
}
