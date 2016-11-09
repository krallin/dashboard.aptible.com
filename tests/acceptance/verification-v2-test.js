import Ember from 'ember';
import {module, test} from 'qunit';
import startApp from '../helpers/start-app';
import { stubRequest } from '../helpers/fake-server';

var App;

const challengeId = 'some-challenge-id';
const verificationCode = 'some-verification-code';
const verifyUrl = `/verify/${challengeId}/${verificationCode}`;

module('Acceptance: Verification (EmailVerificationChallenge workflow)', {
  beforeEach: function() {
    App = startApp();
  },
  afterEach: function() {
    Ember.run(App, 'destroy');
  }
});

test('visiting /verify/:challenge_id/:verification_code requires authentication', function() {
  expectRequiresAuthentication(verifyUrl);
});

test('visiting /verify/:challenge_id/:verification_code creates verification', function(assert) {
  assert.expect(4);
  stubStacks(); // For loading index
  stubOrganization();
  stubUser();

  stubRequest('post', '/verifications', function(request){
    const json = this.json(request);
    assert.equal(json.type, 'email_verification_challenge', 'type is sent');
    assert.equal(json.challenge_id, challengeId, 'challenge id is sent');
    assert.equal(json.verification_code, verificationCode, 'verification code is sent');
    return this.success({});
  });

  let userData = { verified: false };
  signInAndVisit(verifyUrl, userData);
  andThen(function(){
    assert.equal(currentPath(), 'requires-authorization.enclave.stack.apps.index');
  });
});

test('after verification, pending databases are provisioned', function(assert) {
  // TODO: Update as per https://github.com/aptible/dashboard.aptible.com/pull/774
  assert.expect(7);
  stubStacks(); // For loading index
  stubOrganization();
  let dbId = 'db-id';
  let diskSize = '10';

  let dbData = [{id: dbId, initialDiskSize: diskSize}];
  stubDatabases(dbData);

  stubRequest('post', '/verifications', function(request) {
    const json = this.json(request);
    assert.equal(json.type, 'email_verification_challenge', 'type is sent');
    assert.equal(json.challenge_id, challengeId, 'challenge id is sent');
    assert.equal(json.verification_code, verificationCode, 'verification code is sent');
    return this.success({});
  });

  stubUser({ id:'user-id', verified: true});

  stubRequest('post', `/databases/${dbId}/operations`, function(request){
    assert.ok(true, 'posts to create db provision op');
    let json = this.json(request);
    assert.equal(json.type, 'provision');
    assert.equal(json.disk_size, diskSize);

    return this.success({
      id: 'op-id',
      type: json.type
    });
  });

  stubRequest('get', `/operations/op-id`, function(){
    return this.success(201, {id: 'op-id', status: 'succeeded'});
  });

  signInAndVisit(verifyUrl);
  andThen(function(){
    assert.equal(currentPath(), 'requires-authorization.enclave.stack.apps.index');
  });
});

test('failed verification directs to error page', function(assert) {
  assert.expect(4);

  stubRequest('post', '/verifications', function(request){
    const json = this.json(request);
    assert.equal(json.type, 'email_verification_challenge', 'type is sent');
    assert.equal(json.challenge_id, challengeId, 'challenge id is sent');
    assert.equal(json.verification_code, verificationCode, 'verification code is sent');
    return this.error(401, {});
  });

  signInAndVisit(verifyUrl);

  andThen(function(){
    assert.equal(currentPath(), 'error');
  });
});

// TODO(EmailVerificationChallenge): Grab the 'visiting / when not verified
// shows verification message with resend button' test from the legacy workflow
// once we update that to use the
// new workflow and create an EmailVerificationChallenge.
