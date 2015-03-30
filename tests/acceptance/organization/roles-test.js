import Ember from 'ember';
import {
  module,
  test
} from 'qunit';
import startApp from 'diesel/tests/helpers/start-app';
import {stubRequest} from 'diesel/tests/helpers/fake-server';

let application;
let orgId = 'o1'; // FIXME this is hardcoded to match the value for signIn in aptible-helpers
let url = `/organizations/${orgId}/roles`;
let rolesUrl = url;

module('Acceptance: Organizations: Roles', {
  beforeEach: function() {
    application = startApp();
  },

  afterEach: function() {
    Ember.run(application, 'destroy');
  }
});

test(`visiting ${url} requires authentication`, () => {
  expectRequiresAuthentication(url);
});

test(`visiting ${url} shows roles`, (assert) => {
  assert.expect(3);

  stubOrganization({
    id: orgId,
    _links: {
      roles: {href: rolesUrl}
    }
  });

  let roles = [{
    id: 'role1',
    name: 'Owner'
  }];

  stubRequest('get', rolesUrl, function(request){
    assert.ok(true, `gets ${rolesUrl}`);
    return this.success({ _embedded: { roles }});
  });

  signInAndVisit(url);
  andThen(() => {
    equal(currentPath(), 'organization.roles.index');

    roles.forEach( (r) => {
      assert.ok(find(`:contains(${r.name})`).length,
                `shows role name "${r.name}"`);
    });
  });
});

test(`visit ${url} and click to add a user`, (assert) => {
  assert.expect(3);
  stubOrganization({
    id: orgId,
    _links: {
      roles: {href: rolesUrl}
    }
  });

  let role = {
    id: 'role1',
    name: 'Owner'
  };

  stubRequest('get', rolesUrl, function(request){
    return this.success({ _embedded: { roles: [role] }});
  });

  signInAndVisit(url);
  andThen(() => {
    assert.equal(currentPath(), 'organization.roles.index');
  });
  click(`a[title="Invite new user to ${role.name} by email"]`);
  andThen(() => {
    assert.equal(currentPath(), 'organization.invite');
    assert.equal(find('select').val(), role.name, 'role is selected');
  });
});

test(`visit ${url} and delete a role`, (assert) => {
  assert.expect(2);
  stubOrganization({
    id: orgId,
    _links: {
      roles: {href: rolesUrl}
    }
  });
  let role = {
    id: 'role1',
    name: 'Owner'
  };

  stubRequest('get', rolesUrl, function(request){
    assert.ok(true, `gets ${rolesUrl}`);
    return this.success({ _embedded: { roles: [role] }});
  });

  stubRequest('delete', `/roles/${role.id}`, function(request){
    assert.ok(true, `deletes the role`);
    return this.noContent();
  });

  signInAndVisit(url);
  click(`a[title="Delete ${role.name} role"]`);
  clickButton('confirm deletion');
});

test(`visit ${url} and click to show`, (assert) => {
  assert.expect(2);
  stubOrganization({
    id: orgId,
    _links: {
      roles: {href: rolesUrl}
    }
  });
  let role = {
    id: 'role1',
    name: 'Owner'
  };

  stubRequest('get', rolesUrl, function(request) {
    assert.ok(true, `gets ${rolesUrl}`);
    return this.success({ _embedded: {roles: [role]} });
  });
  stubStacks();

  signInAndVisit(url);
  click(`a[title="Edit ${role.name} Permissions"]`);
  andThen(() => {
    equal(currentPath(), 'organization.roles.show');
  });
});