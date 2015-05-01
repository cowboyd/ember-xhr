import Ember from 'ember';
import XHR from 'ember-xhr';

export default Ember.Route.extend({
  actions: {
    performUpload: function(files) {
      var requests = Ember.A();
      for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var xhr = XHR.create();
        xhr.open('POST', 'http://posttestserver.com/post.php', true);
        xhr.send(file);
        xhr.set('file', file);
        requests.pushObject(xhr);
      }
      this.set('controller.requests', requests);
    }
  }
});
