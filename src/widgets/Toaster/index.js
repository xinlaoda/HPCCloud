import React from 'react';

import style from 'HPCCloudStyle/Toaster.mcss';
import states from 'HPCCloudStyle/States.mcss';

import { connect }  from 'react-redux';
import { dispatch } from '../../redux';
import * as Actions from '../../redux/actions/network';

const ToastComponent = React.createClass({
  displayName: 'Toaster',

  propTypes: {
    errorId: React.PropTypes.string,
    message: React.PropTypes.string,
    invalidateError: React.PropTypes.func,
  },

  getDefaultProps() {
    return {
      errorId: null,
      message: '',
    };
  },

  close() {
    this.props.invalidateError(this.props.errorId);
  },

  render() {
    return (<div className={[style.ToastContainer, (this.props.errorId ? '' : states.isHidden)].join(' ')}>
        { this.props.message }
        <button className={style.ToastClearButton} onClick={ this.close }>
          <span className={style.CloseIcon}></span>
        </button>
      </div>);
  },
});


export default connect(
  state => {
    const localState = state.network;
    let id = null;
    let message = '';
    if (localState.activeErrors.length) {
      id = localState.activeErrors[0];
      message = localState.error[id].resp.data.message;
    }

    return {
      errorId: id,
      message,
    };
  },
  () => ({
    invalidateError: (id) => dispatch(Actions.invalidateError(id)),
  })
)(ToastComponent);
