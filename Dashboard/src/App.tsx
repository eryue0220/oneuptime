import ToastLayout from "Common/UI/Components/Toast/ToastInit";
import MasterPage from "./Components/MasterPage/MasterPage";
import UseTimezoneInitElement from "./Components/UserTimezone/UserTimezoneInit";
import ActiveIncidents from "./Pages/Global/NewIncidents";
import ProjectInvitations from "./Pages/Global/ProjectInvitations";
// User Profile
import UserProfileOverview from "./Pages/Global/UserProfile/Index";
import UserProfilePassword from "./Pages/Global/UserProfile/Password";
import UserProfilePicture from "./Pages/Global/UserProfile/Picture";
// Pages
import Home from "./Pages/Home/Home";
import NotOperationalMonitors from "./Pages/Home/NotOperationalMonitors";
import HomeActiveAlerts from "./Pages/Home/ActiveAlerts";
import OngoingScheduledEvents from "./Pages/Home/OngoingScheduledMaintenance";
import Logout from "./Pages/Logout/Logout";
import Sso from "./Pages/Onboarding/SSO";
import Welcome from "./Pages/Onboarding/Welcome";
import PageComponentProps from "./Pages/PageComponentProps";
import PageNotFound from "./Pages/PageNotFound/PageNotFound";
import SettingsDangerZone from "./Pages/Settings/DangerZone";
import AICopilotRoutes from "./Routes/AICopilotRoutes";
import IncidentsRoutes from "./Routes/IncidentsRoutes";
//Routes
import InitRoutes from "./Routes/InitRoutes";
import MonitorGroupRoutes from "./Routes/MonitorGroupRoutes";
import DashboardRoutes from "./Routes/DashboardRoutes";
import MonitorsRoutes from "./Routes/MonitorsRoutes";
import OnCallDutyRoutes from "./Routes/OnCallDutyRoutes";
import ScheduledMaintenanceEventsRoutes from "./Routes/ScheduleMaintenaceEventsRoutes";
import ServiceCatalogRoutes from "./Routes/ServiceCatalogRoutes";
import SettingsRoutes from "./Routes/SettingsRoutes";
import StatusPagesRoutes from "./Routes/StatusPagesRoutes";
import TelemetryRoutes from "./Routes/TelemetryRoutes";
import UserSettingsRoutes from "./Routes/UserSettingsRoutes";
import WorkflowRoutes from "./Routes/WorkflowRoutes";
import EventName from "./Utils/EventName";
import PageMap from "./Utils/PageMap";
import RouteMap from "./Utils/RouteMap";
import Route from "Common/Types/API/Route";
import URL from "Common/Types/API/URL";
import { PromiseVoidFunction } from "Common/Types/FunctionTypes";
import { APP_API_URL, BILLING_ENABLED } from "Common/UI/Config";
import API from "Common/UI/Utils/API/API";
import GlobalEvents from "Common/UI/Utils/GlobalEvents";
import ModelAPI, { ListResult } from "Common/UI/Utils/ModelAPI/ModelAPI";
import Navigation from "Common/UI/Utils/Navigation";
import ProjectUtil from "Common/UI/Utils/Project";
import BillingPaymentMethod from "Common/Models/DatabaseModels/BillingPaymentMethod";
import Project from "Common/Models/DatabaseModels/Project";
import React, { useEffect, useState } from "react";
import {
  Route as PageRoute,
  Routes,
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";
import useAsyncEffect from "use-async-effect";
import UseTwoFactorAuth from "./Pages/Global/UserProfile/TwoFactorAuth";
import AlertsRoutes from "./Routes/AlertRoutes";
import DashboardNavigation from "./Utils/Navigation";
import ObjectID from "Common/Types/ObjectID";

const App: () => JSX.Element = () => {
  Navigation.setNavigateHook(useNavigate());
  Navigation.setLocation(useLocation());
  Navigation.setParams(useParams());

  const [isLoading, setLoading] = useState<boolean>(true);
  const [showProjectModal, setShowProjectModal] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [projects, setProjects] = useState<Array<Project>>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [ispaymentMethodsCountLoading, setPaymentMethodsCountLoading] =
    useState<boolean>(false);
  const [paymentMethodsCount, setPaymentMethodsCount] = useState<
    number | undefined
  >(undefined);

  const [hasPaymentMethod, setHasPaymentMethod] = useState<boolean>(false);

  const checkIfOnTheSameProjectWhenTabBecomesActive: () => void = () => {
    if (document.visibilityState === "visible") {
      // check if ProjectUtil.getCurrentProject() is the same as selectedProject
      if (ProjectUtil.getCurrentProject()) {
        const projectIdFromUrl: ObjectID | null =
          DashboardNavigation.getProjectId();
        if (
          ProjectUtil.getCurrentProjectId()?.toString() !==
          projectIdFromUrl?.toString()
        ) {
          return Navigation.reload();
        }
      }
    }
  };

  useEffect(() => {
    document.addEventListener(
      "visibilitychange",
      checkIfOnTheSameProjectWhenTabBecomesActive,
    );

    return () => {
      document.removeEventListener(
        "visibilitychange",
        checkIfOnTheSameProjectWhenTabBecomesActive,
      );
    };
  }, []);

  useAsyncEffect(async () => {
    try {
      if (selectedProject && selectedProject._id) {
        ProjectUtil.setCurrentProject(selectedProject);
      }

      if (selectedProject && selectedProject._id && BILLING_ENABLED) {
        setPaymentMethodsCountLoading(true);

        const paymentMethodsCount: number = await ModelAPI.count({
          modelType: BillingPaymentMethod,
          query: { projectId: selectedProject._id },
        });

        setPaymentMethodsCount(paymentMethodsCount);

        if (paymentMethodsCount && paymentMethodsCount > 0) {
          setHasPaymentMethod(true);
        } else {
          setHasPaymentMethod(false);
        }
      }

      if (!BILLING_ENABLED) {
        setHasPaymentMethod(true);
      }

      setPaymentMethodsCountLoading(false);
    } catch (e) {
      setError(API.getFriendlyMessage(e));
      setPaymentMethodsCountLoading(false);
    }
  }, [selectedProject?._id]);

  const onProjectSelected: (project: Project) => void = (
    project: Project,
  ): void => {
    setSelectedProject(project);

    if (
      projects.filter((i: Project) => {
        return i && i._id === project._id;
      }).length === 0
    ) {
      setProjects([...projects, project]);
    }

    const currentRoute: Route = Navigation.getCurrentRoute();

    if (!currentRoute.toString().includes(project._id!)) {
      Navigation.navigate(new Route("/dashboard/" + project._id), {
        forceNavigate: true,
      });
    }
  };

  useEffect(() => {
    GlobalEvents.addEventListener(
      EventName.PROJECT_INVITATIONS_REFRESH,
      fetchProjects,
    );

    return () => {
      // on unmount.
      GlobalEvents.removeEventListener(
        EventName.PROJECT_INVITATIONS_REFRESH,
        fetchProjects,
      );
    };
  }, []);

  const fetchProjects: PromiseVoidFunction = async (): Promise<void> => {
    setLoading(true);

    // get list of projects.
    try {
      const result: ListResult<Project> = await ModelAPI.getList<Project>({
        modelType: Project,
        query: {},
        limit: 50,
        skip: 0,
        select: {},
        sort: {},

        requestOptions: {
          isMultiTenantRequest: true,
          overrideRequestUrl: URL.fromString(APP_API_URL.toString()).addRoute(
            "/project/list-user-projects",
          ),
        },
      });
      setProjects(result.data);
    } catch (err) {
      setError(API.getFriendlyMessage(err));
    }

    setLoading(false);
  };

  useAsyncEffect(async () => {
    await fetchProjects();
  }, []);

  const commonPageProps: PageComponentProps = {
    currentProject: selectedProject,
    hasPaymentMethod: hasPaymentMethod,
    pageRoute: Navigation.getCurrentRoute(), // this will be overwritten by different pages
  };

  return (
    <MasterPage
      isLoading={isLoading || ispaymentMethodsCountLoading}
      projects={projects}
      error={error}
      paymentMethodsCount={paymentMethodsCount}
      onProjectSelected={onProjectSelected}
      showProjectModal={showProjectModal}
      onProjectModalClose={() => {
        setShowProjectModal(false);
      }}
      selectedProject={selectedProject}
      hideNavBarOn={[RouteMap[PageMap.PROJECT_SSO]!]}
    >
      <UseTimezoneInitElement />
      <ToastLayout />

      <Routes>
        <PageRoute
          path="/*"
          element={
            <InitRoutes
              {...commonPageProps}
              projects={projects}
              isLoading={isLoading}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.WELCOME]?.toString() || ""}
          element={
            <Welcome
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.WELCOME] as Route}
              onClickShowProjectModal={() => {
                setShowProjectModal(true);
              }}
            />
          }
        />

        {/* Home */}

        <PageRoute
          path={RouteMap[PageMap.HOME]?.toString() || ""}
          element={
            <Home
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.HOME] as Route}
              projects={projects}
              isLoadingProjects={isLoading}
            />
          }
        />
        <PageRoute
          path={RouteMap[PageMap.PROJECT_SSO]?.toString() || ""}
          element={
            <Sso
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.PROJECT_SSO] as Route}
            />
          }
        />

        <PageRoute
          path={
            RouteMap[PageMap.HOME_NOT_OPERATIONAL_MONITORS]?.toString() || ""
          }
          element={
            <NotOperationalMonitors
              {...commonPageProps}
              pageRoute={
                RouteMap[PageMap.HOME_NOT_OPERATIONAL_MONITORS] as Route
              }
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.HOME_ACTIVE_ALERTS]?.toString() || ""}
          element={
            <HomeActiveAlerts
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.HOME_ACTIVE_ALERTS] as Route}
            />
          }
        />

        <PageRoute
          path={
            RouteMap[
              PageMap.HOME_ONGOING_SCHEDULED_MAINTENANCE_EVENTS
            ]?.toString() ||
            "" ||
            ""
          }
          element={
            <OngoingScheduledEvents
              {...commonPageProps}
              pageRoute={
                RouteMap[
                  PageMap.HOME_ONGOING_SCHEDULED_MAINTENANCE_EVENTS
                ] as Route
              }
            />
          }
        />
        {/* Telemetry */}
        <PageRoute
          path={RouteMap[PageMap.TELEMETRY_ROOT]?.toString() || ""}
          element={<TelemetryRoutes {...commonPageProps} />}
        />

        {/* Monitors */}
        <PageRoute
          path={RouteMap[PageMap.MONITORS_ROOT]?.toString() || ""}
          element={<MonitorsRoutes {...commonPageProps} />}
        />

        {/* Workflows  */}
        <PageRoute
          path={RouteMap[PageMap.WORKFLOWS_ROOT]?.toString() || ""}
          element={<WorkflowRoutes {...commonPageProps} />}
        />

        {/* Status Pages */}
        <PageRoute
          path={RouteMap[PageMap.STATUS_PAGES_ROOT]?.toString() || ""}
          element={<StatusPagesRoutes {...commonPageProps} />}
        />

        {/* Dashboards */}
        <PageRoute
          path={RouteMap[PageMap.DASHBOARDS_ROOT]?.toString() || ""}
          element={<DashboardRoutes {...commonPageProps} />}
        />

        {/* Service Catalog */}
        <PageRoute
          path={RouteMap[PageMap.SERVICE_CATALOG_ROOT]?.toString() || ""}
          element={<ServiceCatalogRoutes {...commonPageProps} />}
        />

        {/** Reliability Copilot */}
        <PageRoute
          path={RouteMap[PageMap.AI_COPILOT_ROOT]?.toString() || ""}
          element={<AICopilotRoutes {...commonPageProps} />}
        />

        {/* Incidents */}
        <PageRoute
          path={RouteMap[PageMap.INCIDENTS_ROOT]?.toString() || ""}
          element={<IncidentsRoutes {...commonPageProps} />}
        />

        {/* Incidents */}
        <PageRoute
          path={RouteMap[PageMap.ALERTS_ROOT]?.toString() || ""}
          element={<AlertsRoutes {...commonPageProps} />}
        />

        {/* Scheduled Events */}

        <PageRoute
          path={
            RouteMap[PageMap.SCHEDULED_MAINTENANCE_EVENTS_ROOT]?.toString() ||
            ""
          }
          element={<ScheduledMaintenanceEventsRoutes {...commonPageProps} />}
        />

        {/* Settings Routes */}

        <PageRoute
          path={RouteMap[PageMap.SETTINGS_ROOT]?.toString() || ""}
          element={<SettingsRoutes {...commonPageProps} />}
        />

        {/* As this one has dependencies with the selected project and etc, we need to put it here for now. */}
        <PageRoute
          path={RouteMap[PageMap.SETTINGS_DANGERZONE]?.toString() || ""}
          element={
            <SettingsDangerZone
              onProjectDeleted={async () => {
                setSelectedProject(null);
                setProjects([]);
                await fetchProjects();
                Navigation.navigate(RouteMap[PageMap.INIT]!);
              }}
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.SETTINGS_DANGERZONE] as Route}
            />
          }
        />

        {/* On-Call Duty */}

        <PageRoute
          path={RouteMap[PageMap.ON_CALL_DUTY_ROOT]?.toString() || ""}
          element={<OnCallDutyRoutes {...commonPageProps} />}
        />

        {/* Misc Routes */}
        <PageRoute
          path={RouteMap[PageMap.LOGOUT]?.toString() || ""}
          element={
            <Logout
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.LOGOUT] as Route}
            />
          }
        />

        {/* Global Routes */}
        <PageRoute
          path={RouteMap[PageMap.USER_PROFILE_PICTURE]?.toString() || ""}
          element={
            <UserProfilePicture
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.USER_PROFILE_PICTURE] as Route}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.USER_PROFILE_OVERVIEW]?.toString() || ""}
          element={
            <UserProfileOverview
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.USER_PROFILE_OVERVIEW] as Route}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.USER_PROFILE_PASSWORD]?.toString() || ""}
          element={
            <UserProfilePassword
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.USER_PROFILE_PASSWORD] as Route}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.USER_TWO_FACTOR_AUTH]?.toString() || ""}
          element={
            <UseTwoFactorAuth
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.USER_TWO_FACTOR_AUTH] as Route}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.PROJECT_INVITATIONS]?.toString() || ""}
          element={
            <ProjectInvitations
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.PROJECT_INVITATIONS] as Route}
            />
          }
        />

        <PageRoute
          path={RouteMap[PageMap.NEW_INCIDENTS]?.toString() || ""}
          element={
            <ActiveIncidents
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.NEW_INCIDENTS] as Route}
            />
          }
        />

        {/* User Settings */}

        <PageRoute
          path={RouteMap[PageMap.USER_SETTINGS_ROOT]?.toString() || ""}
          element={<UserSettingsRoutes {...commonPageProps} />}
        />

        {/** Monitor Groups */}

        <PageRoute
          path={RouteMap[PageMap.MONITOR_GROUPS_ROOT]?.toString() || ""}
          element={<MonitorGroupRoutes {...commonPageProps} />}
        />

        {/* 👇️ only match this when no other routes match */}
        <PageRoute
          path="*"
          element={
            <PageNotFound
              {...commonPageProps}
              pageRoute={RouteMap[PageMap.LOGOUT] as Route}
            />
          }
        />
      </Routes>
    </MasterPage>
  );
};

export default App;
