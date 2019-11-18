import { Component } from 'react';
import PropTypes from 'prop-types';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import * as CB from 'cloudboost';
import RemovedFromSubProjectModal from '../modals/RemovedFromSubProject';
import RemovedFromProjectModal from '../modals/RemovedFromProject';
import { User } from '../../config';
import uuid from 'uuid';
import { openModal, closeModal } from '../../actions/modal';
import {
    incidentresolvedbysocket, incidentacknowledgedbysocket, deletemonitorbysocket,
    updatemonitorbysocket, createmonitorbysocket, incidentcreatedbysocket,
    updateresponsetime, updatemonitorlogbysocket, addnotifications, teamMemberRoleUpdate, teamMemberCreate, teamMemberDelete
} from '../../actions/socket';
import DataPathHoC from '../DataPathHoC';

class SocketApp extends Component {
    shouldComponentUpdate(nextProps) {
        if (this.props.project !== nextProps.project) {
            if (this.props.project) {
                CB.CloudNotification.off(`incidentResolved-${this.props.project._id}`);
                CB.CloudNotification.off(`incidentAcknowledged-${this.props.project._id}`);
                CB.CloudNotification.off(`createMonitor-${this.props.project._id}`);
                CB.CloudNotification.off(`updateMonitor-${this.props.project._id}`);
                CB.CloudNotification.off(`deleteMonitor-${this.props.project._id}`);
                CB.CloudNotification.off(`incidentCreated-${this.props.project._id}`);
                CB.CloudNotification.off(`updateResponseTime-${this.props.project._id}`);
                CB.CloudNotification.off(`updateMonitorLog-${this.props.project._id}`);
                CB.CloudNotification.off(`NewNotification-${this.props.project._id}`);
                CB.CloudNotification.off(`TeamMemberRoleUpdate-${this.props.project._id}`);
                CB.CloudNotification.off(`TeamMemberCreate-${this.props.project._id}`);
                CB.CloudNotification.off(`TeamMemberDelete-${this.props.project._id}`);
            }
            return true;
        }
        else {
            return false;
        }
    }
    render() {
        var thisObj = this;
        const loggedInUser = User.getUserId();
        if (this.props.project) {
            CB.CloudNotification.on(`incidentResolved-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (!data.resolvedBy) {
                        thisObj.props.incidentresolvedbysocket(data);
                    } else if (data.resolvedBy._id !== User.getUserId()) {
                        thisObj.props.incidentresolvedbysocket(data);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data && data.createdById && data.createdById._id !== User.getUserId()) {
                        if (!data.resolvedBy) {
                            if (isUserInSubProject) thisObj.props.incidentresolvedbysocket(data);
                        } else if (data.resolvedBy._id !== User.getUserId()) {
                            if (isUserInSubProject) thisObj.props.incidentresolvedbysocket(data);
                        }
                    }
                }
            });
            CB.CloudNotification.on(`incidentAcknowledged-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (!data.acknowledgedBy) {
                        thisObj.props.incidentacknowledgedbysocket(data);
                    } else if (data.acknowledgedBy && data.acknowledgedBy._id !== User.getUserId()) {
                        thisObj.props.incidentacknowledgedbysocket(data);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data && data.createdById && data.createdById._id !== User.getUserId()) {
                        if (!data.acknowledgedBy) {
                            if (isUserInSubProject) thisObj.props.incidentacknowledgedbysocket(data);
                        } else if (data.acknowledgedBy && data.acknowledgedBy._id !== User.getUserId()) {
                            if (isUserInSubProject) thisObj.props.incidentacknowledgedbysocket(data);
                        }
                    }
                }
            });
            CB.CloudNotification.on(`createMonitor-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (data.createdById !== User.getUserId()) {
                        thisObj.props.createmonitorbysocket(data);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data.createdById !== User.getUserId()) {
                        if (isUserInSubProject) thisObj.props.createmonitorbysocket(data);
                    }
                }
            });
            CB.CloudNotification.on(`updateMonitor-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    thisObj.props.updatemonitorbysocket(data);
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (isUserInSubProject) thisObj.props.updatemonitorbysocket(data);
                }
            });
            CB.CloudNotification.on(`deleteMonitor-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    thisObj.props.deletemonitorbysocket(data);
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (isUserInSubProject) thisObj.props.deletemonitorbysocket(data);
                }
            });
            CB.CloudNotification.on(`incidentCreated-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (data && data.createdById && data.createdById._id !== User.getUserId()) {
                        thisObj.props.incidentcreatedbysocket(data);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data && data.createdById && data.createdById._id !== User.getUserId()) {
                        if (isUserInSubProject) thisObj.props.incidentcreatedbysocket(data);
                    }
                }
            });
            CB.CloudNotification.on(`updateResponseTime-${this.props.project._id}`, function (data) {
                thisObj.props.updateresponsetime(data);
            });
            CB.CloudNotification.on(`updateMonitorLog-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    thisObj.props.updatemonitorlogbysocket(data);
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (isUserInSubProject) thisObj.props.updatemonitorlogbysocket(data);
                }
            });
            CB.CloudNotification.on(`NewNotification-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (data.createdBy && data.createdBy !== User.getUserId()) {
                        thisObj.props.addnotifications(data);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data.createdBy && data.createdBy !== User.getUserId()) {
                        if (isUserInSubProject) thisObj.props.addnotifications(data);
                    }
                }
            });
            CB.CloudNotification.on(`TeamMemberRoleUpdate-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    thisObj.props.teamMemberRoleUpdate(data.response);
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (isUserInSubProject) thisObj.props.teamMemberRoleUpdate(data.response);
                }
            });
            CB.CloudNotification.on(`TeamMemberCreate-${this.props.project._id}`, function (data) {
                const isUserInProject = thisObj.props.project ? thisObj.props.project.users.some(user => user.userId === loggedInUser) : false;
                if (isUserInProject) {
                    if (data.userId !== User.getUserId()) {
                        thisObj.props.teamMemberCreate(data.response);
                    }
                } else {
                    const subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId);
                    const isUserInSubProject = subProject ? subProject.users.some(user => user.userId === loggedInUser) : false;
                    if (data.userId !== User.getUserId()) {
                        if (isUserInSubProject) thisObj.props.teamMemberCreate(data.response);
                    }
                }
            });
            CB.CloudNotification.on(`TeamMemberDelete-${this.props.project._id}`, function (data) {
                if (data.projectId === thisObj.props.project._id) {
                    var projectUser = data.teamMembers.find(member => member.userId === User.getUserId());
                    if (!projectUser) {
                        thisObj.props.openModal({
                            id: uuid.v4(),
                            onClose: () => '',
                            onConfirm: () => new Promise(resolve => resolve()),
                            content: RemovedFromProjectModal
                        })
                    }
                } else {
                    var subProjectUser = data.teamMembers.find(member => member.userId === User.getUserId());
                    var subProject = thisObj.props.subProjects.find(subProject => subProject._id === data.projectId)
                    var subProjectName = subProject ? subProject.name : '';
                    if (!subProjectUser) {
                        thisObj.props.openModal({
                            id: uuid.v4(),
                            onClose: () => '',
                            onConfirm: () => new Promise(resolve => resolve()),
                            content: DataPathHoC(RemovedFromSubProjectModal, { name: subProjectName })
                        })
                    }
                }
                thisObj.props.teamMemberDelete(data.response);
            });
        }
        return null;
    }
}

SocketApp.displayName = 'SocketApp'

SocketApp.propTypes = {
    project: PropTypes.oneOfType([
        PropTypes.object,
        PropTypes.oneOf([null, undefined])
    ]),
    _id: PropTypes.oneOfType([
        PropTypes.string,
        PropTypes.oneOf([null, undefined])
    ]),
}

let mapStateToProps = state => ({
    project: state.project.currentProject,
    subProjects: state.subProject.subProjects.subProjects
})

let mapDispatchToProps = dispatch => (
    bindActionCreators({
        incidentresolvedbysocket,
        incidentacknowledgedbysocket,
        deletemonitorbysocket,
        updatemonitorbysocket,
        createmonitorbysocket,
        incidentcreatedbysocket,
        updateresponsetime,
        updatemonitorlogbysocket,
        addnotifications,
        teamMemberRoleUpdate,
        teamMemberCreate,
        teamMemberDelete,
        openModal,
        closeModal
    }, dispatch)
)

export default connect(mapStateToProps, mapDispatchToProps)(SocketApp);
