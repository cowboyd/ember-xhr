import Ember from 'ember';
import XHR from 'ember-xhr/models/xhr';

export default Ember.Controller.extend({
  xhr: XHR.create(),
  bindUploadFile: Ember.observer(function() {
    this.set('uploadFile', function(e) {
      var xhr = this.get('xhr');

      var file = e.target.files[0];
      var data = new FormData();
      data.append('file', file, file.name);
      xhr.open('POST', 'http://posttestserver.com/post.php');
      xhr.send(data);
    }.bind(this));
  }).on('init'),
  actions: {
    abort: function() {
      this.get('xhr').abort();
    }
  }
});
