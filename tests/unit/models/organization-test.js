import {
  moduleForModel,
  test
} from 'ember-qunit';
import modelDeps from '../../support/common-model-dependencies';
import Ember from "ember";

moduleForModel('organization', 'model:organization', {
  // Specify the other units that are required for this test.
  needs: modelDeps
});

test('it exists', function() {
  var model = this.subject();
  ok(!!model);
});
