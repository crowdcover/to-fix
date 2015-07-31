'use strict';

var Reflux = require('reflux');

var actions = Reflux.createActions({
  // Authentication based actions
  'userLogin': {},
  'userLogout': {},

  // Map state
  'baseLayerChange': {},
  'geolocated': {},
  'mapPositionUpdate': {},

  // Application settings
  'sidebarToggled': {},
  'editorPreference': {},

  // Application management
  'uploadTasks': {},

  // Modals
  'openSettings': {},
  'openUpload': {},
  'openSaveToOSM': {},

  // Dialogs
  'errorDialog': {},

  // Dashboard
  'graphUpdated': {},

  // to-fix task data
  'taskEdit': {},
  'taskData': {},
  'taskStats': {},
  'taskDone': {},
  'taskActivity': {},
  'taskActivityLoaded': {},
  'taskTotals': {},
  'taskSavedInOSM': {},

  'statSummaries': {},
  'updatePermalink': {},

  // common buttons
  'taskSkip': {},
  'taskNotError': {}
});

module.exports = actions;
