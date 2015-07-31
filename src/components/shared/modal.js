'use strict';

var React = require('react');
var Reflux = require('reflux');
var actions = require('../../actions/actions');

// Modals
var Upload = require('./modals/upload');
var Settings = require('./modals/settings');
var SaveToOSM = require('./modals/saveToOSM');

module.exports = React.createClass({
  mixins: [
    Reflux.listenTo(actions.openSettings, 'openSettings'),
    Reflux.listenTo(actions.openUpload, 'openUpload'),
    Reflux.listenTo(actions.openSaveToOSM, 'openSaveToOSM')
  ],

  getInitialState: function() {
    return {
      settingsModal: null,
      UploadModal: null,
      saveToOSMModal: null,
    };
  },

  openSettings: function() { this.setState({ settingsModal: true }); },
  openUpload: function() { this.setState({ uploadModal: true }); },
  openSaveToOSM: function(props) {
    props.saveToOSMModal = true;
    this.setState(props);
  },

  closeModal: function() {
    this.setState({
      settingsModal: null,
      uploadModal: null,
      saveToOSMModal: null
    });
  },

  render: function () {
    return (
      /* jshint ignore:start */
      <div>
        {(this.state.settingsModal) ?
          (<Settings onClose={this.closeModal}/>) : ''}

        {(this.state.uploadModal) ?
          (<Upload onClose={this.closeModal}/>) : ''}

        {(this.state.saveToOSMModal) ?
          (<SaveToOSM onClose={this.closeModal} {...this.state}/>) : ''}
      </div>
      /* jshint ignore:end */
    );
  }
});
