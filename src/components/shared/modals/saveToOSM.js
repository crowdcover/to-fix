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


  onSave: function(e) {
    alert("Simulating Submission to OSM");

    //mark task as fixed
    //actions.taskDone(this.context.router.getCurrentParams().task);

    this.props.onClose(e);
  },

  stopProp: function(e) {
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
  },

  render: function() {


    return (
      /* jshint ignore:start */
      <div id='modal' className='animate modal modal-content active' onClick={this.onCancel}>
        <div className='col4 modal-body fill-purple contain' onClick={this.stopProp}>
          <button onClick={this.props.onClose} className='unround pad1 icon fr close button quiet'></button>
          <div className='pad2'>
            <h2 className='dark'>Confirm Change to OpenStreetMap</h2>
          </div>

          <form className='dark' onSubmit={this.onSave}>
            <fieldset className='pad2x'>
              <label>Comment</label>
              <input className='col12 block clean' ref='taskname' type='textarea' name='name' placeholder='Add a Comment' defaultValue='#logging-roads added logging road start date'/>
            </fieldset>


            <div className='pad2x pad1y fill-light round-bottom col12 clearfix'>
              <input className='col6 margin3 button' type='submit' value='Save to OSM' />
            </div>
          </form>


        </div>
      </div>
      /* jshint ignore:end */
    );
  }
});
