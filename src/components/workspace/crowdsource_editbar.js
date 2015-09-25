'use strict';

var React = require('react');
var Reflux = require('reflux');
var actions = require('../../actions/actions');
var UserStore = require('../../stores/user_store');
var MapStore = require('../../stores/map_store');
var taskObj = require('../../mixins/taskobj');

module.exports = React.createClass({
  contextTypes: {
    router: React.PropTypes.func
  },

  mixins: [
    Reflux.connect(UserStore, 'user'),
    Reflux.connect(MapStore, 'map'),
    Reflux.listenTo(actions.geolocated, 'geolocate')
  ],
  
  getInitialState() {
    return {
      roadButtonText: 'Hide Roads',
      showRoads: true
    }
  },


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


  geolocate: function(placename) {
    this.setState({
      placename: placename
    });
  },
  toggleRoads: function(e){
    if(this.state.showRoads){
       this.setState({
      showRoads: false,
      roadButtonText: 'Show Roads'
    });
     actions.mapRoadToggle(false);
    }else{
       this.setState({
      showRoads: true,
      roadButtonText: 'Hide Roads'   
    });
    actions.mapRoadToggle(true);
    } 
    
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
          <button onClick={this.skip} className='col9 button animate'>Too Difficult / Road is Not Visible in any Year</button>
        </nav>
        /* jshint ignore:end */
      );
    }

    return (
      /* jshint ignore:start */
      <div className='editbar pin-bottomleft margin2 col12 z10000'>

        <div className='round col9'>
          {taskActions}
          <div className='fill-lighten3 round-bottom col12 pad2x pad1y center strong inline truncate'>
            Task: {taskTitle} {this.state.placename ? <span className='quiet icon marker'>{this.state.placename}</span> : ''}
          </div>
          <div className='fill-lighten3 round-bottom col12 pad2x pad1y center strong inline truncate'>
            <h3>Instructions: Select the earliest year where the road is visible. This tells us when the road was created.</h3>
            <p>Scroll down for additional years.</p>
          </div>
        </div>
        <button onClick={this.toggleRoads} className=' z1000  pin-bottomleft button round animate pad1y pad2x strong'>{this.state.roadButtonText}</button>
      </div>
      /* jshint ignore:end */
    );
  }
});
