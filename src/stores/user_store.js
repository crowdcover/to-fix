'use strict';

var Reflux = require('reflux');
var store = require('store');
var actions = require('../actions/actions');
var auth = require('../mixins/auth');
var JXON = require('../util/JXON');
var config = require('../config');
var _= require('lodash');

module.exports = Reflux.createStore({
  user: {},
  init: function() {
    this.user = {
      auth: auth.authenticated(),
      id: store.get('osmid'),
      username: store.get('username'),
      avatar: store.get('avatar')
    };
    this.listenTo(actions.userLogin, this.login);
    this.listenTo(actions.userLogout, this.logout);
  },

  getInitialState: function() {
    return this.user;
  },

  login: function() {
    var _this = this;
    auth.authenticate(function(err) {
      if (err) return console.error(err);
      auth.xhr({
        method: 'GET',
        path: '/api/0.6/user/details'
      }, function(err, details) {
        if (err) return console.error(err);
        details = details.getElementsByTagName('user')[0];
        var id = store.set('osmid', details.getAttribute('id')),
          username = store.set('username', details.getAttribute('display_name')),
          avatar = store.set('avatar', details.getElementsByTagName('img')[0].getAttribute('href'));

        _this.user = {
          auth: auth.authenticated(),
          id: store.get('osmid'),
          username: store.get('username'),
          avatar: store.get('avatar')
        };
        _this.trigger(_this.user);
      });
    });
  },

  logout: function() {
    auth.logout();
    this.user = {};
    this.trigger(this.user);
  },



  //Begin OSM Save Changeset support.
  // The code here is modifed from iD and, for now, is only indented to support changing tags on a single way



  // Generate Changeset XML. Returns a string.
  changesetJXON: function(tags) {
    return {
      osm: {
        changeset: {
          tag: _.map(tags, function(value, key) {
            return { '@k': key, '@v': value };
          }),
          '@version': 0.3,
          '@generator': 'iD'
        }
      }
    };
  },


  // Generate [osmChange](http://wiki.openstreetmap.org/wiki/OsmChange)
  // XML. Returns a string.
  osmChangeJXON: function(changeset_id, way) {

    return {
      osmChange: {
        '@version': 0.3,
        '@generator': 'fix.loggingroads.org',
        'modify': way.asJXON(changeset_id)
      }
      };
  },

  changesetTags: function(comment, imageryUsed) {
    var locale = navigator.language || navigator.userLanguage || 'en-US';
    var tags = {
      created_by: 'fix.loggingroads.org',
      imagery_used: imageryUsed.join(';').substr(0, 255),
      host: (window.location.origin + window.location.pathname).substr(0, 255),
      locale: locale,
    };

    if (comment) {
      tags.comment = comment.substr(0, 255);
    }

    return tags;
  },

  putChangeset: function(way, comment, imageryUsed, callback) {
    var me = this;
    auth.xhr({
      url: config.oauthUrl,
      method: 'PUT',
      path: '/api/0.6/changeset/create',
      options: { header: { 'Content-Type': 'text/xml' } },
      content: JXON.stringify(me.changesetJXON(me.changesetTags(comment, imageryUsed)))
    }, function(err, changeset_id) {
      if (err) return callback(err);
      auth.xhr({
        url: config.osmApi,
        method: 'POST',
        path: '/api/0.6/changeset/' + changeset_id + '/upload',
        options: { header: { 'Content-Type': 'text/xml' } },
        content: JXON.stringify(me.osmChangeJXON(changeset_id, way))
      }, function(err) {
        if (err) return callback(err);
        // POST was successful, safe to call the callback.
        // Still attempt to close changeset, but ignore response because #2667
        // Add delay to allow for postgres replication #1646 #2678
        window.setTimeout(function() {
          callback(null, changeset_id); 
        }, 2500);
        auth.xhr({
          url: config.oauthUrl,
          method: 'PUT',
          path: '/api/0.6/changeset/' + changeset_id + '/close'
        }, function(err) {

        });
      });
    });
  },
});
