import Ember from 'ember';

export default Ember.Route.extend({
  redirect: function() {
    let stack = this.modelFor('stack');

    if(stack.get('activated')) {
      this.transitionTo('apps');
    } else {
      this.transitionTo('stack.activate');
    }
  }
});
