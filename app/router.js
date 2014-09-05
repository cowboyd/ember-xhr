import Ember from 'ember';

var Router = Ember.Router.extend({
  location: EmberXhrENV.locationType
});

Router.map(function() {
});

export default Router;
