import Ember from 'ember';

export default Ember.View.extend({
  change: function(e) {
    this.get('controller').send('performUpload', e.target.files);
  }
});
