'use strict';

var React = require('react');
var Keys = require('react-keybinding');
var store = require('store');
var Reflux = require('reflux');
var UserStore = require('../../../stores/user_store');
var MapStore = require('../../../stores/map_store');
var actions = require('../../../actions/actions');
var config = require('../../../config');

module.exports = React.createClass({
  mixins: [Keys,
    Reflux.connect(UserStore, 'user'),
    Reflux.connect(MapStore, 'map')
  ],

  propTypes: {
    onClose: React.PropTypes.func
  },

  getInitialState: function() {
    return {
      saving: false,
      comment: this.props.comment
    };
  },

  keybindings: {
    'esc': function(e) {
      this.onCancel(e);
    }
  },

  onCancel: function(e) {
    this.props.onClose(e);
  },


  onSave: function(e) {
    this.stopProp(e);
    this.setState({saving: true});
    var _this = this;
    //get the way object from the store
    var way = this.state.map.iDEntity[0];
    var comment = this.state.comment;

    UserStore.putChangeset(way, comment, this.props.imageryUsed, function(err) {
      _this.setState({saving: false});
      if (err) {
        actions.errorDialog(err);
      } else {
        //mark task as fixed
        actions.taskSavedInOSM();
      }
      _this.props.onClose(e);
    });



  },

  stopProp: function(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  },

  componentDidMount: function() {
    //if the user isn't logged in have them do that first
    if (!this.state.user || !this.state.user.auth) {
      actions.userLogin();
    }
  },


  render: function() {
    if (this.state.saving) {
      return (
        <div id='modal' className='animate modal modal-content active' onClick={this.onCancel}>
          <div className='col4 modal-body fill-purple contain' onClick={this.stopProp}>
            <div className='pad2'>
              <h2 className='dark spinner'>Saving Change to OpenStreetMap</h2>
            </div>
          </div>
        </div>
      );
    }
    return (
      /* jshint ignore:start */
      <div id='modal' className='animate modal modal-content active' onClick={this.onCancel}>
        <div className='col4 modal-body fill-purple contain' onClick={this.stopProp}>
          <button onClick={this.props.onClose} className='unround pad1 icon fr close button quiet'></button>
          <div className='pad2'>
          <h2 className='dark'>Confirm Change to OpenStreetMap</h2>
          </div>
          <div className='pad2'>
          <p className='dark'>{this.props.message}</p>
          </div>

          <div className='dark' >
          <fieldset className='pad2x'>
          <label>Comment</label>
          <input className='col12 block clean' ref='taskname' type='textarea' name='name' placeholder='Add a Comment' value={this.state.comment} />
          </fieldset>

          <div className='pad2x pad1y fill-light round-bottom col12 clearfix'>
            <button onClick={this.onSave} className='col6 margin3 button'>Save to OSM</button>
          </div>
          </div>

        </div>
      </div>
      /* jshint ignore:end */
    );
  }
});
