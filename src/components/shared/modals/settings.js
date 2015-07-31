'use strict';

var React = require('react');
var Keys = require('react-keybinding');
var store = require('store');
var actions = require('../../../actions/actions');

module.exports = React.createClass({
  mixins: [Keys],

  propTypes: {
    onClose: React.PropTypes.func
  },

  keybindings: {
    'esc': function(e) {
      this.onCancel(e);
    }
  },

  onCancel: function(e) {
    this.props.onClose(e);
  },

  userLogout: function(e) {
    this.props.onClose(e);
    actions.userLogout();
  },

  setEditor: function(e) {
    var editor = e.target.getAttribute('id');
    actions.editorPreference(editor);
  },

  stopProp: function(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  },

  render: function() {
    var editor = (store.get('editor')) ? store.get('editor') : 'imagery-grid';

    return (
      /* jshint ignore:start */
      <div id='modal' className='animate modal modal-content active' onClick={this.onCancel}>
        <div className='col4 modal-body fill-purple contain' onClick={this.stopProp}>
          <button onClick={this.props.onClose} className='unround pad1 icon fr close button quiet'></button>
          <div className='pad2'>
            <h2 className='dark'>Settings</h2>
          </div>



          <div className='pad2x pad1y fill-light round-bottom text-right'>
            <button onClick={this.userLogout} className='rcon logout button quiet animate'>Logout</button>
          </div>
        </div>
      </div>
      /* jshint ignore:end */
    );
  }
});
