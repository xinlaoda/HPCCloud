import ButtonBar        from '../../../../../../panels/ButtonBar';
import FileListing      from '../../../../../../panels/FileListing';
import JobMonitor       from '../../../../../../panels/JobMonitor';

import merge            from 'mout/src/object/merge';
import React            from 'react';

import { connect }      from 'react-redux';
import { dispatch }     from '../../../../../../redux';
import * as Actions     from '../../../../../../redux/actions/taskflows';
import * as Router      from '../../../../../../redux/actions/router';

const ACTIONS = {
  terminate: { name: 'terminateTaskflow', label: 'Terminate', icon: '' },
  visualize: { name: 'visualizeTaskflow', label: 'Visualize', icon: '' },
  rerun: { name: 'deleteTaskflow', label: 'New visualization', icon: '' },
};

function getActions(actionsList, disabled) {
  return actionsList.map((action) => Object.assign({ disabled }, ACTIONS[action]));
}

const visualizationView = React.createClass({
  displayName: 'pvw/view-visualization',

  propTypes: {
    location: React.PropTypes.object,
    project: React.PropTypes.object,
    simulation: React.PropTypes.object,
    step: React.PropTypes.string,
    taskFlowName: React.PropTypes.string,
    primaryJob: React.PropTypes.string,
    view: React.PropTypes.string,

    onTerminateTaskflow: React.PropTypes.func,
    onDeleteTaskflow: React.PropTypes.func,
    onVisualizeTaskflow: React.PropTypes.func,

    taskflowId: React.PropTypes.string,
    taskflow: React.PropTypes.object,
    error: React.PropTypes.string,
  },

  contextTypes: {
    router: React.PropTypes.object,
  },

  onAction(action) {
    this[action]();
  },

  visualizeTaskflow() {
    const location = {
      pathname: `View/Simulation/${this.props.simulation._id}/Visualization`,
      query: merge(this.props.location.query, { view: 'default' }),
      state: this.props.location.state,
    };
    this.props.onVisualizeTaskflow(location);
  },

  terminateTaskflow() {
    this.props.onTerminateTaskflow(this.props.taskflowId);
  },

  deleteTaskflow() {
    const simulationStep = {
      id: this.props.simulation._id,
      step: 'Visualization',
      data: {
        view: 'default',
        metadata: {},
      },
    };
    const location = {
      pathname: this.props.location.pathname,
      query: { view: 'default' },
      state: this.props.location.state,
    };

    this.props.onDeleteTaskflow(this.props.taskflowId, simulationStep, location);
  },

  render() {
    if (!this.props.taskflow || !this.props.taskflow.flow) {
      return null;
    }

    const { taskflow, taskflowId, error, simulation } = this.props;
    const actions = [].concat(taskflow.actions);
    const jobs = Object.keys(taskflow.jobMapById).map(id => taskflow.jobMapById[id]);

    // Extract meaningful information from props
    if (jobs.some(job => job.name === this.props.primaryJob && job.status === 'running')) {
      actions.push('visualize');
    }

    return (
      <div>
          <JobMonitor taskflowId={ taskflowId } />
          <FileListing title="Input Files" folderId={simulation.metadata.inputFolder._id} />
          <FileListing title="Output Files" folderId={simulation.metadata.outputFolder._id} />
          <section>
              <ButtonBar
                onAction={ this.onAction }
                actions={ getActions(actions, false)}
                error={error}
              />
          </section>
      </div>);
  },
});

export default connect(
  (state, props) => {
    var taskflowId = null;
    const activeProject = state.projects.active;
    const activeSimulation = activeProject ? state.projects.simulations[activeProject].active : null;

    if (activeSimulation) {
      const simulation = state.simulations.mapById[activeSimulation];
      taskflowId = simulation.steps.Visualization.metadata.taskflowId;
    }

    return {
      taskflowId,
      taskflow: taskflowId ? state.taskflows.mapById[taskflowId] : null,
      error: null,
    };
  },
  () => ({
    onVisualizeTaskflow: (location) => dispatch(Router.push(location)),
    onDeleteTaskflow: (id, simulationStep, location) => dispatch(Actions.deleteTaskflow(id, simulationStep, location)),
    onTerminateTaskflow: (id) => dispatch(Actions.terminateTaskflow(id)),
  })
)(visualizationView);
