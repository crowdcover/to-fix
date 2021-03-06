'use strict';

var React = require('react');
var Reflux = require('reflux');
var actions = require('../../actions/actions');
var UserStore = require('../../stores/user_store');
var MapStore = require('../../stores/map_store');
var taskObj = require('../../mixins/taskobj');
var actions = require('../../actions/actions');

var Radio = require('react-btn-checkbox').Radio;

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
      showRoads: true
    }
  },


  edit: function() {
    actions.taskEdit(this.context.router.getCurrentParams().task);
    this.setState({showRoads: true});
  },

  noterror: function() {
      actions.taskNotError(this.context.router.getCurrentParams().task);
  },

  skip: function() {
    var task = this.context.router.getCurrentParams().task;
    actions.taskData(task);
    actions.taskSkip(task);
    this.setState({showRoads: true});
  },


  geolocate: function(placename) {
    this.setState({
      showRoads: true,
      placename: placename
    });
  },
  toggleRoads: function(options) {
    if (this.state.showRoads) {
       this.setState({
      showRoads: false
    });
     actions.mapRoadToggle(false);
    }else {
       this.setState({
      showRoads: true
    });
    actions.mapRoadToggle(true);
    }
    return options;
  },

  render: function() {
    var taskTitle = taskObj(this.context.router.getCurrentParams().task).title;


    /*var toggleRoads = (
      <div className="toggle-roads">
         <input onChange={this.toggleRoads} type="checkbox" id="toggleRoads" value="None" name="check" defaultChecked={true} />
         <label htmlFor="toggleRoads">Show Roads</label>
       </div>
    );*/


    var toggleRoads = (
      <div className="toggle-roads">
        <Radio label=""
          options={{"Show Roads": this.state.showRoads,"Hide Roads": !this.state.showRoads}}
          onChange={this.toggleRoads}/>
       </div>
    );

    var taskActions = (
      /* jshint ignore:start */
      <div className='col7 clearfix center'>
        <div className='col4 clearfix center'>
          {toggleRoads}
        </div>
        <div className='col4 clearfix center'>
          <a onClick={actions.userLogin} className='button round animate'>Get Started</a>
        </div>
        <div className='col4 clearfix center'>
          <a onClick={this.skip} className='button round animate'>Preview Another Task</a>
        </div>
      </div>
      /* jshint ignore:end */
    );

    if (this.state.user && this.state.user.auth) {
      taskActions = (
        /* jshint ignore:start */
        <div className='col7 clearfix center'>
          {toggleRoads}
          <button onClick={this.skip} className='button round animate' style={{margin: 'auto auto'}}>Skip / Too Difficult</button>
        </div>
        /* jshint ignore:end */
      );
    }

    return (
      /* jshint ignore:start */
      <div className='crowdsource-editbar col12 center' style={{height: '100%', backgroundColor: '#FFF'}}>

        <div className='col12' style={{height: '100%', paddingTop: '10px'}}>

          {taskActions}
            <div className='col5 center strong inline truncate'>
              Task: {taskTitle} {this.state.placename ? <span className='quiet icon marker'>{this.state.placename}</span> : ''}
              <p>Feedback/Questions: <a href="mailto:info@loggingroads.org<">info@loggingroads.org</a></p>

            </div>

        </div>

      </div>
      /* jshint ignore:end */
    );
  }
});
