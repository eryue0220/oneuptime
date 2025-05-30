import DatabaseService from "../../../../Services/DatabaseService";
import Query from "../../../Database/Query";
import ComponentCode, { RunOptions, RunReturnType } from "../../ComponentCode";
import BaseModel from "../../../../../Models/DatabaseModels/DatabaseBaseModel/DatabaseBaseModel";
import QueryDeepPartialEntity from "../../../../../Types/Database/PartialEntity";
import BadDataException from "../../../../../Types/Exception/BadDataException";
import { JSONObject } from "../../../../../Types/JSON";
import JSONFunctions from "../../../../../Types/JSONFunctions";
import Text from "../../../../../Types/Text";
import ComponentMetadata, {
  Port,
} from "../../../../../Types/Workflow/Component";
import BaseModelComponents from "../../../../../Types/Workflow/Components/BaseModel";
import CaptureSpan from "../../../../Utils/Telemetry/CaptureSpan";

export default class UpdateOneBaseModel<
  TBaseModel extends BaseModel,
> extends ComponentCode {
  private modelService: DatabaseService<TBaseModel> | null = null;

  public constructor(modelService: DatabaseService<TBaseModel>) {
    super();

    const BaseModelComponent: ComponentMetadata | undefined =
      BaseModelComponents.getComponents(modelService.getModel()).find(
        (i: ComponentMetadata) => {
          return (
            i.id ===
            `${Text.pascalCaseToDashes(
              modelService.getModel().tableName!,
            )}-update-one`
          );
        },
      );

    if (!BaseModelComponent) {
      throw new BadDataException(
        "Update one component for " +
          modelService.getModel().tableName +
          " not found.",
      );
    }
    this.setMetadata(BaseModelComponent);
    this.modelService = modelService;
  }

  @CaptureSpan()
  public override async run(
    args: JSONObject,
    options: RunOptions,
  ): Promise<RunReturnType> {
    const successPort: Port | undefined = this.getMetadata().outPorts.find(
      (p: Port) => {
        return p.id === "success";
      },
    );

    if (!successPort) {
      throw options.onError(new BadDataException("Success port not found"));
    }

    const errorPort: Port | undefined = this.getMetadata().outPorts.find(
      (p: Port) => {
        return p.id === "error";
      },
    );

    if (!errorPort) {
      throw options.onError(new BadDataException("Error port not found"));
    }

    try {
      if (!this.modelService) {
        throw options.onError(
          new BadDataException("modelService is undefined."),
        );
      }

      if (!args["data"]) {
        throw options.onError(new BadDataException("JSON is undefined."));
      }

      if (typeof args["data"] === "string") {
        args["data"] = JSONFunctions.parse(args["data"] as string);
      }

      if (typeof args["data"] !== "object") {
        throw options.onError(
          new BadDataException("JSON is should be of type object."),
        );
      }

      if (this.modelService.getModel().getTenantColumn()) {
        (args["data"] as JSONObject)[
          this.modelService.getModel().getTenantColumn() as string
        ] = options.projectId;
      }

      if (!args["query"]) {
        throw options.onError(new BadDataException("Query is undefined."));
      }

      if (typeof args["query"] === "string") {
        args["query"] = JSONFunctions.parse(args["query"] as string);
      }

      if (typeof args["query"] !== "object") {
        throw options.onError(
          new BadDataException("Query is should be of type object."),
        );
      }

      if (this.modelService.getModel().getTenantColumn()) {
        (args["query"] as JSONObject)[
          this.modelService.getModel().getTenantColumn() as string
        ] = options.projectId;
      }

      let query: Query<TBaseModel> = args["query"] as Query<TBaseModel>;

      if (query) {
        query = JSONFunctions.deserialize(
          args["query"] as JSONObject,
        ) as Query<TBaseModel>;
      }

      await this.modelService.updateOneBy({
        query: query || {},
        data: args["data"] as QueryDeepPartialEntity<TBaseModel>,
        props: {
          isRoot: true,
          tenantId: options.projectId,
        },
      });

      return {
        returnValues: {},
        executePort: successPort,
      };
    } catch (err: any) {
      options.log("Error running component");
      options.log(err.message ? err.message : JSON.stringify(err, null, 2));
      return {
        returnValues: {},
        executePort: errorPort,
      };
    }
  }
}
