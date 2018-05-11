'use strict';

const should = require('should');
const createApp = require('../src/create-app');
const createInput = require('../src/tools/create-input');
const dataTools = require('../src/tools/data');
const appDefinition = require('./userapp');

describe('create-app', () => {
  const testLogger = (/* message, data */) => {
    // console.log(message, data);
    return Promise.resolve({});
  };

  const app = createApp(appDefinition);

  const createTestInput = method => {
    const event = {
      bundle: {},
      method
    };

    return createInput(appDefinition, event, testLogger);
  };

  const createRawTestInput = event =>
    createInput(appDefinition, event, testLogger);

  it.only('should run legacy scripting', done => {
    const input = createTestInput(
      'resources.contactlegacy.list.operation.perform'
    );
    app(input)
      .then(output => {
        output.results.should.eql([{ id: 1234, name: 'hello world!' }]);
        done();
      })
      .catch(done);
  });

  it('should return data from promise', done => {
    const input = createTestInput(
      'resources.workingfuncpromise.list.operation.perform'
    );

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 3456 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from promise (direct)', done => {
    const input = createTestInput(
      'triggers.workingfuncpromiseList.operation.perform'
    );

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 3456 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from a sync function call', done => {
    const input = createTestInput('resources.list.list.operation.perform');

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from a sync function call (direct)', done => {
    const input = createTestInput('triggers.listList.operation.perform');

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 1234 }, { id: 5678 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from an async function call with callback', done => {
    const input = createTestInput(
      'resources.workingfuncasync.list.operation.perform'
    );

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 2345 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from an async function call with callback (direct)', done => {
    const input = createTestInput(
      'triggers.workingfuncasyncList.operation.perform'
    );

    app(input)
      .then(output => {
        output.results.should.eql([{ id: 2345 }]);
        done();
      })
      .catch(done);
  });

  it('should return data from live request call, applying HTTP before middleware', done => {
    const input = createTestInput('resources.contact.list.operation.perform');

    app(input)
      .then(output => {
        // zapier-httpbin.herokuapp.com/get puts request headers in the response body (good for testing):
        should.exist(output.results.headers);

        // verify that custom http before middleware was applied
        output.results.headers['X-Hashy'].should.eql(
          '1a3ba5251cb33ee7ade01af6a7b960b8'
        );
        output.results.headers['X-Author'].should.eql('One Cool Dev');

        done();
      })
      .catch(done);
  });

  it('should fail on a live request call', done => {
    const input = createTestInput(
      'resources.failerhttp.list.operation.perform'
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith(
          'Got 403 calling GET http://zapier-httpbin.herokuapp.com/status/403, expected 2xx.\nWhat happened:\n  Starting GET request to http://zapier-httpbin.herokuapp.com/status/403\n  Received 403 code from http://zapier-httpbin.herokuapp.com/status/403 after '
        );
        should(err.message).endWith(
          'ms\n  Received content ""\n  Got 403 calling GET http://zapier-httpbin.herokuapp.com/status/403, expected 2xx.'
        );
        done();
      })
      .catch(done);
  });

  it('should fail on a live request call (direct)', done => {
    const input = createTestInput('triggers.failerhttpList.operation.perform');

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith(
          'Got 403 calling GET http://zapier-httpbin.herokuapp.com/status/403, expected 2xx.\nWhat happened:\n  Starting GET request to http://zapier-httpbin.herokuapp.com/status/403\n  Received 403 code from http://zapier-httpbin.herokuapp.com/status/403 after '
        );
        should(err.message).endWith(
          'ms\n  Received content ""\n  Got 403 calling GET http://zapier-httpbin.herokuapp.com/status/403, expected 2xx.'
        );
        done();
      })
      .catch(done);
  });

  it('should make call via z.request', done => {
    const input = createTestInput('triggers.requestfuncList.operation.perform');

    app(input)
      .then(output => {
        output.results[0].headers['X-Hashy'].should.eql(
          '1a3ba5251cb33ee7ade01af6a7b960b8'
        );
        output.results[0].headers['X-Author'].should.eql('One Cool Dev');
        done();
      })
      .catch(done);
  });

  it('should make call via z.request with sugar url param', done => {
    const input = createTestInput(
      'triggers.requestsugarList.operation.perform'
    );

    app(input)
      .then(output => {
        output.results.headers['X-Hashy'].should.eql(
          '1a3ba5251cb33ee7ade01af6a7b960b8'
        );
        output.results.headers['X-Author'].should.eql('One Cool Dev');
        done();
      })
      .catch(done);
  });

  it('should fail on a sync function', done => {
    const input = createTestInput(
      'resources.failerfunc.list.operation.perform'
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith('Failer on sync function!');
        done();
      });
  });

  it('should fail on a sync function (direct)', done => {
    const input = createTestInput('triggers.failerfuncList.operation.perform');

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith('Failer on sync function!');
        done();
      });
  });

  it('should fail on promise function', done => {
    const input = createTestInput(
      'resources.failerfuncpromise.list.operation.perform'
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith('Failer on promise function!');
        done();
      });
  });

  it('should fail on promise function (direct)', done => {
    const input = createTestInput(
      'triggers.failerfuncpromiseList.operation.perform'
    );

    app(input)
      .then(() => {
        done('expected an error');
      })
      .catch(err => {
        should(err.message).startWith('Failer on promise function!');
        done();
      });
  });

  it('should apply HTTP after middleware', done => {
    const input = createTestInput(
      'resources.contacterror.listWithError.operation.perform'
    );

    app(input)
      .then(() => {
        done('expected an error, got success');
      })
      .catch(error => {
        error.name.should.eql('Error');
        done();
      });
  });

  it('should return data from live request call (direct)', done => {
    const input = createTestInput('triggers.contactList.operation.perform');
    app(input)
      .then(output => {
        output.results.url.should.eql(
          'http://zapier-httpbin.herokuapp.com/get'
        );
        output.results.headers['X-Hashy'].should.eql(
          '1a3ba5251cb33ee7ade01af6a7b960b8'
        );
        output.results.headers['X-Author'].should.eql('One Cool Dev');
        done();
      })
      .catch(done);
  });

  it('should return a rendered URL for OAuth2 authorizeURL', done => {
    const oauth2AppDefinition = dataTools.jsonCopy(appDefinition);
    oauth2AppDefinition.authentication = {
      type: 'oauth2',
      test: {
        url: 'http://example.com',
        method: 'GET'
      },
      oauth2Config: {
        authorizeUrl: {
          url: 'http://{{bundle.authData.domain}}.example.com',
          params: {
            scope: '{{bundle.inputData.scope}}'
          }
        },
        getAccessToken: {
          url: 'http://example.com/oauth2/token',
          body: {},
          method: 'POST'
        },
        autoRefresh: false
      }
    };
    const oauth2App = createApp(oauth2AppDefinition);
    const input = createTestInput('authentication.oauth2Config.authorizeUrl');
    input.bundle.authData = { domain: 'my-sub' };
    input.bundle.inputData = { scope: 'read,write' };

    oauth2App(input)
      .then(output => {
        output.results.should.eql(
          'http://my-sub.example.com?scope=read%2Cwrite'
        );
        done();
      })
      .catch(done);
  });

  it('should run a raw provided request', done => {
    const input = createRawTestInput({
      command: 'request',
      bundle: {
        request: {
          url: 'http://zapier-httpbin.herokuapp.com/get'
        }
      }
    });
    app(input)
      .then(output => {
        const response = output.results;
        JSON.parse(response.content).url.should.eql(
          'http://zapier-httpbin.herokuapp.com/get'
        );
        done();
      })
      .catch(done);
  });

  describe('HTTP after middleware for auth refresh', () => {
    it('should be applied to OAuth2 refresh app on shorthand requests', done => {
      const oauth2AppDefinition = dataTools.deepCopy(appDefinition);
      oauth2AppDefinition.authentication = {
        type: 'oauth2',
        test: {},
        oauth2Config: {
          authorizeUrl: {}, // stub, not needed for this test
          getAccessToken: {}, // stub, not needed for this test
          autoRefresh: true
        }
      };
      const oauth2App = createApp(oauth2AppDefinition);

      const event = {
        command: 'execute',
        bundle: {
          inputData: {
            url: 'http://zapier-httpbin.herokuapp.com/status/401'
          }
        },
        method: 'resources.executeRequestAsShorthand.list.operation.perform'
      };
      oauth2App(createInput(oauth2AppDefinition, event, testLogger))
        .then(() => {
          done('expected an error, got success');
        })
        .catch(error => {
          error.name.should.eql('RefreshAuthError');
          done();
        });
    });

    it('should be applied to OAuth2 refresh app on z.request in functions', done => {
      const oauth2AppDefinition = dataTools.deepCopy(appDefinition);
      oauth2AppDefinition.authentication = {
        type: 'oauth2',
        test: {},
        oauth2Config: {
          authorizeUrl: {}, // stub, not needed for this test
          getAccessToken: {}, // stub, not needed for this test
          autoRefresh: true
        }
      };
      const oauth2App = createApp(oauth2AppDefinition);

      const event = {
        command: 'execute',
        bundle: {
          inputData: {
            options: {
              url: 'http://zapier-httpbin.herokuapp.com/status/401'
            }
          }
        },
        method: 'resources.executeRequestAsFunc.list.operation.perform'
      };
      oauth2App(createInput(oauth2AppDefinition, event, testLogger))
        .then(() => {
          done('expected an error, got success');
        })
        .catch(error => {
          error.name.should.eql('RefreshAuthError');
          done();
        });
    });
  });

  describe('inputFields', () => {
    const testInputOutputFields = (desc, method) => {
      it(desc, done => {
        const input = createTestInput(method);
        input.bundle.key1 = 'key 1';
        input.bundle.key2 = 'key 2';
        input.bundle.key3 = 'key 3';

        app(input)
          .then(output => {
            output.results.should.eql([
              { key: 'key 1' },
              { key: 'key 2' },
              { key: 'key 3' }
            ]);
            done();
          })
          .catch(done);
      });
    };

    testInputOutputFields(
      'should return static input fields',
      'triggers.staticinputfieldsList.operation.inputFields'
    );

    testInputOutputFields(
      'should return dynamic sync input fields',
      'triggers.dynamicsyncinputfieldsList.operation.inputFields'
    );

    testInputOutputFields(
      'should return dynamic async input fields',
      'triggers.dynamicasyncinputfieldsList.operation.inputFields'
    );

    testInputOutputFields(
      'should return mix of static, sync function and promise inputFields',
      'triggers.mixedinputfieldsList.operation.inputFields'
    );

    testInputOutputFields(
      'should return static output fields',
      'triggers.staticinputfieldsList.operation.outputFields'
    );

    testInputOutputFields(
      'should return dynamic sync output fields',
      'triggers.dynamicsyncinputfieldsList.operation.outputFields'
    );

    testInputOutputFields(
      'should return dynamic async output fields',
      'triggers.dynamicasyncinputfieldsList.operation.outputFields'
    );

    testInputOutputFields(
      'should return mix of static, sync function and promise outputFields',
      'triggers.mixedinputfieldsList.operation.outputFields'
    );
  });

  describe('hydration', () => {
    it('should hydrate method', done => {
      const input = createTestInput(
        'resources.honkerdonker.list.operation.perform'
      );

      app(input)
        .then(output => {
          output.results.should.eql([
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":1}}|||hydrate',
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":2}}|||hydrate',
            'hydrate|||{"type":"method","method":"resources.honkerdonker.get.operation.perform","bundle":{"honkerId":3}}|||hydrate'
          ]);
          done();
        })
        .catch(done);
    });
  });
});
