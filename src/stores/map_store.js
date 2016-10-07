'use strict';

var Reflux = require('reflux');
var actions = require('../actions/actions');
var store = require('store');
var xhr = require('xhr');

var taskObj = require('../mixins/taskobj');
var emitError = require('../mixins/error');
var postToTaskServer = require('../mixins/taskserver').post;

var iD = require('../util/idWay');


var config = require('../config');

module.exports = Reflux.createStore({
  data: {},

  init: function() {
    this.data = {
      key: '',
      value: {},
      mapData: [],
      position: {
        center: {},
        zoom: {}
      },
      showRoads: true,
      baseLayer: store.get('baseLayer') ? store.get('baseLayer') : null
    };
    this.listenTo(actions.taskData, this.taskData);
    this.listenTo(actions.taskDone, this.taskDone);
    this.listenTo(actions.baseLayerChange, this.baseLayerChange);
    this.listenTo(actions.taskSkip, this.taskSkip);
    this.listenTo(actions.taskEdit, this.taskEdit);
    this.listenTo(actions.taskNotError, this.taskNotError);
    this.listenTo(actions.mapRoadToggle, this.mapRoadToggle);
  },

  getInitialState: function() {
    return this.data;
  },



  taskDone: function(task) {
    var _this = this;
    postToTaskServer('fixed/' + task, {
      user: store.get('username'),
      key: this.data.key
    }, function(err, res) {
      if (err) return emitError(err);
        _this.taskData(task);
        this.data.position = {
          center: {},
          zoom: {}
        };
        this.data.showRoads = true;
    }.bind(this));
  },

  taskNotError: function(task) {
    var _this = this;
    postToTaskServer('noterror/' + task, {
      user: store.get('username'),
      key: this.data.key
    }, function(err, res) {
      if (err) return emitError(err);
        _this.taskData(task);
        this.data.position = {
          center: {},
          zoom: {}
        };
        this.data.showRoads = true;
    }.bind(this));
  },

  taskData: function(task) {
    task = taskObj(task);
    var _this = this;
    // Clear out what mapData there is
    this.data.mapData = [];
    postToTaskServer('task/' + task.id, {
      user: store.get('username')
    }, function(err, res) {
      if (err) return emitError(err);
      _this.data.key = res.key;
      _this.data.value = res.value;

      switch (task.source) {
        case 'loggingroads':
          _this.fetchLoggingRoads(function(err, res) {
            if (err) {
              emitError(err);
              return _this.taskDone(task.id);
            }
            _this.trigger(_this.data);
            actions.osmDataLoaded();
          });
          break;
      }
    });
  },


  fetchLoggingRoads: function(cb) {
    var _this = this;
    var uri = ''
    if (config.devApi) {
      //when testing on dev api just use a test way
      uri = config.osmApi + 'way/4297845777/full';
    } else {
      uri = config.osmApi + 'way/' + _this.data.value.way_id + '/full';
    }


    xhr({uri: uri, responseType: 'document'}, function(err, res) {
      if (err || res.statusCode != 200) return cb(err || { status: res.statusCode });
      _this.data.mapData.push(res.body);
      _this.data.iDEntity = _this.parse(res.body);
      cb(null);
    });

  },

    getNodes: function(obj) {
    var elems = obj.getElementsByTagName('nd'),
      nodes = new Array(elems.length);
    for (var i = 0, l = elems.length; i < l; i++) {
      nodes[i] = 'n' + elems[i].attributes.ref.value;
    }
    return nodes;
  },

   getTags: function(obj) {
    var elems = obj.getElementsByTagName('tag'),
      tags = {};
    for (var i = 0, l = elems.length; i < l; i++) {
      var attrs = elems[i].attributes;
      tags[attrs.k.value] = attrs.v.value;
    }
    return tags;
  },

  getVisible: function(attrs) {
    return (!attrs.visible || attrs.visible.value !== 'false');
  },

  parseWayHelper: function (obj) {
    var attrs = obj.attributes;
    var _this = this;
    return new iD.Way({
      id: iD.Entity.id.fromOSM('way', attrs.id.value),
      version: attrs.version.value,
      user: attrs.user && attrs.user.value,
      tags: _this.getTags(obj),
      nodes: _this.getNodes(obj),
      visible: _this.getVisible(attrs)
    });
  },

  parse: function(dom) {
  if (!dom || !dom.childNodes) return;

  var root = dom.childNodes[0],
    children = root.childNodes,
    entities = [];

  for (var i = 0, l = children.length; i < l; i++) {
    var child = children[i];
    if(child.nodeName == 'way') {
      entities.push(this.parseWayHelper(child));
    }

  }

  return entities;
},

  baseLayerChange: function(name) {
    store.set('baseLayer', name);
  },

  taskSkip: function(task) {
    track(task, {
      user: store.get('username'),
      action: 'skip',
      key: this.data.key
    });

    this.data.showRoads = true;
  },

  mapRoadToggle: function(showRoads) {
    this.data.showRoads = showRoads;
  },

  taskEdit: function(task) {
    track(task, {
      user: store.get('username'),
      action: 'edit',
      key: this.data.key,
      editor: store.get('editor')
    });
  }
});

function track(task, attributes) {
    postToTaskServer('track/' + task, {
      attributes: attributes
    }, function(err, res) {
      if (err) console.log(err);
    });
}
