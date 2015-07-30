'use strict';

var React = require('react');
var Reflux = require('reflux');
var actions = require('../../actions/actions');
var UserStore = require('../../stores/user_store');
var taskObj = require('../../mixins/taskobj');

module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  mixins: [
    Reflux.connect(UserStore, 'user'),
    Reflux.listenTo(actions.geolocated, 'geolocate')
  ],


  edit: function() {
    actions.taskEdit(this.context.router.getCurrentParams().task);
  },

  noterror: function() {
      actions.taskNotError(this.context.router.getCurrentParams().task);
  },

  skip: function() {
    var task = this.context.router.getCurrentParams().task;
    actions.taskData(task);
    actions.taskSkip(task);
  },

  fixed: function() {
    actions.taskDone(this.context.router.getCurrentParams().task);
  },

  geolocate: function(placename) {
    this.setState({
      placename: placename
    });
  },

  render: function() {
    var taskTitle = taskObj(this.context.router.getCurrentParams().task).title;
    var taskActions = (
      /* jshint ignore:start */
      <nav className='tabs col12 clearfix'>
        <a onClick={this.skip} className='col12 animate icon refresh'>Preview another task</a>
      </nav>
      /* jshint ignore:end */
    );

    if (this.state.user && this.state.user.auth) {
      taskActions = (
        /* jshint ignore:start */
        <nav className='tabs col12 clearfix mobile-cols'>
          <button onClick={this.skip} className='col3 button animate'>Skip</button>
          <button onClick={this.skip} className='col9 button animate'>Too Difficult / Can't See</button>
        </nav>
        /* jshint ignore:end */
      );
    }

    return (
      /* jshint ignore:start */
      <div className='editbar pin-bottomleft col12 z10000'>

        <div className='round col6 margin3'>
          {taskActions}
          <div className='fill-lighten3 round-bottom col12 pad2x pad1y center strong inline truncate'>
            {taskTitle} {this.state.placename ? <span className='quiet icon marker'>{this.state.placename}</span> : ''}
          </div>
          <div className='fill-lighten3 round-bottom col12 pad2x pad1y center strong inline truncate'>
            <p>Scroll Down for Additional Years</p>
          </div>
        </div>

      </div>
      /* jshint ignore:end */
    );
  }
});
